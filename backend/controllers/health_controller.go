package controllers

import (
	"net/http"
	"time"

	"tumbuhin-backend/views"

	"github.com/gin-gonic/gin"
)

// HealthController handles health check and ping requests
type HealthController struct {
	startTime time.Time
}

// NewHealthController creates a new HealthController
func NewHealthController() *HealthController {
	return &HealthController{
		startTime: time.Now(),
	}
}

// Check returns server status, uptime, and timestamp
func (h *HealthController) Check(c *gin.Context) {
	uptime := time.Since(h.startTime).String()

	views.Success(c, http.StatusOK, "Backend server is running smoothly", gin.H{
		"status":    "healthy",
		"service":   "tumbuhin-backend",
		"version":   "1.0.0",
		"uptime":    uptime,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}
