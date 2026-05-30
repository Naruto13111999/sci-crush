package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gyanankur/sci-crush/internal/api"
	"github.com/gyanankur/sci-crush/internal/config"
	"github.com/gyanankur/sci-crush/internal/content"
	"github.com/gyanankur/sci-crush/internal/db"
)

func main() {
	cfg := config.Load()
	store := content.NewStore(cfg.DataDir)

	if _, err := store.ListClasses(); err != nil {
		log.Fatalf("content: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	dbStore, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v (start postgres: docker compose up -d)", err)
	}
	defer dbStore.Close()

	if err := dbStore.Migrate(ctx); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	log.Println("database connected and migrated")

	srv := api.NewServer(cfg, store, dbStore)
	mux := srv.Routes()

	log.Printf("SciCrush running at http://localhost:%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatal(err)
	}
}
