package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"tumbuhin-backend/config"
	"tumbuhin-backend/controllers"
	"tumbuhin-backend/repositories"
	"tumbuhin-backend/routes"
	"tumbuhin-backend/services"
)

func main() {
	// 1. Load configuration
	cfg := config.LoadConfig()
	log.Printf("[INFO] Starting Tumbuhin Backend in %s mode on port %s...", cfg.AppEnv, cfg.Port)

	// 2. Initialize Dependency Injection layers (Clean Code MVC)
	// Model/Persistence Layer (Repository)
	userRepo := repositories.NewInMemoryUserRepository()

	// Business Logic Layer (Service)
	userService := services.NewUserService(userRepo)

	// Controller Layer
	healthCtrl := controllers.NewHealthController()
	userCtrl := controllers.NewUserController(userService)

	// Routing Layer
	router := routes.SetupRouter(cfg, healthCtrl, userCtrl)

	// 3. Configure HTTP Server
	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 4. Run server in a goroutine for non-blocking graceful shutdown
	go func() {
		log.Printf("[INFO] Server listening on http://localhost:%s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("[FATAL] Server failed to start: %v", err)
		}
	}()

	// 5. Graceful shutdown listening to OS termination signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("[INFO] Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("[ERROR] Server forced to shutdown: %v", err)
	}

	log.Println("[INFO] Server exited successfully.")
}
