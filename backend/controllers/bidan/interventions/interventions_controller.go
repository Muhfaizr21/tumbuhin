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

	result, err := ctrl.service.ListHomeVisits(c.Request.Context(), middlewares.VillageFromContext(c, "Desa Sukamaju"), filter)
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
		middlewares.VillageFromContext(c, "Desa Sukamaju"),
		middlewares.UserIDFromContext(c),
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

	updated, err := ctrl.service.UpdateStatus(c.Request.Context(), middlewares.VillageFromContext(c, "Desa Sukamaju"), id, input)
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

// HandleUpdateHomeVisit handles PUT /api/v1/bidan/interventions/:id
func (ctrl *Controller) HandleUpdateHomeVisit(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		views.BadRequest(c, "ID kunjungan harus diisi", nil)
		return
	}

	var input interventions.CreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		views.BadRequest(c, "Format data kunjungan rumah tidak valid", err.Error())
		return
	}

	updated, err := ctrl.service.UpdateHomeVisit(
		c.Request.Context(),
		middlewares.VillageFromContext(c, "Desa Sukamaju"),
		id,
		input,
	)
	if err != nil {
		if respondValidationError(c, err) {
			return
		}
		if errors.Is(err, interventionsRepo.ErrNotFound) {
			views.NotFound(c, "Kunjungan rumah tidak ditemukan di desa Anda")
			return
		}
		views.InternalServerError(c, "Gagal memperbarui kunjungan rumah: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Kunjungan rumah berhasil diperbarui", updated)
}

// HandleDeleteHomeVisit handles DELETE /api/v1/bidan/interventions/:id
func (ctrl *Controller) HandleDeleteHomeVisit(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		views.BadRequest(c, "ID kunjungan harus diisi", nil)
		return
	}

	err := ctrl.service.DeleteHomeVisit(
		c.Request.Context(),
		middlewares.VillageFromContext(c, "Desa Sukamaju"),
		id,
	)
	if err != nil {
		if respondValidationError(c, err) {
			return
		}
		if errors.Is(err, interventionsRepo.ErrNotFound) {
			views.NotFound(c, "Kunjungan rumah tidak ditemukan di desa Anda")
			return
		}
		views.InternalServerError(c, "Gagal menghapus kunjungan rumah: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Kunjungan rumah berhasil dihapus", gin.H{"deleted_id": id})
}
