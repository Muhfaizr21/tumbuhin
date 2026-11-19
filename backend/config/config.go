package config

import (
	"os"
)

// Config holds the application configuration settings
type Config struct {
	AppEnv     string
	Port       string
	AppURL     string
	CorsOrigin string
}

// LoadConfig loads configuration from environment variables or returns sensible defaults
func LoadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:" + port
	}

	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "http://localhost:5173" // Default Vite dev server URL
	}

	return &Config{
		AppEnv:     appEnv,
		Port:       port,
		AppURL:     appURL,
		CorsOrigin: corsOrigin,
	}
}
