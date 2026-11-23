package main

import (
	"log"

	"tumbuhin-backend/config"
	"tumbuhin-backend/controllers"
	adminDashCtrl "tumbuhin-backend/controllers/admin/dashboard"
	authLoginCtrl "tumbuhin-backend/controllers/auth/login"
	authRegisterCtrl "tumbuhin-backend/controllers/auth/register"
	bidanDashCtrl "tumbuhin-backend/controllers/bidan/dashboard"
	bidanIntervensiCtrl "tumbuhin-backend/controllers/bidan/intervensi"
	bidanInterventionsCtrl "tumbuhin-backend/controllers/bidan/interventions"
	bidanGISCtrl "tumbuhin-backend/controllers/bidan/petagis"
	bidanPMTEvalCtrl "tumbuhin-backend/controllers/bidan/pmt_evaluations"
	bidanPrioritasCtrl "tumbuhin-backend/controllers/bidan/prioritas"
	bidanSupervisiCtrl "tumbuhin-backend/controllers/bidan/supervisi"
	bidanLaporanCtrl "tumbuhin-backend/controllers/bidan/laporan"
	kaderBalitaCtrl "tumbuhin-backend/controllers/kader/balita"
	kaderTimbangCtrl "tumbuhin-backend/controllers/kader/timbang"
	kaderDashCtrl "tumbuhin-backend/controllers/kader/dashboard"
	ortuDashCtrl "tumbuhin-backend/controllers/ortu/dashboard"
	"tumbuhin-backend/database"
	"tumbuhin-backend/repositories"
	adminDashRepo "tumbuhin-backend/repositories/admin/dashboard"
	authRepo "tumbuhin-backend/repositories/auth"
	bidanDashRepo "tumbuhin-backend/repositories/bidan/dashboard"
	bidanIntervensiRepo "tumbuhin-backend/repositories/bidan/intervensi"
	bidanInterventionsRepo "tumbuhin-backend/repositories/bidan/interventions"
	bidanGISRepo "tumbuhin-backend/repositories/bidan/petagis"
	bidanPMTEvalRepo "tumbuhin-backend/repositories/bidan/pmt_evaluations"
	bidanPrioritasRepo "tumbuhin-backend/repositories/bidan/prioritas"
	bidanSupervisiRepo "tumbuhin-backend/repositories/bidan/supervisi"
	bidanLaporanRepo "tumbuhin-backend/repositories/bidan/laporan"
	kaderBalitaRepo "tumbuhin-backend/repositories/kader/balita"
	kaderTimbangRepo "tumbuhin-backend/repositories/kader/timbang"
	kaderDashRepo "tumbuhin-backend/repositories/kader/dashboard"
	ortuDashRepo "tumbuhin-backend/repositories/ortu/dashboard"
	"tumbuhin-backend/routes"
	"tumbuhin-backend/services"
	adminDashService "tumbuhin-backend/services/admin/dashboard"
	authLoginService "tumbuhin-backend/services/auth/login"
	authRegisterService "tumbuhin-backend/services/auth/register"
	bidanDashService "tumbuhin-backend/services/bidan/dashboard"
	bidanIntervensiService "tumbuhin-backend/services/bidan/intervensi"
	bidanInterventionsService "tumbuhin-backend/services/bidan/interventions"
	bidanGISService "tumbuhin-backend/services/bidan/petagis"
	bidanPMTEvalService "tumbuhin-backend/services/bidan/pmt_evaluations"
	bidanPrioritasService "tumbuhin-backend/services/bidan/prioritas"
	bidanSupervisiService "tumbuhin-backend/services/bidan/supervisi"
	bidanLaporanService "tumbuhin-backend/services/bidan/laporan"
	kaderBalitaService "tumbuhin-backend/services/kader/balita"
	kaderTimbangService "tumbuhin-backend/services/kader/timbang"
	kaderDashService "tumbuhin-backend/services/kader/dashboard"
	ortuDashService "tumbuhin-backend/services/ortu/dashboard"
)

