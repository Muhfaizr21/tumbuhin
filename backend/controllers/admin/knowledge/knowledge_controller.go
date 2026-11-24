package knowledge

import (
	"fmt"
	"net/http"

	knowledgeRepo "tumbuhin-backend/repositories/admin/knowledge"
	knowledgeService "tumbuhin-backend/services/admin/knowledge"
	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// Controller handles HTTP endpoints for Knowledge Base AI (RAG) & Playground (Module 3.5)
type Controller struct {
	service knowledgeService.Service
}

func NewController(service knowledgeService.Service) *Controller {
	return &Controller{service: service}
}

func (ctrl *Controller) HandleListKnowledgeChunks(c *gin.Context) {
	data, err := ctrl.service.ListKnowledgeChunks(c.Request.Context())
	if err != nil {
		views.InternalServerError(c, "Gagal memuat knowledge base RAG: "+err.Error())
		return
	}
	views.Success(c, http.StatusOK, "Knowledge Base Kemenkes berhasil dimuat", data)
}

func (ctrl *Controller) HandleCreateKnowledgeChunk(c *gin.Context) {
	var in knowledgeRepo.KnowledgeChunkInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.CreateKnowledgeChunk(c.Request.Context(), in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusCreated, "Dokumen pedoman gizi berhasil ditambahkan & di-embed ke Knowledge Base", data)
}

func (ctrl *Controller) HandleUpdateKnowledgeChunk(c *gin.Context) {
	id := c.Param("id")
	var in knowledgeRepo.KnowledgeChunkInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.UpdateKnowledgeChunk(c.Request.Context(), id, in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Chunk pedoman gizi & vektor 768-dim berhasil diperbarui", data)
}

func (ctrl *Controller) HandleDeleteKnowledgeChunk(c *gin.Context) {
	id := c.Param("id")
	if err := ctrl.service.DeleteKnowledgeChunk(c.Request.Context(), id); err != nil {
		views.BadRequest(c, "Gagal menghapus chunk: "+err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Chunk pedoman berhasil dihapus", gin.H{"id": id})
}

func (ctrl *Controller) HandleUploadDocument(c *gin.Context) {
	var in knowledgeRepo.DocumentUploadInput
	if err := c.ShouldBindJSON(&in); err != nil {
		views.BadRequest(c, "Payload dokumen tidak valid: "+err.Error(), nil)
		return
	}
	chunks, err := ctrl.service.UploadAndChunkDocument(c.Request.Context(), in)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(
		c,
		http.StatusCreated,
		fmt.Sprintf("Dokumen berhasil dipecah otomatis menjadi %d chunks dan diindeks ke pgvector (768-dim)", len(chunks)),
		chunks,
	)
}

func (ctrl *Controller) HandleReindexVectors(c *gin.Context) {
	count, err := ctrl.service.ReindexAllVectors(c.Request.Context())
	if err != nil {
		views.InternalServerError(c, "Gagal menjalankan re-index vektor: "+err.Error())
		return
	}
	views.Success(
		c,
		http.StatusOK,
		fmt.Sprintf("Berhasil memperbarui indeks vektor 768-dimensi (pgvector) untuk %d chunks Kemenkes", count),
		gin.H{"embedded_count": count},
	)
}

func (ctrl *Controller) HandleTestRAGPlayground(c *gin.Context) {
	var req knowledgeRepo.RAGPlaygroundRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		views.BadRequest(c, "Parameter uji RAG tidak valid: "+err.Error(), nil)
		return
	}
	data, err := ctrl.service.RunRAGPlayground(c.Request.Context(), req)
	if err != nil {
		views.BadRequest(c, err.Error(), nil)
		return
	}
	views.Success(c, http.StatusOK, "Simulasi RAG Retrieval berhasil dijalankan", data)
}
