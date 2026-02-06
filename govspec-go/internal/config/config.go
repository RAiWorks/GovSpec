package config

import (
	"os"
	"path/filepath"
	"strconv"

	"github.com/RAiWorks/GovSpec/govspec-go/internal/model"
	"github.com/joho/godotenv"
)

// Load reads configuration from .env files and environment variables.
// Search order: current directory, binary directory, ~/.govspec/
func Load() *model.Config {
	// Try loading .env from multiple locations
	locations := []string{
		".env",
	}

	if exe, err := os.Executable(); err == nil {
		locations = append(locations, filepath.Join(filepath.Dir(exe), ".env"))
	}

	if home, err := os.UserHomeDir(); err == nil {
		locations = append(locations, filepath.Join(home, ".govspec", ".env"))
	}

	for _, loc := range locations {
		_ = godotenv.Load(loc)
	}

	cfg := &model.Config{
		Port:     9741,
		DocsPath: "../docs",
		DBPath:   "./govspec.db",
		LogLevel: "info",
	}

	if v := os.Getenv("GOVSPEC_PORT"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 && p < 65536 {
			cfg.Port = p
		}
	}

	if v := os.Getenv("GOVSPEC_DOCS_PATH"); v != "" {
		cfg.DocsPath = v
	}

	if v := os.Getenv("GOVSPEC_DB_PATH"); v != "" {
		cfg.DBPath = v
	}

	if v := os.Getenv("GOVSPEC_LOG_LEVEL"); v != "" {
		cfg.LogLevel = v
	}

	return cfg
}
