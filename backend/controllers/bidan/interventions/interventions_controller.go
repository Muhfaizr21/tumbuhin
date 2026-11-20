package interventions

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"tumbuhin-backend/middlewares"
	interventionsRepo "tumbuhin-backend/repositories/bidan/interventions"
	"tumbuhin-backend/services/bidan/interventions"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller exposes the Batch 2 home visit HTTP endpoints.
type Controller struct {
	service interventions.Service
}

// NewController instantiates the home visit controller.
func NewController(service interventions.Service) *Controller {
	return &Controller{service: service}
}

// villageFromClaims reads the caller's village scope from the JWT claims so
// every query stays inside the bidan's own desa.
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

func respondValidationError(c *gin.Context, err error) bool {
	var verr *interventions.ValidationError
	if errors.As(err, &verr) {
		views.BadRequest(c, verr.Message, nil)
		return true
	}
	return false
}

// HandleListHomeVisits handles GET /api/v1/bidan/interventions
func (ctrl *Controller) HandleListHomeVisits(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	filter := interventionsRepo.ListFilter{
		Status:   c.Query("status"),
		ChildID:  c.Query("child_id"),
		Search:   c.Query("search"),
		DateFrom: c.Query("date_from"),
		DateTo:   c.Query("date_to"),
		Limit:    limit,
		Offset:   offset,
	}

	result, err := ctrl.service.ListHomeVisits(c.Request.Context(), villageFromClaims(c), filter)
	if err != nil {
		if respondValidationError(c, err) {
			return
		}
		views.InternalServerError(c, "Gagal memuat daftar kunjungan rumah")
		return
	}

	views.Success(c, http.StatusOK, "Daftar kunjungan rumah berhasil dimuat", result)
}

// HandleCreateHomeVisit handles POST /api/v1/bidan/interventions
func (ctrl *Controller) HandleCreateHomeVisit(c *gin.Context) {
	var input interventions.CreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		views.BadRequest(c, "Format data kunjungan rumah tidak valid", err.Error())
		return
	}

	created, err := ctrl.service.CreateHomeVisit(
		c.Request.Context(),
		villageFromClaims(c),
		userIDFromClaims(c),
		input,
	)
	if err != nil {
		if respondValidationError(c, err) {
			return
		}
		views.InternalServerError(c, "Gagal menyimpan kunjungan rumah: "+err.Error())
		return
	}

	views.Success(c, http.StatusCreated, "Kunjungan rumah berhasil disimpan", created)
}

// HandleUpdateHomeVisitStatus handles PATCH /api/v1/bidan/interventions/:id/status
func (ctrl *Controller) HandleUpdateHomeVisitStatus(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		views.BadRequest(c, "ID kunjungan harus diisi", nil)
		return
	}

	var input interventions.StatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		views.BadRequest(c, "Format status tidak valid", err.Error())
		return
	}

	updated, err := ctrl.service.UpdateStatus(c.Request.Context(), villageFromClaims(c), id, input)
	if err != nil {
		if respondValidationError(c, err) {
			return
		}
		if errors.Is(err, interventionsRepo.ErrNotFound) {
			views.NotFound(c, "Kunjungan rumah tidak ditemukan di desa Anda")
			return
		}
		views.InternalServerError(c, "Gagal memperbarui status kunjungan: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Status kunjungan berhasil diperbarui", updated)
}
