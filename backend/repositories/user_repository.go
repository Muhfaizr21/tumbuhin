package repositories

import (
	"errors"
	"sync"
	"time"

	"tumbuhin-backend/models"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user with this email already exists")
)

// UserRepository defines the contract for user data persistence
type UserRepository interface {
	FindAll() ([]models.User, error)
	FindByID(id int64) (*models.User, error)
	FindByEmail(email string) (*models.User, error)
	Create(user *models.User) (*models.User, error)
	Update(id int64, user *models.User) (*models.User, error)
	Delete(id int64) error
}

// inMemoryUserRepository is a thread-safe in-memory implementation of UserRepository
type inMemoryUserRepository struct {
	mu     sync.RWMutex
	users  map[int64]models.User
	nextID int64
}

// NewInMemoryUserRepository creates and initializes an in-memory repository with initial seed data
func NewInMemoryUserRepository() UserRepository {
	now := time.Now()
	repo := &inMemoryUserRepository{
		users:  make(map[int64]models.User),
		nextID: 1,
	}

	// Seed sample user
	seedUser := models.User{
		ID:        1,
		Name:      "Admin Tumbuhin",
		Email:     "admin@tumbuhin.id",
		Role:      "admin",
		CreatedAt: now,
		UpdatedAt: now,
	}
	repo.users[1] = seedUser
	repo.nextID = 2

	return repo
}

func (r *inMemoryUserRepository) FindAll() ([]models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]models.User, 0, len(r.users))
	for _, user := range r.users {
		result = append(result, user)
	}
	return result, nil
}

func (r *inMemoryUserRepository) FindByID(id int64) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, exists := r.users[id]
	if !exists {
		return nil, ErrUserNotFound
	}
	return &user, nil
}

func (r *inMemoryUserRepository) FindByEmail(email string) (*models.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, user := range r.users {
		if user.Email == email {
			return &user, nil
		}
	}
	return nil, ErrUserNotFound
}

func (r *inMemoryUserRepository) Create(user *models.User) (*models.User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, existing := range r.users {
		if existing.Email == user.Email {
			return nil, ErrUserAlreadyExists
		}
	}

	now := time.Now()
	user.ID = r.nextID
	r.nextID++
	user.CreatedAt = now
	user.UpdatedAt = now

	r.users[user.ID] = *user
	return user, nil
}

func (r *inMemoryUserRepository) Update(id int64, updated *models.User) (*models.User, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	user, exists := r.users[id]
	if !exists {
		return nil, ErrUserNotFound
	}

	if updated.Name != "" {
		user.Name = updated.Name
	}
	if updated.Email != "" {
		// check if email belongs to someone else
		for uid, existing := range r.users {
			if uid != id && existing.Email == updated.Email {
				return nil, ErrUserAlreadyExists
			}
		}
		user.Email = updated.Email
	}
	if updated.Role != "" {
		user.Role = updated.Role
	}
	user.UpdatedAt = time.Now()

	r.users[id] = user
	return &user, nil
}

func (r *inMemoryUserRepository) Delete(id int64) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.users[id]; !exists {
		return ErrUserNotFound
	}

	delete(r.users, id)
	return nil
}
