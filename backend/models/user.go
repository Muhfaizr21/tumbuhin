package models

import "time"

const (
	RoleKader = "kader"
	RoleBidan = "bidan"
	RoleAdmin = "admin"
	RoleOrtu  = "ortu"
)

// User represents the core user entity in the Tumbuhin system
type User struct {
	ID           int64     `json:"id"`
	UUID         string    `json:"uuid,omitempty"`
	Name         string    `json:"name"`
	FullName     string    `json:"full_name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	PosyanduID   string    `json:"posyandu_id,omitempty"`
	PosyanduName string    `json:"posyandu_name,omitempty"`
	VillageName  string    `json:"village_name"`
	MagicToken   string    `json:"magic_token,omitempty"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// CreateUserRequest represents the payload for creating a new user
type CreateUserRequest struct {
	Name  string `json:"name" binding:"required,min=2,max=100"`
	Email string `json:"email" binding:"required,email"`
	Role  string `json:"role"`
}

// UpdateUserRequest represents the payload for updating an existing user
type UpdateUserRequest struct {
	Name  string `json:"name" binding:"omitempty,min=2,max=100"`
	Email string `json:"email" binding:"omitempty,email"`
	Role  string `json:"role"`
}
