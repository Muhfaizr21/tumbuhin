package routes

import (
	"time"

	"tumbuhin-backend/config"
	"tumbuhin-backend/controllers"
	adminDashCtrl "tumbuhin-backend/controllers/admin/dashboard"
	adminKnowledgeCtrl "tumbuhin-backend/controllers/admin/knowledge"
	adminPanganCtrl "tumbuhin-backend/controllers/admin/pangan"
	adminPengaturanCtrl "tumbuhin-backend/controllers/admin/pengaturan"
	adminPenggunaCtrl "tumbuhin-backend/controllers/admin/pengguna"
	adminStandarWhoCtrl "tumbuhin-backend/controllers/admin/standarwho"
	adminWilayahCtrl "tumbuhin-backend/controllers/admin/wilayah"
	authLoginCtrl "tumbuhin-backend/controllers/auth/login"
	authRegisterCtrl "tumbuhin-backend/controllers/auth/register"
	bidanDashCtrl "tumbuhin-backend/controllers/bidan/dashboard"
	bidanIntervensiCtrl "tumbuhin-backend/controllers/bidan/intervensi"
	bidanInterventionsCtrl "tumbuhin-backend/controllers/bidan/interventions"
	bidanLaporanCtrl "tumbuhin-backend/controllers/bidan/laporan"
	bidanGISCtrl "tumbuhin-backend/controllers/bidan/petagis"
	bidanPMTEvalCtrl "tumbuhin-backend/controllers/bidan/pmt_evaluations"
	bidanPrioritasCtrl "tumbuhin-backend/controllers/bidan/prioritas"
	bidanSupervisiCtrl "tumbuhin-backend/controllers/bidan/supervisi"
	kaderBalitaCtrl "tumbuhin-backend/controllers/kader/balita"
	kaderDashCtrl "tumbuhin-backend/controllers/kader/dashboard"
	kaderNutriChefCtrl "tumbuhin-backend/controllers/kader/nutrichef"
	kaderSyncCtrl "tumbuhin-backend/controllers/kader/sinkronisasi"
	kaderTimbangCtrl "tumbuhin-backend/controllers/kader/timbang"
	ortuDashCtrl "tumbuhin-backend/controllers/ortu/dashboard"
	"tumbuhin-backend/middlewares"
	"tumbuhin-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// RouteDependencies bundles all role-based controllers for clean dependency injection
type RouteDependencies struct {
	HealthCtrl             *controllers.HealthController
	UserCtrl               *controllers.UserController
	AuthLoginCtrl          *authLoginCtrl.Controller
	AuthRegisterCtrl       *authRegisterCtrl.Controller
	KaderDashCtrl          *kaderDashCtrl.Controller
	KaderBalitaCtrl        *kaderBalitaCtrl.Controller
	KaderTimbangCtrl       *kaderTimbangCtrl.Controller
	KaderSyncCtrl          *kaderSyncCtrl.Controller
	KaderNutriChefCtrl     *kaderNutriChefCtrl.Controller
	BidanDashCtrl          *bidanDashCtrl.Controller
	BidanGISCtrl           *bidanGISCtrl.Controller
	BidanPrioritasCtrl     *bidanPrioritasCtrl.Controller
	BidanIntervensiCtrl    *bidanIntervensiCtrl.Controller
	BidanInterventionsCtrl *bidanInterventionsCtrl.Controller
	BidanPMTEvalCtrl       *bidanPMTEvalCtrl.Controller
	BidanSupervisiCtrl     *bidanSupervisiCtrl.Controller
	BidanLaporanCtrl       *bidanLaporanCtrl.Controller
	AdminDashCtrl          *adminDashCtrl.Controller
	AdminWilayahCtrl       *adminWilayahCtrl.Controller
	AdminPenggunaCtrl      *adminPenggunaCtrl.Controller
	AdminPanganCtrl        *adminPanganCtrl.Controller
	AdminKnowledgeCtrl     *adminKnowledgeCtrl.Controller
	AdminStandarWhoCtrl    *adminStandarWhoCtrl.Controller
	AdminPengaturanCtrl    *adminPengaturanCtrl.Controller
	OrtuDashCtrl           *ortuDashCtrl.Controller
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
			kaderGroup.GET("/balita", deps.KaderBalitaCtrl.HandleGetChildren)
			kaderGroup.POST("/balita", deps.KaderBalitaCtrl.HandleCreateChild)
			kaderGroup.PUT("/balita/:id", deps.KaderBalitaCtrl.HandleUpdateChild)
			kaderGroup.DELETE("/balita/:id", deps.KaderBalitaCtrl.HandleDeleteChild)
			kaderGroup.POST("/timbang", deps.KaderTimbangCtrl.HandleSaveMeasurement)
			kaderGroup.POST("/sinkronisasi/batch", deps.KaderSyncCtrl.HandleBatchSync)
			kaderGroup.GET("/sinkronisasi/status", deps.KaderSyncCtrl.HandleSyncStatus)
			kaderGroup.POST("/nutrichef/generate", deps.KaderNutriChefCtrl.HandleGenerateRecipe)
			kaderGroup.GET("/local-foods", deps.AdminPanganCtrl.HandleListLocalFoods)
			kaderGroup.GET("/posyandus", deps.AdminWilayahCtrl.HandleListPosyandus)
			kaderGroup.GET("/settings", deps.AdminPengaturanCtrl.HandleGetSettingsAndAudit)
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

			// Batch 2: Home Visit (SOAP + PMT), fitur.md 2.4
			bidanGroup.GET("/interventions", deps.BidanInterventionsCtrl.HandleListHomeVisits)
			bidanGroup.POST("/interventions", deps.BidanInterventionsCtrl.HandleCreateHomeVisit)
			bidanGroup.PATCH("/interventions/:id/status", deps.BidanInterventionsCtrl.HandleUpdateHomeVisitStatus)

			// Batch 2: Evaluasi Program PMT 90 hari, fitur.md 2.5
			bidanGroup.GET("/pmt-evaluations", deps.BidanPMTEvalCtrl.HandleListEvaluations)
			bidanGroup.GET("/pmt-evaluations/:id", deps.BidanPMTEvalCtrl.HandleGetEvaluationDetail)
			bidanGroup.PATCH("/pmt-evaluations/:id/compliance", deps.BidanPMTEvalCtrl.HandleUpdateCompliance)

			// Batch 3: Supervisi Posyandu & Audit Data, fitur.md 2.6
			bidanGroup.GET("/supervision", deps.BidanSupervisiCtrl.HandleGetSupervision)
			bidanGroup.POST("/supervision/lock", deps.BidanSupervisiCtrl.HandleLockSupervision)

			// Batch 3: Laporan & Ekspor e-PPGBM, fitur.md 2.7
			bidanGroup.GET("/export", deps.BidanLaporanCtrl.HandleExport)
		}

		// Role 3: Super Admin Desa Routes (/api/v1/admin/...)
		adminGroup := v1.Group("/admin")
		adminGroup.Use(middlewares.RequireAuth(cfg.JWTSecret), middlewares.RequireRoles(models.RoleAdmin))
		{
			// 3.1. Dashboard Ikhtisar Sistem
			adminGroup.GET("/dashboard", deps.AdminDashCtrl.HandleGetOverview)

			// 3.2. Master Wilayah & Posyandu
			adminGroup.GET("/posyandus", deps.AdminWilayahCtrl.HandleListPosyandus)
			adminGroup.POST("/posyandus", deps.AdminWilayahCtrl.HandleCreatePosyandu)
			adminGroup.PUT("/posyandus/:id", deps.AdminWilayahCtrl.HandleUpdatePosyandu)
			adminGroup.PATCH("/posyandus/:id/toggle", deps.AdminWilayahCtrl.HandleTogglePosyandu)
			adminGroup.DELETE("/posyandus/:id", deps.AdminWilayahCtrl.HandleDeletePosyandu)

			// 3.3. Manajemen Akun, RBAC & Magic Token
			adminGroup.GET("/users", deps.AdminPenggunaCtrl.HandleListUsersAndTokens)
			adminGroup.POST("/users", deps.AdminPenggunaCtrl.HandleCreateUser)
			adminGroup.PUT("/users/:id", deps.AdminPenggunaCtrl.HandleUpdateUser)
			adminGroup.PATCH("/users/:id/toggle", deps.AdminPenggunaCtrl.HandleToggleUserActive)
			adminGroup.DELETE("/users/:id", deps.AdminPenggunaCtrl.HandleDeleteUser)
			adminGroup.POST("/children/:id/regenerate-token", deps.AdminPenggunaCtrl.HandleRegenerateChildToken)

			// 3.4. Harga Pangan Lokal Desa
			adminGroup.GET("/local-foods", deps.AdminPanganCtrl.HandleListLocalFoods)
			adminGroup.POST("/local-foods", deps.AdminPanganCtrl.HandleCreateLocalFood)
			adminGroup.PUT("/local-foods/:id", deps.AdminPanganCtrl.HandleUpdateLocalFood)
			adminGroup.PATCH("/local-foods/:id/toggle", deps.AdminPanganCtrl.HandleToggleLocalFood)
			adminGroup.DELETE("/local-foods/:id", deps.AdminPanganCtrl.HandleDeleteLocalFood)

			// 3.5. Knowledge Base AI (RAG) & Sandbox Playground
			adminGroup.GET("/knowledge-chunks", deps.AdminKnowledgeCtrl.HandleListKnowledgeChunks)
			adminGroup.POST("/knowledge-chunks", deps.AdminKnowledgeCtrl.HandleCreateKnowledgeChunk)
			adminGroup.PUT("/knowledge-chunks/:id", deps.AdminKnowledgeCtrl.HandleUpdateKnowledgeChunk)
			adminGroup.DELETE("/knowledge-chunks/:id", deps.AdminKnowledgeCtrl.HandleDeleteKnowledgeChunk)
			adminGroup.POST("/knowledge-chunks/upload", deps.AdminKnowledgeCtrl.HandleUploadDocument)
			adminGroup.POST("/knowledge-chunks/reindex", deps.AdminKnowledgeCtrl.HandleReindexVectors)
			adminGroup.POST("/knowledge-chunks/playground", deps.AdminKnowledgeCtrl.HandleTestRAGPlayground)

			// 3.6. Standar Antropometri WHO & Simulator Kalibrasi
			adminGroup.GET("/who-standards", deps.AdminStandarWhoCtrl.HandleListWhoStandards)
			adminGroup.POST("/who-standards", deps.AdminStandarWhoCtrl.HandleUpsertWhoStandard)
			adminGroup.POST("/who-standards/simulate", deps.AdminStandarWhoCtrl.HandleSimulateWhoZScore)

			// 3.7. Log Sinkronisasi & Pengaturan Desa
			adminGroup.GET("/settings", deps.AdminPengaturanCtrl.HandleGetSettingsAndAudit)
			adminGroup.PUT("/settings", deps.AdminPengaturanCtrl.HandleUpdateVillageSettings)
			adminGroup.POST("/settings/sync-logs/:id/resolve", deps.AdminPengaturanCtrl.HandleResolveSyncLog)
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

	// Offline batch sync aliases documented in the technical specification.
	syncRoles := []gin.HandlerFunc{
		middlewares.RequireAuth(cfg.JWTSecret),
		middlewares.RequireRoles(models.RoleKader, models.RoleBidan, models.RoleAdmin),
	}
	router.POST("/api/measurements/sync", append(syncRoles, deps.KaderSyncCtrl.HandleBatchSync)...)
	router.GET("/api/measurements/sync/status", append(syncRoles, deps.KaderSyncCtrl.HandleSyncStatus)...)
	router.POST("/api/v1/measurements/sync", append(syncRoles, deps.KaderSyncCtrl.HandleBatchSync)...)

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
