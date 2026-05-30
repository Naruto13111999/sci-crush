# SciCrush

Interactive science learning for **NCERT Class 8**. All 18 chapters include comprehensive summaries, crushed notes, virtual lab simulations, comparison tables, and step-by-step flow diagrams.

## Quick start

```bash
cd sci-crush
cp .env.example .env   # optional — defaults work with docker compose
make dev                 # starts PostgreSQL + server
```

Open [http://localhost:8080](http://localhost:8080) — you'll be asked to register before accessing content.

### Access rules

| Account | Access |
|---------|--------|
| **ankurdey429@gmail.com** | All 18 chapters |
| Everyone else | **Cell Structure** & **Chemical Effects of Electric Current** only |

Registrations are saved to PostgreSQL table **`registrations`** (unique email). See [docs/DATABASE.md](docs/DATABASE.md) for schema and how to query records locally or after deployment.

### Database

```bash
make db-up              # start PostgreSQL (Docker)
psql postgres://scicrush:scicrush@localhost:5432/scicrush -c "SELECT * FROM registrations ORDER BY created_at DESC;"
```

## Project structure

```
sci-crush/
├── cmd/server/          # Go HTTP server entrypoint
├── internal/
│   ├── api/             # REST API + static file serving
│   ├── config/          # Environment config
│   └── content/         # JSON content loader
├── data/classes/
│   └── 8/chapters/      # All 18 Class 8 chapter JSON files
└── web/
    ├── templates/       # HTML shell
    └── static/          # CSS, JS, mirrored data
```

## Adding a chapter

```bash
make new-chapter CLASS=8 ID=my-chapter
# Edit data/classes/8/chapters/my-chapter.json
make dev
```

## Content format

Each chapter JSON includes:

| Field | Purpose |
|-------|---------|
| `summary` | One-line chapter tagline |
| `chapterSummary` | Comprehensive overview, key points, exam focus |
| `crushed` | 5–7 ultra-simple takeaways with emoji |
| `sections` | Grid or list visual breakdowns |
| `compare` | Side-by-side comparison tables |
| `demos` | Step-by-step canvas simulations (bio, chem, physics) |
| `flows` | Interactive step-by-step flow diagrams |
| `keyTerms` | Definitions with analogies |

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/access` | Access info for registered email (`X-User-Email` header) |
| `POST /api/register` | Register user (name, class, email, phone) → saved to PostgreSQL |
| `GET /api/classes` | List all classes |
| `GET /api/classes/{id}` | Class with chapter summaries |
| `GET /api/classes/{id}/chapters/{chapterId}` | Full chapter content |
| `GET /health` | Health check |

## Class 8 chapters (18)

**Biology:** Cell Structure, Microorganisms, Crop Production, Conservation, Reproduction, Adolescence

**Chemistry:** Combustion & Flame, Metals & Non-metals, Coal & Petroleum, Synthetic Fibres, Chemical Effects of Current, Pollution

**Physics:** Force & Pressure, Friction, Sound, Natural Phenomena, Light, Stars & Solar System

## Commands

```bash
make dev          # Run dev server (syncs data + hot reload via go run)
make build        # Build binary to bin/sci-crush
make run          # Build and run production binary
make test         # Run Go tests
make new-chapter  # Scaffold a new chapter JSON
```
