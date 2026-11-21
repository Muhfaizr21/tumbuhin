package laporan

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"tumbuhin-backend/middlewares"
	"tumbuhin-backend/services/bidan/laporan"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles e-PPGBM reports and multi-format document downloads.
type Controller struct {
	service laporan.Service
}

// NewController instantiates the e-PPGBM report controller.
func NewController(service laporan.Service) *Controller {
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

// HandleExport handles GET /api/v1/bidan/export
// Query params:
// - format: xlsx, pdf, csv, or json (preview)
// - period_month: 1-12
// - period_year: e.g. 2026
// - posyandu_id: optional UUID
func (ctrl *Controller) HandleExport(c *gin.Context) {
	village := villageFromClaims(c)
	format := strings.ToLower(strings.TrimSpace(c.DefaultQuery("format", "xlsx")))
	month, _ := strconv.Atoi(c.DefaultQuery("period_month", "0"))
	year, _ := strconv.Atoi(c.DefaultQuery("period_year", "0"))
	posyanduID := c.Query("posyandu_id")

	// If format is json or preview requested, return API JSON envelope for UI table preview
	if format == "json" || c.Query("preview") == "true" {
		rows, summary, err := ctrl.service.GetReportData(c.Request.Context(), village, month, year, posyanduID)
		if err != nil {
			views.InternalServerError(c, "Gagal memuat pratinjau laporan e-PPGBM: "+err.Error())
			return
		}

		views.Success(c, http.StatusOK, "Pratinjau data surveilans e-PPGBM berhasil dimuat", gin.H{
			"summary": summary,
			"items":   rows,
			"total":   len(rows),
		})
		return
	}

	// Binary export generation (xlsx, pdf, csv)
	fileBytes, contentType, filename, err := ctrl.service.GenerateExport(c.Request.Context(), village, month, year, posyanduID, format)
	if err != nil {
		views.InternalServerError(c, "Gagal membuat dokumen ekspor e-PPGBM: "+err.Error())
		return
	}

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Type", contentType)
	c.Header("Content-Length", strconv.Itoa(len(fileBytes)))
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Header("Pragma", "no-cache")
	c.Header("Expires", "0")

	c.Data(http.StatusOK, contentType, fileBytes)
}
