package standarwho

import (
	"net/http"

	standarwhoRepo "tumbuhin-backend/repositories/admin/standarwho"
	standarwhoService "tumbuhin-backend/services/admin/standarwho"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Standar Antropometri WHO & Simulator Kalibrasi (Module 3.6)
type Controller struct {
	service standarwhoService.Service
}

func NewController(service standarwhoService.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleListWhoStandards(c *gin.Context) {
	indicator := c.Query("indicator")
	gender := c.Query("gender")
	data, err := ctrl.service.ListWhoStandards(c.Request.Context(), indicator, gender)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat tabel standar WHO LMS: "+err.Error())
		return
	}
	views.Success(c, http.StatusOK, "Standar Antropometri WHO LMS berhasil dimuat", data)
}

func (ctrl *Controller) HandleUpsertWhoStandard(c *gin.Context) {
	var in standarwhoRepo.WhoStandardInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.UpsertWhoStandard(c.Request.Context(), in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Parameter referensi WHO LMS berhasil disimpan", data)
}

func (ctrl *Controller) HandleSimulateWhoZScore(c *gin.Context) {
	var req standarwhoRepo.WhoSimulationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Parameter simulasi tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.SimulateWhoZScore(c.Request.Context(), req)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Kalkulasi kalibrasi Z-Score WHO LMS selesai", data)
}
