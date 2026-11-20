package main

import (
	"log"

	"tumbuhin-backend/config"
	"tumbuhin-backend/controllers"
	adminDashCtrl "tumbuhin-backend/controllers/admin/dashboard"
	authLoginCtrl "tumbuhin-backend/controllers/auth/login"
	authRegisterCtrl "tumbuhin-backend/controllers/auth/register"
	bidanDashCtrl "tumbuhin-backend/controllers/bidan/dashboard"
	bidanGISCtrl "tumbuhin-backend/controllers/bidan/petagis"
	bidanPrioritasCtrl "tumbuhin-backend/controllers/bidan/prioritas"
	kaderDashCtrl "tumbuhin-backend/controllers/kader/dashboard"
	ortuDashCtrl "tumbuhin-backend/controllers/ortu/dashboard"
	"tumbuhin-backend/database"
	"tumbuhin-backend/repositories"
	adminDashRepo "tumbuhin-backend/repositories/admin/dashboard"
	authRepo "tumbuhin-backend/repositories/auth"
	bidanDashRepo "tumbuhin-backend/repositories/bidan/dashboard"
	bidanGISRepo "tumbuhin-backend/repositories/bidan/petagis"
	bidanPrioritasRepo "tumbuhin-backend/repositories/bidan/prioritas"
	kaderDashRepo "tumbuhin-backend/repositories/kader/dashboard"
	ortuDashRepo "tumbuhin-backend/repositories/ortu/dashboard"
	"tumbuhin-backend/routes"
	"tumbuhin-backend/services"
	adminDashService "tumbuhin-backend/services/admin/dashboard"
	authLoginService "tumbuhin-backend/services/auth/login"
	authRegisterService "tumbuhin-backend/services/auth/register"
	bidanDashService "tumbuhin-backend/services/bidan/dashboard"
	bidanGISService "tumbuhin-backend/services/bidan/petagis"
	bidanPrioritasService "tumbuhin-backend/services/bidan/prioritas"
	kaderDashService "tumbuhin-backend/services/kader/dashboard"
	ortuDashService "tumbuhin-backend/services/ortu/dashboard"
)

func main() {
	// 1. Load configuration and connect to Supabase PostgreSQL
	cfg := config.LoadConfig()
	defer cfg.DBPool.Close()

	// 2. Run database schema migration and seed 4 core role accounts
	if err := database.RunMigrationAndSeeder(cfg.DBPool); err != nil {
		log.Printf("Warning: database seeder encountered an issue: %v", err)
	}

	// 3. Initialize Repositories (Data Layer)
	userRepository := repositories.NewInMemoryUserRepository()
	authRepository := authRepo.NewPostgresAuthRepository(cfg.DBPool)
	kaderDashRepository := kaderDashRepo.NewRepository()
	bidanDashRepository := bidanDashRepo.NewRepository(cfg.DBPool)
	bidanGISRepository := bidanGISRepo.NewRepository(cfg.DBPool)
	bidanPrioritasRepository := bidanPrioritasRepo.NewRepository(cfg.DBPool)
	adminDashRepository := adminDashRepo.NewRepository()
	ortuDashRepository := ortuDashRepo.NewRepository()

	// 4. Initialize Services (Business Logic Layer)
	userService := services.NewUserService(userRepository)
	loginSvc := authLoginService.NewService(authRepository, cfg.JWTSecret)
	registerSvc := authRegisterService.NewService(authRepository, cfg.JWTSecret)
	kaderDashSvc := kaderDashService.NewService(kaderDashRepository)
	bidanDashSvc := bidanDashService.NewService(bidanDashRepository)
	bidanGISSvc := bidanGISService.NewService(bidanGISRepository)
	bidanPrioritasSvc := bidanPrioritasService.NewService(bidanPrioritasRepository)
	adminDashSvc := adminDashService.NewService(adminDashRepository)
	ortuDashSvc := ortuDashService.NewService(ortuDashRepository)

	// 5. Initialize Controllers (Presentation / Handler Layer)
	deps := routes.RouteDependencies{
		HealthCtrl:         controllers.NewHealthController(),
		UserCtrl:           controllers.NewUserController(userService),
		AuthLoginCtrl:      authLoginCtrl.NewController(loginSvc),
		AuthRegisterCtrl:   authRegisterCtrl.NewController(registerSvc),
		KaderDashCtrl:      kaderDashCtrl.NewController(kaderDashSvc),
		BidanDashCtrl:      bidanDashCtrl.NewController(bidanDashSvc),
		BidanGISCtrl:       bidanGISCtrl.NewController(bidanGISSvc),
		BidanPrioritasCtrl: bidanPrioritasCtrl.NewController(bidanPrioritasSvc),
		AdminDashCtrl:      adminDashCtrl.NewController(adminDashSvc),
		OrtuDashCtrl:       ortuDashCtrl.NewController(ortuDashSvc),
	}

	// 6. Setup Router and Start Server
	router := routes.SetupRouter(cfg, deps)

	log.Printf("Tumbuhin Backend API starting on http://localhost:%s ...", cfg.AppPort)
	if err := router.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
