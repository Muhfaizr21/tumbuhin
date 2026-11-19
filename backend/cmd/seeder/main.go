package main

import (
	"log"
	"tumbuhin-backend/config"
	"tumbuhin-backend/database"
)

func main() {
	log.Println("=== TUMBUHIN DATABASE MIGRATION & SEEDER ===")
	cfg := config.LoadConfig()
	defer cfg.DBPool.Close()

	if err := database.RunMigrationAndSeeder(cfg.DBPool); err != nil {
		log.Fatalf("Seeder failed: %v", err)
	}
	log.Println("=== SEEDING COMPLETED SUCCESSFULLY ===")
}