func main() {
	// 1. Load configuration and connect to Supabase PostgreSQL
	cfg := config.LoadConfig()
	defer cfg.DBPool.Close()

	// 2. Run database schema migration and seed 4 core role accounts (all batches unified)
	if err := database.RunMigrationAndSeeder(cfg.DBPool); err != nil {
		log.Printf("Warning: database seeder encountered an issue: %v", err)
	}

	// 3. Initialize Repositories (Data Layer)
	userRepository := repositories.NewInMemoryUserRepository()
	authRepository := authRepo.NewPostgresAuthRepository(cfg.DBPool)
	kaderBalitaRepository := kaderBalitaRepo.NewRepository(cfg.DBPool)
	kaderTimbangRepository := kaderTimbangRepo.NewRepository(cfg.DBPool)
	kaderDashRepository := kaderDashRepo.NewRepository(cfg.DBPool)
	bidanDashRepository := bidanDashRepo.NewRepository(cfg.DBPool)
	bidanGISRepository := bidanGISRepo.NewRepository(cfg.DBPool)
	bidanIntervensiRepository := bidanIntervensiRepo.NewRepository(cfg.DBPool)
	bidanInterventionsRepository := bidanInterventionsRepo.NewRepository(cfg.DBPool)
	bidanPMTEvalRepository := bidanPMTEvalRepo.NewRepository(cfg.DBPool)
	bidanPrioritasRepository := bidanPrioritasRepo.NewRepository(cfg.DBPool)
	bidanSupervisiRepository := bidanSupervisiRepo.NewRepository(cfg.DBPool)
	bidanLaporanRepository := bidanLaporanRepo.NewRepository(cfg.DBPool)
	adminDashRepository := adminDashRepo.NewRepository()
	ortuDashRepository := ortuDashRepo.NewRepository()

	// 4. Initialize Services (Business Logic Layer)
	userService := services.NewUserService(userRepository)
	loginSvc := authLoginService.NewService(authRepository, cfg.JWTSecret)
	registerSvc := authRegisterService.NewService(authRepository, cfg.JWTSecret)
	kaderBalitaSvc := kaderBalitaService.NewService(kaderBalitaRepository)
	kaderTimbangSvc := kaderTimbangService.NewService(kaderTimbangRepository)
	kaderDashSvc := kaderDashService.NewService(kaderDashRepository)
	bidanDashSvc := bidanDashService.NewService(bidanDashRepository)
	bidanGISSvc := bidanGISService.NewService(bidanGISRepository)
	bidanIntervensiSvc := bidanIntervensiService.NewService(bidanIntervensiRepository)
	bidanInterventionsSvc := bidanInterventionsService.NewService(bidanInterventionsRepository)
	bidanPMTEvalSvc := bidanPMTEvalService.NewService(bidanPMTEvalRepository)
	bidanPrioritasSvc := bidanPrioritasService.NewService(bidanPrioritasRepository)
	bidanSupervisiSvc := bidanSupervisiService.NewService(bidanSupervisiRepository)
	bidanLaporanSvc := bidanLaporanService.NewService(bidanLaporanRepository)
	adminDashSvc := adminDashService.NewService(adminDashRepository)
	ortuDashSvc := ortuDashService.NewService(ortuDashRepository)

	// 5. Initialize Controllers (Presentation / Handler Layer)
	deps := routes.RouteDependencies{
		HealthCtrl:             controllers.NewHealthController(),
		UserCtrl:               controllers.NewUserController(userService),
		AuthLoginCtrl:          authLoginCtrl.NewController(loginSvc),
		AuthRegisterCtrl:       authRegisterCtrl.NewController(registerSvc),
		KaderDashCtrl:          kaderDashCtrl.NewController(kaderDashSvc),
		KaderBalitaCtrl:        kaderBalitaCtrl.NewController(kaderBalitaSvc),
		KaderTimbangCtrl:       kaderTimbangCtrl.NewController(kaderTimbangSvc),
		BidanDashCtrl:          bidanDashCtrl.NewController(bidanDashSvc),
		BidanGISCtrl:           bidanGISCtrl.NewController(bidanGISSvc),
		BidanPrioritasCtrl:     bidanPrioritasCtrl.NewController(bidanPrioritasSvc),
		BidanIntervensiCtrl:    bidanIntervensiCtrl.NewController(bidanIntervensiSvc),
		BidanInterventionsCtrl: bidanInterventionsCtrl.NewController(bidanInterventionsSvc),
		BidanPMTEvalCtrl:       bidanPMTEvalCtrl.NewController(bidanPMTEvalSvc),
		BidanSupervisiCtrl:     bidanSupervisiCtrl.NewController(bidanSupervisiSvc),
		BidanLaporanCtrl:       bidanLaporanCtrl.NewController(bidanLaporanSvc),
		AdminDashCtrl:          adminDashCtrl.NewController(adminDashSvc),
		OrtuDashCtrl:           ortuDashCtrl.NewController(ortuDashSvc),
	}

	// 6. Setup Router and Start Server
	router := routes.SetupRouter(cfg, deps)

	log.Printf("Tumbuhin Backend API starting on http://localhost:%s ...", cfg.AppPort)
	if err := router.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
