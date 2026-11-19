package login

import (
	"errors"
	"net/http"

	"tumbuhin-backend/models"
	loginService "tumbuhin-backend/services/auth/login"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for login and session verification
type Controller struct {
	service loginService.Service
}

// NewController instantiates a new login Controller
func NewController(service loginService.Service) *Controller {
	return &Controller{service: service}
}

// HandleLogin processes POST /api/v1/auth/login
func (ctrl *Controller) HandleLogin(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Format input login tidak valid", err.Error())
		return
	}

	resp, err := ctrl.service.Authenticate(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, loginService.ErrInvalidCredentials) {
			views.Unauthorized(c, err.Error())
			return
		}
		if errors.Is(err, loginService.ErrAccountDisabled) {
			views.Forbidden(c, err.Error())
			return
		}
		views.InternalServerError(c, "Terjadi gangguan pada server autentikasi")
		return
	}

	views.Success(c, http.StatusOK, "Autentikasi berhasil", resp)
}

// HandleMe processes GET /api/v1/auth/me
func (ctrl *Controller) HandleMe(c *gin.Context) {
	uidVal, exists := c.Get("user_id")
	if !exists {
		views.Unauthorized(c, "Sesi tidak ditemukan")
		return
	}

	userID, ok := uidVal.(int64)
	if !ok {
		views.Unauthorized(c, "ID sesi tidak valid")
		return
	}

	user, err := ctrl.service.GetCurrentUser(c.Request.Context(), userID)
	if err != nil {
		views.NotFound(c, "Profil pengguna tidak ditemukan")
		return
	}

	views.Success(c, http.StatusOK, "Profil sesi aktif", gin.H{
		"user":        user,
		"redirect_to": models.RoleRedirectPath(user.Role),
	})
}
