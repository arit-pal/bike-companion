package database

import (
	"context"
	"fmt"
	"time"

	"github.com/arit-pal/bike-companion/engine/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool wraps pgxpool.Pool for app wiring.
type Pool struct {
	*pgxpool.Pool
}

// NewPool creates a real Postgres pool and verifies connectivity.
func NewPool(ctx context.Context, cfg config.DatabaseConfig) (*Pool, error) {
	dsn := cfg.DSN()

	poolCfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse dsn: %w", err)
	}
	poolCfg.MaxConns = 10
	poolCfg.MinConns = 1
	poolCfg.MaxConnLifetime = time.Hour
	poolCfg.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping db: %w", err)
	}

	return &Pool{Pool: pool}, nil
}
