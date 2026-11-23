package sinkronisasi

import (
	"net/http"
	"strconv"

	kaderSyncSvc "tumbuhin-backend/services/kader/sinkronisasi"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service kaderSyncSvc.Service
}

func NewController(service kaderSyncSvc.Service) *Controller {
	return &Controller{service: service}
}

// HandleBatchSync processes POST /api/v1/kader/sinkronisasi/batch
func (ctrl *Controller) HandleBatchSync(c *gin.Context) {
	kaderID, ok := currentUserID(c)
	if !ok {
		views.Unauthorized(c, "Identitas kader tidak ditemukan pada token")
		return
	}

	var req kaderSyncSvc.BatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Format batch sinkronisasi tidak valid", err.Error())
		return
	}

	if len(req.AllItems()) == 0 {
		views.BadRequest(c, "Antrean sinkronisasi kosong: tidak ada item untuk dikirim", nil)
		return
	}

	result, err := ctrl.service.SyncBatch(c.Request.Context(), kaderID, req)
	if err != nil {
		views.InternalServerError(c, "Gagal memproses batch sinkronisasi: "+err.Error())
		return
	}

	message := "Batch sinkronisasi selesai diproses"
	if result.Conflict > 0 {
		message = "Batch diproses dengan konflik yang perlu ditinjau kader"
	}
	views.Success(c, http.StatusOK, message, result)
}

// HandleSyncStatus processes GET /api/v1/kader/sinkronisasi/status
func (ctrl *Controller) HandleSyncStatus(c *gin.Context) {
	kaderID, ok := currentUserID(c)
	if !ok {
		views.Unauthorized(c, "Identitas kader tidak ditemukan pada token")
		return
	}

	limit := 20
	if raw := c.Query("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}

	result, err := ctrl.service.GetStatus(c.Request.Context(), kaderID, limit)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat status sinkronisasi: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Status sinkronisasi berhasil dimuat", result)
}

func currentUserID(c *gin.Context) (int64, bool) {
	value, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	switch typed := value.(type) {
	case int64:
		return typed, typed > 0
	case int:
		return int64(typed), typed > 0
	case float64:
		return int64(typed), typed > 0
	default:
		return 0, false
	}
}
