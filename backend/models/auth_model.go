package models

import "strings"

// LoginRequest represents the payload for user authentication
type LoginRequest struct {
	Identifier string `json:"identifier"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Password   string `json:"password" binding:"required"`
}

// RegisterRequest represents the payload for registering a new user account
type RegisterRequest struct {
	FullName     string `json:"full_name"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Password     string `json:"password" binding:"required,min=6"`
	Role         string `json:"role"`
	PosyanduName string `json:"posyandu_name"`
	VillageName  string `json:"village_name"`
}

// AuthResponse is returned after successful login or registration
type AuthResponse struct {
	Token      string `json:"token"`
	RedirectTo string `json:"redirect_to"`
	User       User   `json:"user"`
}

// NormalizeRole normalizes various clinical/field role inputs into the 4 core RBAC roles
func NormalizeRole(rawRole string) string {
	r := strings.ToLower(strings.TrimSpace(rawRole))
	switch r {
	case RoleKader:
		return RoleKader
	case RoleBidan, "puskesmas", "dokter", "nakes":
		return RoleBidan
	case RoleAdmin, "superadmin", "super_admin":
		return RoleAdmin
	case RoleOrtu, "parent", "orang_tua", "public":
		return RoleOrtu
	default:
		return RoleKader
	}
}

// RoleRedirectPath returns the target frontend dashboard path for each of the 4 roles
func RoleRedirectPath(role string) string {
	switch NormalizeRole(role) {
	case RoleKader:
		return "/kader/dashboard"
	case RoleBidan:
		return "/bidan/dashboard"
	case RoleAdmin:
		return "/admin/dashboard"
	case RoleOrtu:
		return "/ortu/dashboard"
	default:
		return "/kader/dashboard"
	}
}
