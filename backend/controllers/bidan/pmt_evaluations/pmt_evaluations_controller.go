package pmtevaluations

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"tumbuhin-backend/middlewares"
	repoPkg "tumbuhin-backend/repositories/bidan/pmt_evaluations"
	svcPkg "tumbuhin-backend/services/bidan/pmt_evaluations"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller exposes the 90-day PMT evaluation HTTP endpoints.
type Controller struct {
	service svcPkg.Service
}

// NewController instantiates the PMT evaluation controller.
func NewController(service svcPkg.Service) *Controller {
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

func respondValidationError(c *gin.Context, err error) bool {
	var verr *svcPkg.ValidationError
	if errors.As(err, &verr) {
		views.BadRequest(c, verr.Message, nil)
		return true
	}
	return false
}

// HandleListEvaluations handles GET /api/v1/bidan/pmt-evaluations
func (ctrl *Controller) HandleListEvaluations(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	pmtOnly, _ := strconv.ParseBool(c.DefaultQuery("pmt_only", "false"))

	query := svcPkg.Query{
		Status:   c.Query("status"),
		Search:   c.Query("search"),
		DateFrom: c.Query("date_from"),
		DateTo:   c.Query("date_to"),
		PMTOnly:  pmtOnly,
		Limit:    limit,
		Offset:   offset,
	}

	result, err := ctrl.service.ListEvaluations(c.Request.Context(), villageFromClaims(c), query)
	if err != nil {
		if respondValidationError(c, err) {
			return
		}
		views.InternalServerError(c, "Gagal memuat evaluasi kohor PMT")
		return
	}

	views.Success(c, http.StatusOK, "Evaluasi kohor PMT berhasil dimuat", result)
}

// HandleGetEvaluationDetail handles GET /api/v1/bidan/pmt-evaluations/:id
// where :id is the child_id of the cohort participant.
func (ctrl *Controller) HandleGetEvaluationDetail(c *gin.Context) {
	childID := strings.TrimSpace(c.Param("id"))
	if childID == "" {
		views.BadRequest(c, "ID balita harus diisi", nil)
		return
	}

	detail, err := ctrl.service.GetDetail(c.Request.Context(), villageFromClaims(c), childID)
	if err != nil {
		if respondValidationError(c, err) {
			return
		}
		if errors.Is(err, repoPkg.ErrNotFound) {
			views.NotFound(c, "Balita tidak terdaftar dalam kohor PMT di desa Anda")
			return
		}
		views.InternalServerError(c, "Gagal memuat detail evaluasi PMT")
		return
	}

	views.Success(c, http.StatusOK, "Detail evaluasi PMT berhasil dimuat", detail)
}

// HandleUpdateCompliance handles PATCH /api/v1/bidan/pmt-evaluations/:id/compliance
func (ctrl *Controller) HandleUpdateCompliance(c *gin.Context) {
	childID := strings.TrimSpace(c.Param("id"))
	if childID == "" {
		views.BadRequest(c, "ID balita harus diisi", nil)
		return
	}

	var input repoPkg.ComplianceRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		views.BadRequest(c, "Format data kepatuhan tidak valid", err.Error())
		return
	}

	updated, err := ctrl.service.UpdateCompliance(
		c.Request.Context(),
		villageFromClaims(c),
		childID,
		input,
		userIDFromClaims(c),
	)
	if err != nil {
		if respondValidationError(c, err) {
			return
		}
		if errors.Is(err, repoPkg.ErrNotFound) {
			views.NotFound(c, "Data kepatuhan PMT tidak ditemukan")
			return
		}
		views.InternalServerError(c, "Gagal menyimpan kepatuhan PMT: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Kepatuhan PMT berhasil disimpan", updated)
}
