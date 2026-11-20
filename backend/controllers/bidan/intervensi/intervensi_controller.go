package intervensi

import (
	"net/http"

	"tumbuhin-backend/middlewares"
	intervensiRepo "tumbuhin-backend/repositories/bidan/intervensi"
	intervensiService "tumbuhin-backend/services/bidan/intervensi"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Bidan home visit interventions
type Controller struct {
	service intervensiService.Service
}

// NewController instantiates Intervention Controller
func NewController(service intervensiService.Service) *Controller {
	return &Controller{service: service}
}

func getVillageNameFromCtx(c *gin.Context) string {
	villageName := "Desa Sukamaju"
	if claimsVal, exists := c.Get("user_claims"); exists {
		if claims, ok := claimsVal.(*middlewares.JWTClaims); ok && claims.VillageName != "" {
			villageName = claims.VillageName
		}
	}
	return villageName
}

// HandleGetInterventionList processes GET /api/v1/bidan/intervensi
func (ctrl *Controller) HandleGetInterventionList(c *gin.Context) {
	villageName := getVillageNameFromCtx(c)

	list, err := ctrl.service.GetInterventionList(c.Request.Context(), villageName)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat daftar intervensi home visit")
		return
	}

	views.Success(c, http.StatusOK, "Daftar intervensi home visit berhasil dimuat", list)
}

// HandleCreateIntervention processes POST /api/v1/bidan/intervensi
func (ctrl *Controller) HandleCreateIntervention(c *gin.Context) {
	var req intervensiRepo.CreateInterventionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Format data intervensi tidak valid", err.Error())
		return
	}

	created, err := ctrl.service.CreateIntervention(c.Request.Context(), req)
	if err != nil {
		views.InternalServerError(c, "Gagal membuat intervensi: "+err.Error())
		return
	}

	views.Success(c, http.StatusCreated, "Intervensi home visit berhasil dibuat", created)
}

// HandleUpdateIntervention processes PUT /api/v1/bidan/intervensi/:id
func (ctrl *Controller) HandleUpdateIntervention(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		views.BadRequest(c, "Parameter ID intervensi harus diisi", nil)
		return
	}

	var req intervensiRepo.UpdateInterventionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Format data update tidak valid", err.Error())
		return
	}

	updated, err := ctrl.service.UpdateIntervention(c.Request.Context(), id, req)
	if err != nil {
		views.NotFound(c, "Gagal memperbarui intervensi: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Intervensi berhasil diperbarui", updated)
}

// HandleDeleteIntervention processes DELETE /api/v1/bidan/intervensi/:id
func (ctrl *Controller) HandleDeleteIntervention(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		views.BadRequest(c, "Parameter ID intervensi harus diisi", nil)
		return
	}

	if err := ctrl.service.DeleteIntervention(c.Request.Context(), id); err != nil {
		views.NotFound(c, "Gagal menghapus intervensi: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Intervensi berhasil dihapus", gin.H{"deleted_id": id})
}
