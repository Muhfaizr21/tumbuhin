package config

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv                 string
	AppPort                string
	DatabaseURL            string
	SupabaseURL            string
	SupabaseAnonKey        string
	SupabaseServiceRoleKey string
	DBPool                 *pgxpool.Pool
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	appEnv := getEnv("APP_ENV", "development")
	appPort := getEnv("APP_PORT", "8080")
	databaseURL := "postgresql://postgres.ohkvymfxjxpkiulpziid:xmGe3YowTiXvZz7B@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"
	supabaseURL := "https://ohkvymfxjxpkiulpziid.supabase.co"
	supabaseAnonKey := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3Z5bWZ4anhwa2l1bHB6aWlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwOTQyNDcsImV4cCI6MjExMDY3MDI0N30.L7YS5zoUd1bzcC_Um8lEJ__ARxjzRLULp0KIOPHt-WM"
	supabaseServiceRoleKey := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3Z5bWZ4anhwa2l1bHB6aWlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTA5NDI0NywiZXhwIjoyMTEwNjcwMjQ3fQ.x_P26Y3uxHTWzsTFVV1X3swOPhkiLZyGXNf6rxhMqRA"

	if databaseURL == "" {
		log.Fatal("FATAL: DATABASE_URL is required in environment configuration")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	parsedConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("FATAL: Failed to parse DATABASE_URL: %v", err)
	}

	// Supabase Transaction Pooler compatibility (PgBouncer port 6543)
	parsedConfig.ConnConfig.DefaultQueryExecMode = 3 // pgx.QueryExecModeSimpleProtocol
	parsedConfig.MaxConns = 10
	parsedConfig.MinConns = 2
	parsedConfig.MaxConnLifetime = 30 * time.Minute
	parsedConfig.MaxConnIdleTime = 10 * time.Minute

	dbPool, err := pgxpool.NewWithConfig(ctx, parsedConfig)
	if err != nil {
		log.Fatalf("FATAL: Failed to create database connection pool: %v", err)
	}

	if err := dbPool.Ping(ctx); err != nil {
		log.Fatalf("FATAL: Failed to ping Supabase PostgreSQL: %v", err)
	}

	log.Println("Successfully initialized and connected to Supabase PostgreSQL database.")

	return &Config{
		AppEnv:                 appEnv,
		AppPort:                appPort,
		DatabaseURL:            databaseURL,
		SupabaseURL:            supabaseURL,
		SupabaseAnonKey:        supabaseAnonKey,
		SupabaseServiceRoleKey: supabaseServiceRoleKey,
		DBPool:                 dbPool,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
