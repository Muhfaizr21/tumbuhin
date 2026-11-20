package config

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv                 string
	AppPort                string
	CorsOrigin             string
	JWTSecret              string
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
	corsOrigin := getEnv("CORS_ORIGIN", "http://localhost:5173")
	jwtSecret := getEnv("JWT_SECRET", "tumbuhin-clinical-ai-secret-key-2026")
	databaseURL := getEnv("DATABASE_URL", "postgresql://postgres.ohkvymfxjxpkiulpziid:xmGe3YowTiXvZz7B@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres")
	supabaseURL := getEnv("SUPABASE_URL", "https://ohkvymfxjxpkiulpziid.supabase.co")
	supabaseAnonKey := getEnv("SUPABASE_ANON_KEY", "")
	supabaseServiceRoleKey := getEnv("SUPABASE_SERVICE_ROLE_KEY", "")

	if databaseURL == "" {
		log.Fatal("FATAL: DATABASE_URL is required in environment configuration")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	parsedConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("FATAL: Failed to parse DATABASE_URL: %v", err)
	}

	// Supabase Transaction Pooler compatibility (PgBouncer port 6543).
	// Must be QueryExecModeExec (4): a single round trip, so PgBouncer cannot
	// swap the server connection between describe and execute. The previous
	// value 3 was QueryExecModeDescribeExec (the enum starts at _ = iota),
	// which pgx documents as unsafe with transaction pooling and caused
	// intermittent "unnamed prepared statement does not exist" 500s.
	parsedConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeExec
	parsedConfig.MaxConns = 10
	parsedConfig.MinConns = 1
	parsedConfig.MaxConnLifetime = 30 * time.Minute
	parsedConfig.MaxConnIdleTime = 10 * time.Minute

	dbPool, err := pgxpool.NewWithConfig(ctx, parsedConfig)
	if err != nil {
		log.Fatalf("FATAL: Failed to create database connection pool: %v", err)
	}

	if err := dbPool.Ping(ctx); err != nil {
		log.Printf("WARNING: Could not ping remote PostgreSQL on startup (%v). Fallback memory/retry ready.", err)
	} else {
		log.Println("Successfully connected to Supabase PostgreSQL database.")
	}

	return &Config{
		AppEnv:                 appEnv,
		AppPort:                appPort,
		CorsOrigin:             corsOrigin,
		JWTSecret:              jwtSecret,
		DatabaseURL:            databaseURL,
		SupabaseURL:            supabaseURL,
		SupabaseAnonKey:        supabaseAnonKey,
		SupabaseServiceRoleKey: supabaseServiceRoleKey,
		DBPool:                 dbPool,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
