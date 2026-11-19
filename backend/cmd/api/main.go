package main

import (
	"log"
	"net/http"
	"tumbuhin-backend/config"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize configuration and database connection pool
	cfg := config.LoadConfig()
	defer cfg.DBPool.Close()

	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"env":    cfg.AppEnv,
		})
	})

	log.Printf("Server starting on port %s...", cfg.AppPort)
	if err := router.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
