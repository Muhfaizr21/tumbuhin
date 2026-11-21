package supervisi

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"tumbuhin-backend/middlewares"
	supervisiRepo "tumbuhin-backend/repositories/bidan/supervisi"
	"tumbuhin-backend/services/bidan/supervisi"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for posyandu supervision and audit locks.
type Controller struct {
	service supervisi.Service
}

// NewController instantiates the supervision controller.
func NewController(service supervisi.Service) *Controller {
	return &Controller{service: service}
}

func villageFromClaims(c *gin.Context) string {
	if claimsVal, exists := c.Get("user_claims"); exists {
		if claims, ok := claimsVal.(*middlewares.JWTClaims); ok && strings.TrimSpace(claims.VillageName) != "" {
			return claims.VillageName
		}
	}
	return "Desa Sukamaju"
}

func userIDFromClaims(c *gin.Context) int64 {
	if claimsVal, exists := c.Get("user_claims"); exists {
		if claims, ok := claimsVal.(*middlewares.JWTClaims); ok {
			return claims.UserID
		}
	}
	return 0
}

func userNameFromClaims(c *gin.Context) string {
	if claimsVal, exists := c.Get("user_claims"); exists {
		if claims, ok := claimsVal.(*middlewares.JWTClaims); ok && strings.TrimSpace(claims.FullName) != "" {
			return claims.FullName
		}
	}
	return "Bidan Desa"
}

// HandleGetSupervision handles GET /api/v1/bidan/supervision
func (ctrl *Controller) HandleGetSupervision(c *gin.Context) {
	village := villageFromClaims(c)
	month, _ := strconv.Atoi(c.DefaultQuery("period_month", "0"))
	year, _ := strconv.Atoi(c.DefaultQuery("period_year", "0"))
	posyanduID := c.Query("posyandu_id")

	overview, err := ctrl.service.GetSupervisionOverview(c.Request.Context(), village, month, year, posyanduID)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat data supervisi posyandu: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Data supervisi dan audit posyandu berhasil dimuat", overview)
}

// HandleLockSupervision handles POST /api/v1/bidan/supervision/lock
func (ctrl *Controller) HandleLockSupervision(c *gin.Context) {
	village := villageFromClaims(c)
	uid := userIDFromClaims(c)
	uName := userNameFromClaims(c)

	var req supervisiRepo.LockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Format JSON penguncian tidak valid", err.Error())
		return
	}

	req.VillageName = village
	req.LockedBy = uid
	req.LockedByName = uName

	record, err := ctrl.service.SetSupervisionLock(c.Request.Context(), req)
	if err != nil {
		var verr *supervisi.ValidationError
		if errors.As(err, &verr) {
			views.BadRequest(c, verr.Message, nil)
			return
		}
		views.InternalServerError(c, "Gagal memproses penguncian data posyandu: "+err.Error())
		return
	}

	msg := "Status penguncian periode posyandu berhasil diperbarui"
	if record.IsLocked {
		msg = "Periode data posyandu berhasil dikunci (terverifikasi Bidan)"
	} else {
		msg = "Kunci periode data posyandu berhasil dibuka untuk perbaikan"
	}

	views.Success(c, http.StatusOK, msg, record)
}
