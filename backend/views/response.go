package views

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIResponse is the standard envelope for all API responses
type APIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
	Error   any    `json:"error,omitempty"`
}

// Success renders a standardized JSON success response
func Success(c *gin.Context, statusCode int, message string, data any) {
	c.JSON(statusCode, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error renders a standardized JSON error response
func Error(c *gin.Context, statusCode int, message string, errDetails any) {
	c.JSON(statusCode, APIResponse{
		Success: false,
		Message: message,
		Error:   errDetails,
	})
}

// BadRequest renders a 400 Bad Request error
func BadRequest(c *gin.Context, message string, errDetails any) {
	Error(c, http.StatusBadRequest, message, errDetails)
}

// NotFound renders a 404 Not Found error
func NotFound(c *gin.Context, message string) {
	Error(c, http.StatusNotFound, message, nil)
}

// InternalServerError renders a 500 Internal Server Error
func InternalServerError(c *gin.Context, message string) {
	Error(c, http.StatusInternalServerError, message, nil)
}
