package parents

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"tumbuhin-backend/middlewares"
	bidanParentsRepo "tumbuhin-backend/repositories/bidan/parents"
	bidanParentsSvc "tumbuhin-backend/services/bidan/parents"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service bidanParentsSvc.Service
}

func NewController(service bidanParentsSvc.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleListParents(c *gin.Context) {
	villageName := middlewares.VillageFromContext(c, "")
	data, err := ctrl.service.ListParentsAndUnlinkedChildren(c.Request.Context(), villageName)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat daftar akun orang tua: "+err.Error())
		return
	}
	views.Success(c, http.StatusOK, "Daftar akun orang tua berhasil dimuat", data)
}

func (ctrl *Controller) HandleRegisterParent(c *gin.Context) {
	var in bidanParentsRepo.RegisterParentInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload pendaftaran akun orang tua tidak valid: "+err.Error(), nil)
		return
	}

	claims := middlewares.ClaimsFromContext(c)
	if claims != nil {
		if strings.TrimSpace(in.VillageName) == "" {
			in.VillageName = claims.VillageName
		}
		if strings.TrimSpace(in.PosyanduName) == "" {
			in.PosyanduName = claims.PosyanduName
		}
	}

	data, err := ctrl.service.RegisterParent(c.Request.Context(), in)
	if err != nil {
		if errors.Is(err, bidanParentsRepo.ErrInvalidInput) || errors.Is(err, bidanParentsRepo.ErrDuplicateIdentity) {
			views.BadRequest(c, err.Error(), nil)
			return
		}
		views.InternalServerError(c, "Gagal mendaftarkan akun orang tua: "+err.Error())
		return
	}

	views.Success(c, http.StatusCreated, "Akun orang tua berhasil didaftarkan & ditautkan ke balita", data)
}

func (ctrl *Controller) HandleUpdateParentChildren(c *gin.Context) {
	parentID, err := strconv.ParseInt(c.Param("parentId"), 10, 64)
	if err != nil {
		views.BadRequest(c, "ID akun orang tua tidak valid", nil)
		return
	}

	var in bidanParentsRepo.UpdateParentChildrenInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload pembaruan balita tidak valid: "+err.Error(), nil)
		return
	}

	data, err := ctrl.service.UpdateParentChildren(c.Request.Context(), parentID, in.ChildIDs)
	if err != nil {
		if errors.Is(err, bidanParentsRepo.ErrParentNotFound) {
			views.NotFound(c, err.Error())
			return
		}
		views.InternalServerError(c, "Gagal memperbarui daftar anak orang tua: "+err.Error())
		return
	}

	views.Success(c, http.StatusOK, "Daftar anak pada akun orang tua berhasil diperbarui", data)
}
