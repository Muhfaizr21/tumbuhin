package dashboard

import (
	"net/http"

	kaderDashService "tumbuhin-backend/services/kader/dashboard"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Kader Posyandu dashboard
type Controller struct {
	service kaderDashService.Service
}

// NewController instantiates a new Kader dashboard Controller
func NewController(service kaderDashService.Service) *Controller {
	return &Controller{service: service}
}

// HandleGetOverview processes GET /api/v1/kader/dashboard
func (ctrl *Controller) HandleGetOverview(c *gin.Context) {
	data, err := ctrl.service.GetOverview(c.Request.Context(), "Posyandu Melati 04")
	if err != nil {
		views.InternalServerError(c, "Gagal memuat ringkasan dasbor kader")
		return
	}

	views.Success(c, http.StatusOK, "Ringkasan dasbor Kader Posyandu berhasil dimuat", data)
}
