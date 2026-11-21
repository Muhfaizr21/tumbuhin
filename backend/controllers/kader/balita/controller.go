package balita

import (
	"net/http"
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
	// Contoh menggunakan posyandu_id statis atau dari user context
	posyanduID := "00000000-0000-0000-0000-000000000001" 
	data, err := ctrl.service.GetChildren(c.Request.Context(), posyanduID)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat data balita kader")
		return
	}

	views.Success(c, http.StatusOK, "Data balita berhasil dimuat dari database", data)
}
