package dashboard

import (
	"errors"
	"net/http"

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
	data, err := ctrl.service.GetChildCard(c.Request.Context(), magicToken)
	if err != nil {
		if errors.Is(err, ortuDashRepo.ErrChildNotFound) {
			views.NotFound(c, "Kartu Gizi Digital tidak ditemukan atau tautan sudah tidak berlaku")
			return
		}
		views.InternalServerError(c, "Gagal memuat Kartu Gizi Digital balita")
		return
	}

	views.Success(c, http.StatusOK, "Kartu Gizi Digital balita berhasil dimuat", data)
}
