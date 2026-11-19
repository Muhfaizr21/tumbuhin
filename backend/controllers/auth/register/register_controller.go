package register

import (
	"errors"
	"net/http"

	"tumbuhin-backend/models"
	authRepo "tumbuhin-backend/repositories/auth"
	registerService "tumbuhin-backend/services/auth/register"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for user registration
type Controller struct {
	service registerService.Service
}

// NewController instantiates a new register Controller
func NewController(service registerService.Service) *Controller {
	return &Controller{service: service}
}

// HandleRegister processes POST /api/v1/auth/register
func (ctrl *Controller) HandleRegister(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Data pendaftaran belum lengkap (kata sandi minimal 6 karakter)", err.Error())
		return
	}

	resp, err := ctrl.service.Register(c.Request.Context(), req)
	if err != nil {
		if errors.Is(err, registerService.ErrMissingIdentity) {
			views.BadRequest(c, err.Error(), nil)
			return
		}
		if errors.Is(err, authRepo.ErrUserAlreadyExists) {
			views.Error(c, http.StatusConflict, err.Error(), nil)
			return
		}
		views.InternalServerError(c, "Gagal mendaftarkan akun baru")
		return
	}

	views.Success(c, http.StatusCreated, "Pendaftaran akun berhasil", resp)
}
