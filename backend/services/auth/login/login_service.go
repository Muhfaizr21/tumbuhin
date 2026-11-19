package login

import (
	"context"
	"errors"
	"strings"

	"tumbuhin-backend/middlewares"
	"tumbuhin-backend/models"
	authRepo "tumbuhin-backend/repositories/auth"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("email/nomor HP atau kata sandi tidak sesuai")
	ErrAccountDisabled    = errors.New("akun ini sedang dinonaktifkan oleh administrator")
)

// Service defines the business contract for login operations
type Service interface {
	Authenticate(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error)
	GetCurrentUser(ctx context.Context, userID int64) (*models.User, error)
}

type loginService struct {
	repo      authRepo.AuthRepository
	jwtSecret string
}

// NewService creates a new instance of login Service
func NewService(repo authRepo.AuthRepository, jwtSecret string) Service {
	return &loginService{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

func (s *loginService) Authenticate(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	identifier := strings.TrimSpace(req.Identifier)
	if identifier == "" {
		if strings.TrimSpace(req.Email) != "" {
			identifier = strings.TrimSpace(req.Email)
		} else {
			identifier = strings.TrimSpace(req.Phone)
		}
	}

	if identifier == "" || req.Password == "" {
		return nil, ErrInvalidCredentials
	}

	user, err := s.repo.FindByIdentifier(ctx, identifier)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if !user.IsActive {
		return nil, ErrAccountDisabled
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := middlewares.GenerateJWT(s.jwtSecret, *user)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token:      token,
		RedirectTo: models.RoleRedirectPath(user.Role),
		User:       *user,
	}, nil
}

func (s *loginService) GetCurrentUser(ctx context.Context, userID int64) (*models.User, error) {
	return s.repo.FindByID(ctx, userID)
}
