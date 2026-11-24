package wilayah

import (
	"net/http"

	wilayahRepo "tumbuhin-backend/repositories/admin/wilayah"
	wilayahService "tumbuhin-backend/services/admin/wilayah"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Master Wilayah & Posyandu (Module 3.2)
type Controller struct {
	service wilayahService.Service
}

func NewController(service wilayahService.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleListPosyandus(c *gin.Context) {
	data, err := ctrl.service.ListPosyandus(c.Request.Context())
	if err != nil {
		views.InternalServerError(c, "Gagal memuat daftar Posyandu: "+err.Error())
		return
	}
	views.Success(c, http.StatusOK, "Daftar Posyandu berhasil dimuat", data)
}

func (ctrl *Controller) HandleCreatePosyandu(c *gin.Context) {
	var in wilayahRepo.PosyanduInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.CreatePosyandu(c.Request.Context(), in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusCreated, "Unit Posyandu berhasil ditambahkan", data)
}

func (ctrl *Controller) HandleUpdatePosyandu(c *gin.Context) {
	id := c.Param("id")
	var in wilayahRepo.PosyanduInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.UpdatePosyandu(c.Request.Context(), id, in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Data Posyandu berhasil diperbarui", data)
}

func (ctrl *Controller) HandleTogglePosyandu(c *gin.Context) {
	id := c.Param("id")
	data, err := ctrl.service.TogglePosyandu(c.Request.Context(), id)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Status operasional Posyandu diperbarui", data)
}

func (ctrl *Controller) HandleDeletePosyandu(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.service.DeletePosyandu(c.Request.Context(), id); err != nil {
		views.BadRequest(c, "Gagal menghapus Posyandu: "+err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Unit Posyandu berhasil dihapus", gin.H{"id": id})
}
