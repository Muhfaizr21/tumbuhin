package routes

import (
	"time"

	"tumbuhin-backend/config"
	"tumbuhin-backend/controllers"
	adminDashCtrl "tumbuhin-backend/controllers/admin/dashboard"
	authLoginCtrl "tumbuhin-backend/controllers/auth/login"
	authRegisterCtrl "tumbuhin-backend/controllers/auth/register"
	bidanDashCtrl "tumbuhin-backend/controllers/bidan/dashboard"
	bidanIntervensiCtrl "tumbuhin-backend/controllers/bidan/intervensi"
	bidanGISCtrl "tumbuhin-backend/controllers/bidan/petagis"
	bidanPrioritasCtrl "tumbuhin-backend/controllers/bidan/prioritas"
	kaderDashCtrl "tumbuhin-backend/controllers/kader/dashboard"
	ortuDashCtrl "tumbuhin-backend/controllers/ortu/dashboard"
	"tumbuhin-backend/middlewares"
	"tumbuhin-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// RouteDependencies bundles all role-based controllers for clean dependency injection
type RouteDependencies struct {
	HealthCtrl       *controllers.HealthController
	UserCtrl         *controllers.UserController
	AuthLoginCtrl    *authLoginCtrl.Controller
	AuthRegisterCtrl *authRegisterCtrl.Controller
	KaderDashCtrl      *kaderDashCtrl.Controller
	BidanDashCtrl      *bidanDashCtrl.Controller
	BidanGISCtrl       *bidanGISCtrl.Controller
	BidanPrioritasCtrl *bidanPrioritasCtrl.Controller
	BidanIntervensiCtrl *bidanIntervensiCtrl.Controller
	AdminDashCtrl      *adminDashCtrl.Controller
	OrtuDashCtrl     *ortuDashCtrl.Controller
}

// SetupRouter initializes and configures the Gin engine with all routes and RBAC middlewares
func SetupRouter(cfg *config.Config, deps RouteDependencies) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "Cache-Control"},
		ExposeHeaders:    []string{"Content-Length", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/health", deps.HealthCtrl.Check)

	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", deps.HealthCtrl.Check)

		// Public Auth Routes
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/login", deps.AuthLoginCtrl.HandleLogin)
			authGroup.POST("/register", deps.AuthRegisterCtrl.HandleRegister)
			authGroup.GET("/me", middlewares.RequireAuth(cfg.JWTSecret), deps.AuthLoginCtrl.HandleMe)
		}

		// Public Magic Link Route for Orang Tua Balita (Zero-Login Portal)
		v1.GET("/public/child/:magicToken", deps.OrtuDashCtrl.HandleGetPortal)

		// Role 1: Kader Posyandu Routes (/api/v1/kader/...)
		kaderGroup := v1.Group("/kader")
		kaderGroup.Use(middlewares.RequireAuth(cfg.JWTSecret), middlewares.RequireRoles(models.RoleKader, models.RoleBidan, models.RoleAdmin))
		{
			kaderGroup.GET("/dashboard", deps.KaderDashCtrl.HandleGetOverview)
		}

		// Role 2: Bidan Desa Routes (/api/v1/bidan/...)
		bidanGroup := v1.Group("/bidan")
		bidanGroup.Use(middlewares.RequireAuth(cfg.JWTSecret), middlewares.RequireRoles(models.RoleBidan, models.RoleAdmin))
		{
			bidanGroup.GET("/dashboard", deps.BidanDashCtrl.HandleGetOverview)
			bidanGroup.GET("/gis-clusters", deps.BidanGISCtrl.HandleGetGISClusters)
			bidanGroup.GET("/priority-list", deps.BidanPrioritasCtrl.HandleGetPriorityList)
			bidanGroup.POST("/priority-list", deps.BidanPrioritasCtrl.HandleCreatePriorityChild)
			bidanGroup.PUT("/priority-list/:id", deps.BidanPrioritasCtrl.HandleUpdatePriorityChild)
			bidanGroup.DELETE("/priority-list/:id", deps.BidanPrioritasCtrl.HandleDeletePriorityChild)
			bidanGroup.GET("/intervensi", deps.BidanIntervensiCtrl.HandleGetInterventionList)
			bidanGroup.POST("/intervensi", deps.BidanIntervensiCtrl.HandleCreateIntervention)
			bidanGroup.PUT("/intervensi/:id", deps.BidanIntervensiCtrl.HandleUpdateIntervention)
			bidanGroup.DELETE("/intervensi/:id", deps.BidanIntervensiCtrl.HandleDeleteIntervention)
		}

		// Role 3: Super Admin Desa Routes (/api/v1/admin/...)
		adminGroup := v1.Group("/admin")
		adminGroup.Use(middlewares.RequireAuth(cfg.JWTSecret), middlewares.RequireRoles(models.RoleAdmin))
		{
			adminGroup.GET("/dashboard", deps.AdminDashCtrl.HandleGetOverview)
		}

		// Role 4: Orang Tua Balita Routes (/api/v1/ortu/...)
		ortuGroup := v1.Group("/ortu")
		ortuGroup.Use(middlewares.RequireAuth(cfg.JWTSecret), middlewares.RequireRoles(models.RoleOrtu, models.RoleKader, models.RoleBidan, models.RoleAdmin))
		{
			ortuGroup.GET("/dashboard", deps.OrtuDashCtrl.HandleGetPortal)
		}

		// Legacy User CRUD Routes
		users := v1.Group("/users")
		{
			users.GET("", deps.UserCtrl.GetAll)
			users.GET("/:id", deps.UserCtrl.GetByID)
			users.POST("", deps.UserCtrl.Create)
			users.PUT("/:id", deps.UserCtrl.Update)
			users.DELETE("/:id", deps.UserCtrl.Delete)
		}
	}

	// Graceful JSON fallback for undefined routes / methods
	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"success": false,
			"message": "Endpoint API tidak ditemukan (404). Silakan pastikan method & path URL sudah sesuai.",
			"data": gin.H{
				"method": c.Request.Method,
				"path":   c.Request.URL.Path,
			},
		})
	})

	router.NoMethod(func(c *gin.Context) {
		c.JSON(405, gin.H{
			"success": false,
			"message": "Metode HTTP tidak diizinkan untuk endpoint ini (405 Method Not Allowed)",
		})
	})

	return router
}
