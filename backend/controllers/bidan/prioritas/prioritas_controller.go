package prioritas

import (
	"net/http"

	"tumbuhin-backend/middlewares"
	prioritasRepo "tumbuhin-backend/repositories/bidan/prioritas"
	prioritasService "tumbuhin-backend/services/bidan/prioritas"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Bidan priority intervention triage
type Controller struct {
	service prioritasService.Service
}

// NewController instantiates new Priority Controller
func NewController(service prioritasService.Service) *Controller {
	return &Controller{service: service}
}

func getVillageNameFromContext(c *gin.Context) string {
	villageName := "Desa Sukamaju"
	if claimsVal, exists := c.Get("user_claims"); exists {
		if claims, ok := claimsVal.(*middlewares.JWTClaims); ok && claims.VillageName != "" {
			villageName = claims.VillageName
		}
	}
	return villageName
}

// HandleGetPriorityList processes GET /api/v1/bidan/priority-list
func (ctrl *Controller) HandleGetPriorityList(c *gin.Context) {
	villageName := getVillageNameFromContext(c)

	list, err := ctrl.service.GetPriorityList(c.Request.Context(), villageName)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat daftar triase prioritas intervensi")
		return
	}

	views.Success(c, http.StatusOK, "Daftar triase prioritas intervensi balita berhasil dimuat", list)
}

// HandleCreatePriorityChild processes POST /api/v1/bidan/priority-list
func (ctrl *Controller) HandleCreatePriorityChild(c *gin.Context) {
	villageName := getVillageNameFromContext(c)

	var req prioritasRepo.CreatePriorityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Format data balita tidak valid", err.Error())
		return
	}

	created, err := ctrl.service.CreatePriorityChild(c.Request.Context(), villageName, req)
	if err != nil {
		views.InternalServerError(c, "Gagal menambahkan balita ke daftar prioritas: "+err.Error())
		return
	}

	views.Success(c, http.StatusCreated, "Balita prioritas berhasil ditambahkan ke triase intervensi", created)
}

// HandleUpdatePriorityChild processes PUT /api/v1/bidan/priority-list/:id
func (ctrl *Controller) HandleUpdatePriorityChild(c *gin.Context) {
	villageName := getVillageNameFromContext(c)
	childID := c.Param("id")
	if childID == "" {
		views.BadRequest(c, "Parameter ID balita harus diisi", nil)
		return
	}

	var req prioritasRepo.UpdatePriorityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Format data update tidak valid", err.Error())
		return
	}

	updated, err := ctrl.service.UpdatePriorityChild(c.Request.Context(), villageName, childID, req)
	if err != nil {
		views.NotFound(c, "Gagal memperbarui data: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Data balita prioritas berhasil diperbarui", updated)
}

// HandleDeletePriorityChild processes DELETE /api/v1/bidan/priority-list/:id
func (ctrl *Controller) HandleDeletePriorityChild(c *gin.Context) {
	villageName := getVillageNameFromContext(c)
	childID := c.Param("id")
	if childID == "" {
		views.BadRequest(c, "Parameter ID balita harus diisi", nil)
		return
	}

	if err := ctrl.service.DeletePriorityChild(c.Request.Context(), villageName, childID); err != nil {
		views.NotFound(c, "Gagal menghapus balita: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Balita prioritas berhasil dihapus dari daftar triase", gin.H{"deleted_id": childID})
}
