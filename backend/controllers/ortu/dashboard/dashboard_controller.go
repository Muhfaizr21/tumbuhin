package dashboard

import (
	"errors"
	"net/http"
	"strings"

	"tumbuhin-backend/middlewares"
	"tumbuhin-backend/models"
	ortuDashRepo "tumbuhin-backend/repositories/ortu/dashboard"
	ortuDashService "tumbuhin-backend/services/ortu/dashboard"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Orang Tua Balita portal & Magic Link
type Controller struct {
	service ortuDashService.Service
}

// NewController instantiates a new Ortu dashboard Controller
func NewController(service ortuDashService.Service) *Controller {
	return &Controller{service: service}
}

// HandleGetPortal processes GET /api/v1/ortu/dashboard and GET /api/v1/public/child/:magicToken
func (ctrl *Controller) HandleGetPortal(c *gin.Context) {
	magicToken := c.Param("magicToken")
	if magicToken == "" {
		magicToken = c.Query("magic_token")
	}
	if magicToken == "" {
		magicToken = "magic-balita-andi-2026-tumbuhin-sehat"
	}

	data, err := ctrl.service.GetChildCard(c.Request.Context(), magicToken)
	if err != nil {
		if errors.Is(err, ortuDashRepo.ErrNotFound) {
			views.NotFound(c, "Data balita dengan Magic Link tersebut tidak ditemukan atau tautan sudah tidak aktif")
			return
		}
		views.InternalServerError(c, "Gagal memuat Kartu Gizi Digital balita")
		return
	}

	views.Success(c, http.StatusOK, "Kartu Gizi Digital balita berhasil dimuat", data)
}

// HandleListMyChildren processes GET /api/v1/ortu/children
func (ctrl *Controller) HandleListMyChildren(c *gin.Context) {
	claims := middlewares.ClaimsFromContext(c)
	if claims == nil || claims.UserID <= 0 {
		views.Unauthorized(c, "Sesi login orang tua tidak ditemukan")
		return
	}

	items, err := ctrl.service.GetMyChildren(c.Request.Context(), claims.UserID)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat daftar anak untuk akun Anda")
		return
	}

	views.Success(c, http.StatusOK, "Daftar anak berhasil dimuat", items)
}

// HandleGetChildDashboard processes GET /api/v1/ortu/children/:childId/dashboard
func (ctrl *Controller) HandleGetChildDashboard(c *gin.Context) {
	claims := middlewares.ClaimsFromContext(c)
	if claims == nil || claims.UserID <= 0 {
		views.Unauthorized(c, "Sesi login orang tua tidak ditemukan")
		return
	}

	childID := c.Param("childId")
	if strings.TrimSpace(childID) == "" {
		views.BadRequest(c, "ID balita tidak valid", nil)
		return
	}

	allowBypass := strings.EqualFold(claims.Role, models.RoleAdmin) ||
		strings.EqualFold(claims.Role, models.RoleBidan) ||
		strings.EqualFold(claims.Role, models.RoleKader)

	data, err := ctrl.service.GetChildCardByID(c.Request.Context(), childID, claims.UserID, allowBypass)
	if err != nil {
		if errors.Is(err, ortuDashRepo.ErrForbidden) {
			views.Forbidden(c, err.Error())
			return
		}
		if errors.Is(err, ortuDashRepo.ErrNotFound) {
			views.NotFound(c, "Data balita tidak ditemukan")
			return
		}
		views.InternalServerError(c, "Gagal memuat Kartu Gizi Digital balita")
		return
	}

	views.Success(c, http.StatusOK, "Kartu Gizi Digital balita berhasil dimuat", data)
}
