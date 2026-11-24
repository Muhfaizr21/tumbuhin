package timbang

import (
	"net/http"
	kaderTimbangRepo "tumbuhin-backend/repositories/kader/timbang"
	kaderTimbangSvc "tumbuhin-backend/services/kader/timbang"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service kaderTimbangSvc.Service
}

func NewController(service kaderTimbangSvc.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleSaveMeasurement(c *gin.Context) {
	var req kaderTimbangRepo.MeasurementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Data penimbangan tidak valid", err.Error())
		return
	}

	result, err := ctrl.service.SaveMeasurement(c.Request.Context(), req)
	if err != nil {
		views.InternalServerError(c, "Gagal menyimpan data penimbangan: "+err.Error())
		return
	}

	// Jika result nil (balita tidak ditemukan), tetap return sukses
	if result == nil {
		views.Success(c, http.StatusOK, "Data penimbangan berhasil disimpan (tanpa z-score)", nil)
		return
	}

	views.Success(c, http.StatusOK, "Data penimbangan berhasil disimpan", result)
}