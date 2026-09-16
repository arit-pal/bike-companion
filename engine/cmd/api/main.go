package main

import (
	"context"
	"log"
	"net/http"

	"github.com/arit-pal/bike-companion/engine/internal/app"
	"github.com/arit-pal/bike-companion/engine/internal/config"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load() // load .env if present, ignore error
	_ = godotenv.Load("../.env")

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	application, err := app.New(ctx, cfg)
	if err != nil {
		log.Fatalf("app init: %v", err)
	}
	defer application.Close()

	addr := ":" + cfg.Port
	handler, ok := application.Router.(http.Handler)
	if !ok {
		log.Fatal("router is not an http.Handler")
	}

	log.Printf("engine listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
