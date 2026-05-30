.PHONY: sync-data build run dev stop tidy test new-chapter db-up db-down static-export

stop:
	@lsof -ti :8080 | xargs kill 2>/dev/null || true

db-up:
	docker compose up -d postgres

db-down:
	docker compose down

sync-data:
	rm -rf web/static/data/classes
	mkdir -p web/static/data/classes
	cp -R data/classes/. web/static/data/classes/
	rm -rf web/static/data/classes/_template

new-chapter:
	@if [ -z "$(CLASS)" ] || [ -z "$(ID)" ]; then echo "Usage: make new-chapter CLASS=8 ID=my-chapter"; exit 1; fi
	@if [ -f "data/classes/$(CLASS)/chapters/$(ID).json" ]; then echo "Chapter already exists"; exit 1; fi
	cp data/classes/_template/chapters/chapter.json data/classes/$(CLASS)/chapters/$(ID).json
	sed -i '' 's/my-chapter/$(ID)/g' data/classes/$(CLASS)/chapters/$(ID).json
	@echo "Created data/classes/$(CLASS)/chapters/$(ID).json — edit and run make dev"

build:
	go build -o bin/sci-crush ./cmd/server

run: sync-data build
	./bin/sci-crush

dev: sync-data stop db-up
	@echo "Waiting for PostgreSQL..."
	@sleep 2
	go run ./cmd/server

tidy:
	go mod tidy

test:
	go test ./...

static-export: sync-data
	go run ./cmd/staticexport
