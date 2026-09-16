package config

import (
	"fmt"
	"os"
	"strings"
)

// Config holds strongly-typed env configuration — all values must come from env, no hardcoded defaults.
type Config struct {
	Port        string
	JWTSecret   string
	CORSOrigins []string
	Database    DatabaseConfig
}

// DatabaseConfig holds Postgres connection values — all from env.
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

// DSN returns a Postgres DSN for pgx.
func (c DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		c.User, c.Password, c.Host, c.Port, c.Name, c.SSLMode,
	)
}

// Load reads required env vars — fails fast if any are missing (no hardcoded fallbacks).
func Load() (*Config, error) {
	port, err := mustEnv("PORT")
	if err != nil {
		return nil, err
	}
	jwtSecret, err := mustEnv("JWT_SECRET")
	if err != nil {
		return nil, err
	}
	if len(jwtSecret) < 16 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 16 chars")
	}

	dbHost, err := mustEnv("DB_HOST")
	if err != nil {
		return nil, err
	}
	dbPort, err := mustEnv("DB_PORT")
	if err != nil {
		// fallback to POSTGRES_PORT for docker-compose compatibility, but still require one
		if dbPort = os.Getenv("POSTGRES_PORT"); dbPort == "" {
			return nil, fmt.Errorf("DB_PORT or POSTGRES_PORT is required")
		}
	}
	dbUser, err := mustEnv("DB_USER")
	if err != nil {
		if dbUser = os.Getenv("POSTGRES_USER"); dbUser == "" {
			return nil, fmt.Errorf("DB_USER or POSTGRES_USER is required")
		}
	}
	dbPassword, err := mustEnv("DB_PASSWORD")
	if err != nil {
		if dbPassword = os.Getenv("POSTGRES_PASSWORD"); dbPassword == "" {
			return nil, fmt.Errorf("DB_PASSWORD or POSTGRES_PASSWORD is required")
		}
	}
	dbName, err := mustEnv("DB_NAME")
	if err != nil {
		if dbName = os.Getenv("POSTGRES_DB"); dbName == "" {
			return nil, fmt.Errorf("DB_NAME or POSTGRES_DB is required")
		}
	}
	dbSSLMode, err := mustEnv("DB_SSLMODE")
	if err != nil {
		return nil, err
	}

	corsRaw, err := mustEnv("CORS_ORIGINS")
	if err != nil {
		return nil, err
	}

	cfg := &Config{
		Port:      port,
		JWTSecret: jwtSecret,
		Database: DatabaseConfig{
			Host:     dbHost,
			Port:     dbPort,
			User:     dbUser,
			Password: dbPassword,
			Name:     dbName,
			SSLMode:  dbSSLMode,
		},
	}

	for _, o := range strings.Split(corsRaw, ",") {
		if trimmed := strings.TrimSpace(o); trimmed != "" {
			cfg.CORSOrigins = append(cfg.CORSOrigins, trimmed)
		}
	}
	if len(cfg.CORSOrigins) == 0 {
		return nil, fmt.Errorf("CORS_ORIGINS must contain at least one origin")
	}

	return cfg, nil
}

func mustEnv(key string) (string, error) {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return "", fmt.Errorf("%s is required (no hardcoded fallback)", key)
	}
	return v, nil
}
