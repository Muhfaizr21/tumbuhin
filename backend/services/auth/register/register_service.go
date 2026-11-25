package register

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"tumbuhin-backend/middlewares"
	"tumbuhin-backend/models"
	authRepo "tumbuhin-backend/repositories/auth"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrMissingIdentity = errors.New("nama lengkap serta email atau nomor telepon wajib diisi")
)

// Service defines the business contract for account registration
type Service interface {
	Register(ctx context.Context, req models.RegisterRequest) (*models.AuthResponse, error)
}

type registerService struct {
	repo      authRepo.AuthRepository
	jwtSecret string
}

// NewService creates a new instance of register Service
func NewService(repo authRepo.AuthRepository, jwtSecret string) Service {
	return &registerService{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

func (s *registerService) Register(ctx context.Context, req models.RegisterRequest) (*models.AuthResponse, error) {
	fullName := strings.TrimSpace(req.FullName)
	if fullName == "" {
		fullName = strings.TrimSpace(req.Name)
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	phone := strings.TrimSpace(req.Phone)

	if fullName == "" || (email == "" && phone == "") {
		return nil, ErrMissingIdentity
	}

	// Ensure both email and phone have unique values for database constraints
	if email == "" && phone != "" {
		cleanDigits := strings.ReplaceAll(phone, "+", "")
		email = fmt.Sprintf("%s@posyandu.tumbuhin.id", cleanDigits)
	}
	if phone == "" && email != "" {
		phone = fmt.Sprintf("08%d", time.Now().UnixNano()%10000000000)
	}

	hashedPass, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	normalizedRole := models.NormalizeRole(req.Role)
	posyanduName := strings.TrimSpace(req.PosyanduName)
	if posyanduName == "" {
		posyanduName = "Posyandu Melati 04"
	}
	villageName := strings.TrimSpace(req.VillageName)
	if villageName == "" {
		villageName = "Desa Sukamaju"
	}

	magicToken := ""
	if normalizedRole == models.RoleOrtu {
		hash := sha256.Sum256([]byte(fmt.Sprintf("%s-%s-%d", email, phone, time.Now().UnixNano())))
		magicToken = "magic-" + hex.EncodeToString(hash[:16])
	}

	newUser := &models.User{
		FullName:     fullName,
		Name:         fullName,
		Email:        email,
		Phone:        phone,
		PasswordHash: string(hashedPass),
		Role:         normalizedRole,
		PosyanduName: posyanduName,
		VillageName:  villageName,
		MagicToken:   magicToken,
		IsActive:     true,
	}

	createdUser, err := s.repo.CreateUser(ctx, newUser)
	if err != nil {
		return nil, err
	}

	token, err := middlewares.GenerateJWT(s.jwtSecret, *createdUser)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token:      token,
		RedirectTo: models.RoleRedirectPath(createdUser.Role),
		User:       *createdUser,
	}, nil
}
