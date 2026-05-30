# Deploying SciCrush

SciCrush has **two parts**:

| Part | What it is | Where it runs |
|------|------------|---------------|
| **Frontend** | HTML, CSS, JS (this repo’s `web/` + chapter JSON) | **GitHub Pages** via `.github/workflows/static.yaml` |
| **Backend + DB** | Go API + PostgreSQL (`registrations` table) | **Railway**, **Render**, **Fly.io**, etc. |

GitHub Pages hosts **static files only** — it cannot run Go or PostgreSQL. Registration, login, and chapter access checks need the backend deployed separately.

---

## Step 1 — Deploy the backend (Go + Postgres)

### 1a. Create PostgreSQL

On your host (example: **Railway**):

1. New project → **Add PostgreSQL**
2. Copy the **connection URL** (starts with `postgres://…`)
3. Ensure it uses `?sslmode=require` for production

### 1b. Deploy the Go server

1. Connect the same GitHub repo (or deploy from CLI)
2. **Root directory:** `sci-crush` (if monorepo) or repo root
3. **Start command:** `go run ./cmd/server` or build `go build -o server ./cmd/server && ./server`
4. **Environment variables:**

   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | `postgres://user:pass@host:5432/railway?sslmode=require` |
   | `PORT` | `8080` (or what the platform sets) |
   | `DATA_DIR` | `data` |

5. Note the public URL, e.g. `https://sci-crush-production.up.railway.app`

The API base for the frontend is: **`https://YOUR-BACKEND-URL/api`**

---

## Step 2 — Deploy the frontend (GitHub Pages)

### 2a. Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source:** GitHub Actions

### 2b. Set the API secret

1. Repo → **Settings** → **Secrets and variables** → **Actions**
2. New repository secret:
   - **Name:** `SCI_CRUSH_API_URL`
   - **Value:** `https://YOUR-BACKEND-URL/api` (no trailing slash after `/api`)

### 2c. Push to `main`

The workflow `.github/workflows/static.yaml` runs on push to `main`:

- Builds static site with `go run ./cmd/staticexport`
- Uploads `public/` to GitHub Pages

If `sci-crush` is the **repo root** (not a subfolder), edit `static.yaml` and set `SITE_DIR: .`

---

## Step 3 — View registration records in the database

### Option A — Platform dashboard (easiest)

| Platform | Where to run SQL |
|----------|------------------|
| **Railway** | Project → PostgreSQL → **Data** / **Query** |
| **Render** | Database → **Connect** → use external URL in psql or dashboard |
| **Supabase / Neon** | **SQL Editor** in the web UI |

```sql
SELECT id, name, class, email, phone, created_at, updated_at
FROM registrations
ORDER BY created_at DESC;
```

### Option B — psql from your laptop

1. Copy `DATABASE_URL` from your host dashboard (external / public connection string)
2. Run:

```bash
psql "postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

```sql
SELECT * FROM registrations ORDER BY created_at DESC;
```

### Option C — GUI

Connect [TablePlus](https://tableplus.com/), [DBeaver](https://dbeaver.io/), or pgAdmin using the same `DATABASE_URL`.

---

## Local development

```bash
docker compose up -d postgres   # or: make db-up
make dev                        # http://localhost:8080
```

Local DB:

```bash
psql postgres://scicrush:scicrush@localhost:5432/scicrush \
  -c "SELECT * FROM registrations ORDER BY created_at DESC;"
```

See also [DATABASE.md](./DATABASE.md).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Cannot reach the server” on Pages | Set `SCI_CRUSH_API_URL` secret and redeploy workflow |
| Login/register fails on Pages | Backend must be running; check CORS (API allows `*`) |
| Chapters empty | Backend needs `DATA_DIR=data` and chapter JSON in the deployed image |
| No rows in DB | Postgres must be attached to the **same** app that receives `/api/register` |
