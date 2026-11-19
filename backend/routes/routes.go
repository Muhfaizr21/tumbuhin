package routes

import (
	"time"

	"tumbuhin-backend/config"
	"tumbuhin-backend/controllers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SetupRouter initializes and configures the Gin engine with all routes and middlewares
func SetupRouter(cfg *config.Config, healthCtrl *controllers.HealthController, userCtrl *controllers.UserController) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Global middlewares
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Configure CORS for frontend communication
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.CorsOrigin, "http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API version 1 route group
	v1 := router.Group("/api/v1")
	{
		// Health check
		v1.GET("/health", healthCtrl.Check)

		// User resource routes
		users := v1.Group("/users")
		{
			users.GET("", userCtrl.GetAll)
			users.GET("/:id", userCtrl.GetByID)
			users.POST("", userCtrl.Create)
			users.PUT("/:id", userCtrl.Update)
			users.DELETE("/:id", userCtrl.Delete)
		}
	}

	return router
}
