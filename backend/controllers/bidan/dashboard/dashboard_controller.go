package dashboard

import (
	"net/http"

	"tumbuhin-backend/middlewares"
	bidanDashService "tumbuhin-backend/services/bidan/dashboard"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Bidan Desa dashboard
type Controller struct {
	service bidanDashService.Service
}

// NewController instantiates a new Bidan dashboard Controller
func NewController(service bidanDashService.Service) *Controller {
	return &Controller{service: service}
}

// HandleGetOverview processes GET /api/v1/bidan/dashboard
func (ctrl *Controller) HandleGetOverview(c *gin.Context) {
	villageName := "Desa Sukamaju"

	// Dynamic village extraction from authenticated claims
	if claimsVal, exists := c.Get("user_claims"); exists {
		if claims, ok := claimsVal.(*middlewares.JWTClaims); ok && claims.VillageName != "" {
			villageName = claims.VillageName
		}
	}

	data, err := ctrl.service.GetOverview(c.Request.Context(), villageName)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat ringkasan epidemiologi bidan")
		return
	}

	views.Success(c, http.StatusOK, "Ringkasan epidemiologi Bidan Desa berhasil dimuat", data)
}
