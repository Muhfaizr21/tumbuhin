package services

import (
	"errors"
	"strings"

	"tumbuhin-backend/models"
	"tumbuhin-backend/repositories"
)

var (
	ErrInvalidEmail = errors.New("email is invalid")
	ErrInvalidName  = errors.New("name must not be empty")
)

// UserService defines the business logic interface for user operations
type UserService interface {
	GetAllUsers() ([]models.User, error)
	GetUserByID(id int64) (*models.User, error)
	CreateUser(req models.CreateUserRequest) (*models.User, error)
	UpdateUser(id int64, req models.UpdateUserRequest) (*models.User, error)
	DeleteUser(id int64) error
}

type userService struct {
	repo repositories.UserRepository
}

// NewUserService instantiates a new UserService implementation
func NewUserService(repo repositories.UserRepository) UserService {
	return &userService{
		repo: repo,
	}
}

func (s *userService) GetAllUsers() ([]models.User, error) {
	return s.repo.FindAll()
}

func (s *userService) GetUserByID(id int64) (*models.User, error) {
	return s.repo.FindByID(id)
}

func (s *userService) CreateUser(req models.CreateUserRequest) (*models.User, error) {
	cleanName := strings.TrimSpace(req.Name)
	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	if cleanName == "" {
		return nil, ErrInvalidName
	}
	if cleanEmail == "" {
		return nil, ErrInvalidEmail
	}

	role := req.Role
	if role == "" {
		role = "member"
	}

	newUser := &models.User{
		Name:  cleanName,
		Email: cleanEmail,
		Role:  role,
	}

	return s.repo.Create(newUser)
}

func (s *userService) UpdateUser(id int64, req models.UpdateUserRequest) (*models.User, error) {
	updateData := &models.User{
		Name:  strings.TrimSpace(req.Name),
		Email: strings.ToLower(strings.TrimSpace(req.Email)),
		Role:  strings.TrimSpace(req.Role),
	}

	return s.repo.Update(id, updateData)
}

func (s *userService) DeleteUser(id int64) error {
	return s.repo.Delete(id)
}
