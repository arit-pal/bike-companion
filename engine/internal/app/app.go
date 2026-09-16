package app

import (
	"context"

	"github.com/arit-pal/bike-companion/engine/internal/config"
	"github.com/arit-pal/bike-companion/engine/pkg/database"
)

// App holds assembled dependencies.
type App struct {
	Config *config.Config
	Pool   *database.Pool
	Router interface{} // http.Handler — concrete type set in router.go
}

// New assembles the application without starting the server.
func New(ctx context.Context, cfg *config.Config) (*App, error) {
	pool, err := database.NewPool(ctx, cfg.Database)
	if err != nil {
		return nil, err
	}

	app := &App{
		Config: cfg,
		Pool:   pool,
	}

	// Router wiring is in router.go — keep app.go focused on deps.
	app.Router = NewRouter(app)

	return app, nil
}

// Close releases resources.
func (a *App) Close() {
	if a.Pool != nil {
		a.Pool.Close()
	}
}
