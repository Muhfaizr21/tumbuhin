package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"tumbuhin-backend/models"
	"tumbuhin-backend/repositories"
	"tumbuhin-backend/services"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// UserController handles HTTP requests for user-related endpoints
type UserController struct {
	service services.UserService
}

// NewUserController creates a new instance of UserController
func NewUserController(service services.UserService) *UserController {
	return &UserController{
		service: service,
	}
}

// GetAll handles GET /api/v1/users
func (ctrl *UserController) GetAll(c *gin.Context) {
	users, err := ctrl.service.GetAllUsers()
	if err != nil {
		views.InternalServerError(c, "Failed to retrieve users")
		return
	}

	views.Success(c, http.StatusOK, "Users retrieved successfully", users)
}

// GetByID handles GET /api/v1/users/:id
func (ctrl *UserController) GetByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		views.BadRequest(c, "Invalid user ID format", err.Error())
		return
	}

	user, err := ctrl.service.GetUserByID(id)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			views.NotFound(c, "User not found")
			return
		}
		views.InternalServerError(c, "Failed to fetch user details")
		return
	}

	views.Success(c, http.StatusOK, "User retrieved successfully", user)
}

// Create handles POST /api/v1/users
func (ctrl *UserController) Create(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Invalid input validation failed", err.Error())
		return
	}

	newUser, err := ctrl.service.CreateUser(req)
	if err != nil {
		if errors.Is(err, repositories.ErrUserAlreadyExists) {
			views.Error(c, http.StatusConflict, "Email already in use", err.Error())
			return
		}
		views.BadRequest(c, err.Error(), nil)
		return
	}

	views.Success(c, http.StatusCreated, "User created successfully", newUser)
}

// Update handles PUT /api/v1/users/:id
func (ctrl *UserController) Update(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		views.BadRequest(c, "Invalid user ID format", err.Error())
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Invalid input validation failed", err.Error())
		return
	}

	updatedUser, err := ctrl.service.UpdateUser(id, req)
	if err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			views.NotFound(c, "User not found")
			return
		}
		if errors.Is(err, repositories.ErrUserAlreadyExists) {
			views.Error(c, http.StatusConflict, "Email already in use by another user", err.Error())
			return
		}
		views.BadRequest(c, err.Error(), nil)
		return
	}

	views.Success(c, http.StatusOK, "User updated successfully", updatedUser)
}

// Delete handles DELETE /api/v1/users/:id
func (ctrl *UserController) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		views.BadRequest(c, "Invalid user ID format", err.Error())
		return
	}

	if err := ctrl.service.DeleteUser(id); err != nil {
		if errors.Is(err, repositories.ErrUserNotFound) {
			views.NotFound(c, "User not found")
			return
		}
		views.InternalServerError(c, "Failed to delete user")
		return
	}

	views.Success(c, http.StatusOK, "User deleted successfully", nil)
}
