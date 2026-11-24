package pengguna

import (
	"net/http"
	"strconv"

	penggunaRepo "tumbuhin-backend/repositories/admin/pengguna"
	penggunaService "tumbuhin-backend/services/admin/pengguna"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Manajemen Akun, RBAC & Magic Token (Module 3.3)
type Controller struct {
	service penggunaService.Service
}

func NewController(service penggunaService.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleListUsersAndTokens(c *gin.Context) {
	data, err := ctrl.service.ListUsersAndTokens(c.Request.Context())
	if err != nil {
		views.InternalServerError(c, "Gagal memuat daftar akun & RBAC: "+err.Error())
		return
	}
	views.Success(c, http.StatusOK, "Daftar pengguna & token berhasil dimuat", data)
}

func (ctrl *Controller) HandleCreateUser(c *gin.Context) {
	var in penggunaRepo.AdminUserInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload akun tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.CreateUser(c.Request.Context(), in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusCreated, "Akun petugas baru berhasil dibuat", data)
}

func (ctrl *Controller) HandleUpdateUser(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		views.BadRequest(c, "ID pengguna tidak valid", nil)
		return
	}
	var in penggunaRepo.AdminUserInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.UpdateUser(c.Request.Context(), id, in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Hak akses & profil akun berhasil diperbarui", data)
}

func (ctrl *Controller) HandleToggleUserActive(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		views.BadRequest(c, "ID pengguna tidak valid", nil)
		return
	}
	data, err := ctrl.service.ToggleUserActive(c.Request.Context(), id)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Status aktif pengguna diperbarui", data)
}

func (ctrl *Controller) HandleDeleteUser(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		views.BadRequest(c, "ID pengguna tidak valid", nil)
		return
	}
	if err := ctrl.service.DeleteUser(c.Request.Context(), id); err != nil {
		views.BadRequest(c, "Gagal menghapus pengguna: "+err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Akun pengguna berhasil dihapus", gin.H{"id": id})
}

func (ctrl *Controller) HandleRegenerateChildToken(c *gin.Context) {
	childID := c.Param("id")
	data, err := ctrl.service.RegenerateChildMagicToken(c.Request.Context(), childID)
	if err != nil {
		views.BadRequest(c, "Gagal menerbitkan ulang Magic Token: "+err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Magic Token Kartu Gizi Digital berhasil diterbitkan ulang", data)
}
