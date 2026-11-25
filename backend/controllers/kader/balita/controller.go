package balita

import (
	"net/http"
	"tumbuhin-backend/middlewares"
	kaderBalitaRepo "tumbuhin-backend/repositories/kader/balita"
	kaderBalitaSvc "tumbuhin-backend/services/kader/balita"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service kaderBalitaSvc.Service
}

func NewController(service kaderBalitaSvc.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleGetChildren(c *gin.Context) {
	villageName := middlewares.VillageFromContext(c, "Desa Sukamaju")

	data, err := ctrl.service.GetChildren(c.Request.Context(), villageName)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat data balita")
		return
	}

	views.Success(c, http.StatusOK, "Data balita berhasil dimuat", data)
}

func (ctrl *Controller) HandleCreateChild(c *gin.Context) {
	var input kaderBalitaRepo.ChildInput
	if err := c.ShouldBindJSON(&input); err != nil {
		views.BadRequest(c, "Format data tidak valid", err.Error())
		return
	}

	if input.PosyanduName == "" {
		input.PosyanduName = middlewares.PosyanduFromContext(c, "Posyandu Melati 04")
	}
	if input.VillageName == "" {
		input.VillageName = middlewares.VillageFromContext(c, "Desa Sukamaju")
	}

	data, err := ctrl.service.CreateChild(c.Request.Context(), input)
	if err != nil {
		views.InternalServerError(c, "Gagal mendaftarkan balita")
		return
	}

	views.Success(c, http.StatusCreated, "Balita berhasil didaftarkan", data)
}

func (ctrl *Controller) HandleUpdateChild(c *gin.Context) {
	id := c.Param("id")
	var input kaderBalitaRepo.ChildInput
	if err := c.ShouldBindJSON(&input); err != nil {
		views.BadRequest(c, "Format data tidak valid", err.Error())
		return
	}

	err := ctrl.service.UpdateChild(c.Request.Context(), id, input)
	if err != nil {
		views.InternalServerError(c, "Gagal memperbarui data balita")
		return
	}

	views.Success(c, http.StatusOK, "Data balita berhasil diperbarui", nil)
}

func (ctrl *Controller) HandleDeleteChild(c *gin.Context) {
	id := c.Param("id")
	err := ctrl.service.DeleteChild(c.Request.Context(), id)
	if err != nil {
		views.InternalServerError(c, "Gagal menghapus data balita")
		return
	}

	views.Success(c, http.StatusOK, "Data balita berhasil dihapus", nil)
}
