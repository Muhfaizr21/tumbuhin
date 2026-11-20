package petagis

import (
	"net/http"

	"tumbuhin-backend/middlewares"
	petagisService "tumbuhin-backend/services/bidan/petagis"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Bidan GIS map
type Controller struct {
	service petagisService.Service
}

// NewController instantiates new GIS Controller
func NewController(service petagisService.Service) *Controller {
	return &Controller{service: service}
}

// HandleGetGISClusters processes GET /api/v1/bidan/gis-clusters
func (ctrl *Controller) HandleGetGISClusters(c *gin.Context) {
	villageName := "Desa Sukamaju"

	// Extract village_name dynamically from JWT claims
	if claimsVal, exists := c.Get("user_claims"); exists {
		if claims, ok := claimsVal.(*middlewares.JWTClaims); ok && claims.VillageName != "" {
			villageName = claims.VillageName
		}
	}

	clusters, err := ctrl.service.GetGISClusters(c.Request.Context(), villageName)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat data klaster risiko spasial Posyandu")
		return
	}

	views.Success(c, http.StatusOK, "Data klaster risiko spasial berhasil dimuat", clusters)
}
