package parents

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	accountsRepo "tumbuhin-backend/repositories/ortu/accounts"
	accountsSvc "tumbuhin-backend/services/ortu/accounts"
	"tumbuhin-backend/middlewares"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

type Controller struct {
	service accountsSvc.Service
}

func NewController(service accountsSvc.Service) *Controller {
	return &Controller{service: service}
}

type updateChildrenRequest struct {
	ChildIDs []string `json:"child_ids"`
}

func (ctrl *Controller) HandleListParents(c *gin.Context) {
	scope := accountsRepo.Scope{
		PosyanduName: middlewares.PosyanduFromContext(c, ""),
		VillageName:  middlewares.VillageFromContext(c, ""),
	}

	data, err := ctrl.service.List(c.Request.Context(), scope)
	if err != nil {
		views.InternalServerError(c, "Gagal memuat akun orang tua")
		return
	}

	views.Success(c, http.StatusOK, "Daftar akun orang tua berhasil dimuat", data)
}

func (ctrl *Controller) HandleRegisterParent(c *gin.Context) {
	var input accountsRepo.NewParent
	if err := c.ShouldBindJSON(&input); err != nil {
		views.BadRequest(c, "Data akun orang tua belum valid", err.Error())
		return
	}

	input.PosyanduName = middlewares.PosyanduFromContext(c, input.PosyanduName)
	input.VillageName = middlewares.VillageFromContext(c, input.VillageName)

	scope := accountsRepo.Scope{
		PosyanduName: input.PosyanduName,
		VillageName:  input.VillageName,
	}

	parent, err := ctrl.service.Register(c.Request.Context(), input, scope)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	views.Success(c, http.StatusCreated, "Akun orang tua berhasil dibuat dan anak berhasil ditautkan", parent)
}

func (ctrl *Controller) HandleUpdateParentChildren(c *gin.Context) {
	parentID, err := strconv.ParseInt(strings.TrimSpace(c.Param("parentId")), 10, 64)
	if err != nil || parentID <= 0 {
		views.BadRequest(c, "ID akun orang tua tidak valid", nil)
		return
	}

	var body updateChildrenRequest
	if err := c.ShouldBindJSON(&body); err != nil {
		views.BadRequest(c, "Daftar anak belum valid", err.Error())
		return
	}

	scope := accountsRepo.Scope{
		PosyanduName: middlewares.PosyanduFromContext(c, ""),
		VillageName:  middlewares.VillageFromContext(c, ""),
	}

	parent, err := ctrl.service.UpdateChildren(c.Request.Context(), parentID, body.ChildIDs, scope)
	if err != nil {
		writeServiceError(c, err)
		return
	}

	views.Success(c, http.StatusOK, "Anak yang tertaut berhasil diperbarui", parent)
}

func writeServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, accountsSvc.ErrValidation):
		views.BadRequest(c, err.Error(), nil)
	case errors.Is(err, accountsRepo.ErrChildOutOfScope):
		views.Forbidden(c, err.Error())
	case errors.Is(err, accountsRepo.ErrParentNotFound):
		views.NotFound(c, err.Error())
	case errors.Is(err, accountsRepo.ErrChildNotFound):
		views.NotFound(c, err.Error())
	case errors.Is(err, accountsRepo.ErrUserAlreadyExists):
		views.Error(c, http.StatusConflict, err.Error(), nil)
	case errors.Is(err, accountsRepo.ErrChildAlreadyLinked):
		views.Error(c, http.StatusConflict, err.Error(), nil)
	default:
		views.InternalServerError(c, "Gagal memproses akun orang tua")
	}
}