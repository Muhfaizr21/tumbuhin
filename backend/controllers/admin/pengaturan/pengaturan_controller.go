package pengaturan

import (
	"net/http"

	pengaturanRepo "tumbuhin-backend/repositories/admin/pengaturan"
	pengaturanService "tumbuhin-backend/services/admin/pengaturan"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Log Sinkronisasi & Pengaturan Desa (Module 3.7)
type Controller struct {
	service pengaturanService.Service
}

func NewController(service pengaturanService.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleGetSettingsAndAudit(c *gin.Context) {
	data, err := ctrl.service.GetSettingsAndAudit(c.Request.Context())
	if err != nil {
		views.InternalServerError(c, "Gagal memuat pengaturan & log audit: "+err.Error())
		return
	}
	views.Success(c, http.StatusOK, "Pengaturan desa & log sinkronisasi berhasil dimuat", data)
}

func (ctrl *Controller) HandleUpdateVillageSettings(c *gin.Context) {
	var in pengaturanRepo.VillageSettingsRecord
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.UpdateVillageSettings(c.Request.Context(), in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Konfigurasi pemerintahan desa & sistem berhasil disimpan", data)
}

func (ctrl *Controller) HandleResolveSyncLog(c *gin.Context) {
	id := c.Param("id")
	data, err := ctrl.service.ResolveSyncLog(c.Request.Context(), id)
	if err != nil {
		views.BadRequest(c, "Gagal menyelesaikan log sinkronisasi: "+err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Item log sinkronisasi telah diverifikasi & diselesaikan", data)
}
