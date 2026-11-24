package dashboard

import (
	"net/http"

	adminDashService "tumbuhin-backend/services/admin/dashboard"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Super Admin dashboard overview (Module 3.1)
type Controller struct {
	service adminDashService.Service
}

// NewController instantiates a new Admin dashboard Controller
func NewController(service adminDashService.Service) *Controller {
	return &Controller{service: service}
}

// HandleGetOverview processes GET /api/v1/admin/dashboard
func (ctrl *Controller) HandleGetOverview(c *gin.Context) {
	data, err := ctrl.service.GetOverview(c.Request.Context())
	if err != nil {
		views.InternalServerError(c, "Gagal memuat ringkasan sistem admin: "+err.Error())
		return
	}
	views.Success(c, http.StatusOK, "Ringkasan sistem Super Admin berhasil dimuat", data)
}
