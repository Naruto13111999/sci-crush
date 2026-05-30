package config

import "os"

type Config struct {
	Port        string
	DataDir     string
	DatabaseURL string
	DevMode     bool
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = "data"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://scicrush:scicrush@localhost:5432/scicrush?sslmode=disable"
	}

	return Config{
		Port:        port,
		DataDir:     dataDir,
		DatabaseURL: dbURL,
		DevMode:     os.Getenv("DEV_MODE") == "1" || os.Getenv("DEV_MODE") == "true",
	}
}
