package app

import (
	"net/http"

	"github.com/arit-pal/bike-companion/engine/internal/handler"
	"github.com/arit-pal/bike-companion/engine/internal/middleware"
	"github.com/arit-pal/bike-companion/engine/internal/repository"
	"github.com/arit-pal/bike-companion/engine/internal/service"
)

// NewRouter wires repositories → services → handlers → HTTP routes.
func NewRouter(app *App) http.Handler {
	mux := http.NewServeMux()

	// Repositories
	userRepo := repository.NewPostgresUserRepository(app.Pool)
	bikeRepo := repository.NewPostgresBikeRepository(app.Pool)
	intervalRepo := repository.NewPostgresIntervalRepository()
	recordRepo := repository.NewPostgresRecordRepository()

	// Services
	authSvc := service.NewAuthService(app.Config, app.Pool, userRepo, bikeRepo)
	bikeSvc := service.NewBikeService(bikeRepo)
	intervalSvc := service.NewIntervalService(intervalRepo, bikeRepo)
	recordSvc := service.NewRecordService(recordRepo, intervalRepo)

	// Handlers
	authH := handler.NewAuthHandler(authSvc)
	bikeH := handler.NewBikeHandler(bikeSvc)
	intervalH := handler.NewIntervalHandler(intervalSvc)
	recordH := handler.NewRecordHandler(recordSvc)

	// Public routes
	mux.HandleFunc("GET /api/health", handler.Health)
	mux.HandleFunc("POST /api/auth/register", authH.Register)
	mux.HandleFunc("POST /api/auth/login", authH.Login)

	// Protected — require JWT
	auth := middleware.Auth(app.Config)
	mux.Handle("GET /api/auth/me", auth(http.HandlerFunc(authH.Me)))

	// Bikes — protected
	mux.Handle("POST /api/bikes", auth(http.HandlerFunc(bikeH.Create)))
	mux.Handle("GET /api/bikes", auth(http.HandlerFunc(bikeH.List)))
	mux.Handle("PATCH /api/bikes/{id}/mileage", auth(http.HandlerFunc(bikeH.UpdateMileage)))

	// Intervals — protected (stubs for now, return 501)
	mux.Handle("POST /api/bikes/{bikeId}/intervals", auth(http.HandlerFunc(intervalH.Create)))
	mux.Handle("GET /api/bikes/{bikeId}/intervals", auth(http.HandlerFunc(intervalH.List)))
	mux.Handle("GET /api/bikes/{bikeId}/dashboard", auth(http.HandlerFunc(intervalH.Dashboard)))

	// Records — protected
	mux.Handle("POST /api/bikes/{bikeId}/records", auth(http.HandlerFunc(recordH.Log)))
	mux.Handle("GET /api/bikes/{bikeId}/records", auth(http.HandlerFunc(recordH.List)))

	// Global middleware order: recovery → logging → CORS
	var h http.Handler = mux
	h = middleware.Recovery(h)
	h = middleware.Logging(h)
	h = middleware.CORS(h)

	return h
}
