package nutrichef

import (
	"net/http"
	nutrichefRepo "tumbuhin-backend/repositories/kader/nutrichef"
	nutrichefSvc "tumbuhin-backend/services/kader/nutrichef"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service nutrichefSvc.Service
}

func NewController(service nutrichefSvc.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleGenerateRecipe(c *gin.Context) {
	var req nutrichefRepo.GenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Data parameter tidak valid", err.Error())
		return
	}

	recipe, err := ctrl.service.GenerateRecipe(c.Request.Context(), req)
	if err != nil {
		views.InternalServerError(c, "Gagal generate resep: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Resep berhasil dibuat", recipe)
}
