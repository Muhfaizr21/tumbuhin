package main

import (
	"log"

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
	bidanInterventionsCtrl "tumbuhin-backend/controllers/bidan/interventions"
	bidanLaporanCtrl "tumbuhin-backend/controllers/bidan/laporan"
	bidanParentsCtrl "tumbuhin-backend/controllers/bidan/parents"
	bidanGISCtrl "tumbuhin-backend/controllers/bidan/petagis"
	bidanPMTEvalCtrl "tumbuhin-backend/controllers/bidan/pmt_evaluations"
	bidanPrioritasCtrl "tumbuhin-backend/controllers/bidan/prioritas"
	bidanSupervisiCtrl "tumbuhin-backend/controllers/bidan/supervisi"
	kaderBalitaCtrl "tumbuhin-backend/controllers/kader/balita"
	kaderDashCtrl "tumbuhin-backend/controllers/kader/dashboard"
	kaderNutriChefCtrl "tumbuhin-backend/controllers/kader/nutrichef"
	kaderParentCtrl "tumbuhin-backend/controllers/kader/parents"
	kaderSyncCtrl "tumbuhin-backend/controllers/kader/sinkronisasi"
	kaderTimbangCtrl "tumbuhin-backend/controllers/kader/timbang"
	ortuDashCtrl "tumbuhin-backend/controllers/ortu/dashboard"
	"tumbuhin-backend/database"
	adminDashRepo "tumbuhin-backend/repositories/admin/dashboard"
	adminKnowledgeRepo "tumbuhin-backend/repositories/admin/knowledge"
	adminPanganRepo "tumbuhin-backend/repositories/admin/pangan"
	adminPengaturanRepo "tumbuhin-backend/repositories/admin/pengaturan"
	adminPenggunaRepo "tumbuhin-backend/repositories/admin/pengguna"
	adminStandarWhoRepo "tumbuhin-backend/repositories/admin/standarwho"
	adminWilayahRepo "tumbuhin-backend/repositories/admin/wilayah"
	authRepo "tumbuhin-backend/repositories/auth"
	bidanDashRepo "tumbuhin-backend/repositories/bidan/dashboard"
	bidanInterventionsRepo "tumbuhin-backend/repositories/bidan/interventions"
	bidanLaporanRepo "tumbuhin-backend/repositories/bidan/laporan"
	bidanParentsRepo "tumbuhin-backend/repositories/bidan/parents"
	bidanGISRepo "tumbuhin-backend/repositories/bidan/petagis"
	bidanPMTEvalRepo "tumbuhin-backend/repositories/bidan/pmt_evaluations"
	bidanPrioritasRepo "tumbuhin-backend/repositories/bidan/prioritas"
	bidanSupervisiRepo "tumbuhin-backend/repositories/bidan/supervisi"
	kaderBalitaRepo "tumbuhin-backend/repositories/kader/balita"
	kaderDashRepo "tumbuhin-backend/repositories/kader/dashboard"
	kaderNutriChefRepo "tumbuhin-backend/repositories/kader/nutrichef"
	kaderSyncRepo "tumbuhin-backend/repositories/kader/sinkronisasi"
	kaderTimbangRepo "tumbuhin-backend/repositories/kader/timbang"
	ortuAccountsRepo "tumbuhin-backend/repositories/ortu/accounts"
	ortuDashRepo "tumbuhin-backend/repositories/ortu/dashboard"
	"tumbuhin-backend/routes"
	adminDashService "tumbuhin-backend/services/admin/dashboard"
	adminKnowledgeService "tumbuhin-backend/services/admin/knowledge"
	adminPanganService "tumbuhin-backend/services/admin/pangan"
	adminPengaturanService "tumbuhin-backend/services/admin/pengaturan"
	adminPenggunaService "tumbuhin-backend/services/admin/pengguna"
	adminStandarWhoService "tumbuhin-backend/services/admin/standarwho"
	adminWilayahService "tumbuhin-backend/services/admin/wilayah"
	authLoginService "tumbuhin-backend/services/auth/login"
	authRegisterService "tumbuhin-backend/services/auth/register"
	bidanDashService "tumbuhin-backend/services/bidan/dashboard"
	bidanInterventionsService "tumbuhin-backend/services/bidan/interventions"
	bidanLaporanService "tumbuhin-backend/services/bidan/laporan"
	bidanGISService "tumbuhin-backend/services/bidan/petagis"
	bidanPMTEvalService "tumbuhin-backend/services/bidan/pmt_evaluations"
	bidanPrioritasService "tumbuhin-backend/services/bidan/prioritas"
	bidanSupervisiService "tumbuhin-backend/services/bidan/supervisi"
	bidanParentsService "tumbuhin-backend/services/bidan/parents"
	kaderBalitaService "tumbuhin-backend/services/kader/balita"
	kaderDashService "tumbuhin-backend/services/kader/dashboard"
	kaderNutriChefService "tumbuhin-backend/services/kader/nutrichef"
	kaderSyncService "tumbuhin-backend/services/kader/sinkronisasi"
	kaderTimbangService "tumbuhin-backend/services/kader/timbang"
	kaderParentService "tumbuhin-backend/services/ortu/accounts"
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
	authRepository := authRepo.NewPostgresAuthRepository(cfg.DBPool)
	kaderBalitaRepository := kaderBalitaRepo.NewRepository(cfg.DBPool)
	kaderTimbangRepository := kaderTimbangRepo.NewRepository(cfg.DBPool)
	kaderSyncRepository := kaderSyncRepo.NewRepository(cfg.DBPool)
	kaderNutriChefRepository := kaderNutriChefRepo.NewRepository(cfg.DBPool)
	kaderDashRepository := kaderDashRepo.NewRepository(cfg.DBPool)
	ortuAccountsRepository := ortuAccountsRepo.NewRepository(cfg.DBPool)
	bidanDashRepository := bidanDashRepo.NewRepository(cfg.DBPool)
	bidanGISRepository := bidanGISRepo.NewRepository(cfg.DBPool)
	bidanInterventionsRepository := bidanInterventionsRepo.NewRepository(cfg.DBPool)
	bidanPMTEvalRepository := bidanPMTEvalRepo.NewRepository(cfg.DBPool)
	bidanPrioritasRepository := bidanPrioritasRepo.NewRepository(cfg.DBPool)
	bidanSupervisiRepository := bidanSupervisiRepo.NewRepository(cfg.DBPool)
	bidanLaporanRepository := bidanLaporanRepo.NewRepository(cfg.DBPool)
	bidanParentsRepository := bidanParentsRepo.NewRepository(cfg.DBPool)
	adminDashRepository := adminDashRepo.NewRepository(cfg.DBPool)
	adminWilayahRepository := adminWilayahRepo.NewRepository(cfg.DBPool)
	adminPenggunaRepository := adminPenggunaRepo.NewRepository(cfg.DBPool)
	adminPanganRepository := adminPanganRepo.NewRepository(cfg.DBPool)
	adminKnowledgeRepository := adminKnowledgeRepo.NewRepository(cfg.DBPool)
	adminStandarWhoRepository := adminStandarWhoRepo.NewRepository(cfg.DBPool)
	adminPengaturanRepository := adminPengaturanRepo.NewRepository(cfg.DBPool)
	ortuDashRepository := ortuDashRepo.NewRepository(cfg.DBPool)

	// 4. Initialize Services (Business Logic Layer)
	loginSvc := authLoginService.NewService(authRepository, cfg.JWTSecret)
	registerSvc := authRegisterService.NewService(authRepository, cfg.JWTSecret)
	kaderBalitaSvc := kaderBalitaService.NewService(kaderBalitaRepository)
	kaderTimbangSvc := kaderTimbangService.NewService(kaderTimbangRepository)
	kaderSyncSvc := kaderSyncService.NewService(kaderSyncRepository, kaderTimbangSvc, kaderBalitaSvc)
	kaderNutriChefSvc := kaderNutriChefService.NewService(kaderNutriChefRepository)
	kaderDashSvc := kaderDashService.NewService(kaderDashRepository)
	kaderParentSvc := kaderParentService.NewService(ortuAccountsRepository)
	bidanDashSvc := bidanDashService.NewService(bidanDashRepository)
	bidanGISSvc := bidanGISService.NewService(bidanGISRepository)
	bidanInterventionsSvc := bidanInterventionsService.NewService(bidanInterventionsRepository)
	bidanPMTEvalSvc := bidanPMTEvalService.NewService(bidanPMTEvalRepository)
	bidanPrioritasSvc := bidanPrioritasService.NewService(bidanPrioritasRepository)
	bidanSupervisiSvc := bidanSupervisiService.NewService(bidanSupervisiRepository)
	bidanLaporanSvc := bidanLaporanService.NewService(bidanLaporanRepository)
	bidanParentsSvc := bidanParentsService.NewService(bidanParentsRepository)
	adminDashSvc := adminDashService.NewService(adminDashRepository)
	adminWilayahSvc := adminWilayahService.NewService(adminWilayahRepository)
	adminPenggunaSvc := adminPenggunaService.NewService(adminPenggunaRepository)
	adminPanganSvc := adminPanganService.NewService(adminPanganRepository)
	adminKnowledgeSvc := adminKnowledgeService.NewService(adminKnowledgeRepository)
	adminStandarWhoSvc := adminStandarWhoService.NewService(adminStandarWhoRepository)
	adminPengaturanSvc := adminPengaturanService.NewService(adminPengaturanRepository)
	ortuDashSvc := ortuDashService.NewService(ortuDashRepository)

	// 5. Initialize Controllers (Presentation / Handler Layer)
	deps := routes.RouteDependencies{
		HealthCtrl:             controllers.NewHealthController(),
		AuthLoginCtrl:          authLoginCtrl.NewController(loginSvc),
		AuthRegisterCtrl:       authRegisterCtrl.NewController(registerSvc),
		KaderDashCtrl:          kaderDashCtrl.NewController(kaderDashSvc),
		KaderBalitaCtrl:        kaderBalitaCtrl.NewController(kaderBalitaSvc),
		KaderParentCtrl:        kaderParentCtrl.NewController(kaderParentSvc),
		KaderTimbangCtrl:       kaderTimbangCtrl.NewController(kaderTimbangSvc),
		KaderSyncCtrl:          kaderSyncCtrl.NewController(kaderSyncSvc),
		KaderNutriChefCtrl:     kaderNutriChefCtrl.NewController(kaderNutriChefSvc),
		BidanDashCtrl:          bidanDashCtrl.NewController(bidanDashSvc),
		BidanGISCtrl:           bidanGISCtrl.NewController(bidanGISSvc),
		BidanPrioritasCtrl:     bidanPrioritasCtrl.NewController(bidanPrioritasSvc),
		BidanInterventionsCtrl: bidanInterventionsCtrl.NewController(bidanInterventionsSvc),
		BidanPMTEvalCtrl:       bidanPMTEvalCtrl.NewController(bidanPMTEvalSvc),
		BidanSupervisiCtrl:     bidanSupervisiCtrl.NewController(bidanSupervisiSvc),
		BidanLaporanCtrl:       bidanLaporanCtrl.NewController(bidanLaporanSvc),
		BidanParentsCtrl:       bidanParentsCtrl.NewController(bidanParentsSvc),
		AdminDashCtrl:          adminDashCtrl.NewController(adminDashSvc),
		AdminWilayahCtrl:       adminWilayahCtrl.NewController(adminWilayahSvc),
		AdminPenggunaCtrl:      adminPenggunaCtrl.NewController(adminPenggunaSvc),
		AdminPanganCtrl:        adminPanganCtrl.NewController(adminPanganSvc),
		AdminKnowledgeCtrl:     adminKnowledgeCtrl.NewController(adminKnowledgeSvc),
		AdminStandarWhoCtrl:    adminStandarWhoCtrl.NewController(adminStandarWhoSvc),
		AdminPengaturanCtrl:    adminPengaturanCtrl.NewController(adminPengaturanSvc),
		OrtuDashCtrl:           ortuDashCtrl.NewController(ortuDashSvc),
	}

	// 6. Setup Router and Start Server
	router := routes.SetupRouter(cfg, deps)

	log.Printf("Tumbuhin Backend API starting on http://localhost:%s ...", cfg.AppPort)
	if err := router.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
