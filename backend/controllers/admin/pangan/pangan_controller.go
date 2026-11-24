package pangan

import (
	"net/http"

	panganRepo "tumbuhin-backend/repositories/admin/pangan"
	panganService "tumbuhin-backend/services/admin/pangan"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Harga Pangan Lokal Desa (Module 3.4)
type Controller struct {
	service panganService.Service
}

func NewController(service panganService.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleListLocalFoods(c *gin.Context) {
	data, err := ctrl.service.ListLocalFoods(c.Request.Context())
	if err != nil {
		views.InternalServerError(c, "Gagal memuat katalog pangan lokal: "+err.Error())
		return
	}
	views.Success(c, http.StatusOK, "Katalog pangan lokal desa berhasil dimuat", data)
}

func (ctrl *Controller) HandleCreateLocalFood(c *gin.Context) {
	var in panganRepo.LocalFoodInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.CreateLocalFood(c.Request.Context(), in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusCreated, "Komoditas pangan lokal berhasil disimpan", data)
}

func (ctrl *Controller) HandleUpdateLocalFood(c *gin.Context) {
	id := c.Param("id")
	var in panganRepo.LocalFoodInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.UpdateLocalFood(c.Request.Context(), id, in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Harga & detail pangan lokal berhasil diperbarui", data)
}

func (ctrl *Controller) HandleToggleLocalFood(c *gin.Context) {
	id := c.Param("id")
	data, err := ctrl.service.ToggleLocalFood(c.Request.Context(), id)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Ketersediaan musiman komoditas diperbarui", data)
}

func (ctrl *Controller) HandleDeleteLocalFood(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.service.DeleteLocalFood(c.Request.Context(), id); err != nil {
		views.BadRequest(c, "Gagal menghapus komoditas: "+err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Komoditas pangan lokal berhasil dihapus", gin.H{"id": id})
}
