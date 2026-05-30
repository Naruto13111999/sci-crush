# Database — beta registrations

## Table name

**`registrations`**

| Column       | Type         | Notes                          |
|--------------|--------------|--------------------------------|
| `id`         | SERIAL       | Primary key                    |
| `name`       | VARCHAR(255) | Full name                      |
| `class`      | VARCHAR(50)  | Always `8` during beta         |
| `email`      | VARCHAR(255) | **Unique** (lowercase stored)  |
| `phone`      | VARCHAR(50)  | Phone number                   |
| `created_at` | TIMESTAMPTZ  | First sign-up time             |
| `updated_at` | TIMESTAMPTZ  | Updated if same email re-registers |

If the same email registers again, name/phone are updated (upsert) — no duplicate rows.

---

## Local — view records with psql

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Connect and query:

```bash
psql postgres://scicrush:scicrush@localhost:5432/scicrush
```

```sql
SELECT id, name, class, email, phone, created_at, updated_at
FROM registrations
ORDER BY created_at DESC;
```

One-liner:

```bash
psql postgres://scicrush:scicrush@localhost:5432/scicrush \
  -c "SELECT * FROM registrations ORDER BY created_at DESC;"
```

---

## After hosting (GitHub + deployment)

**GitHub Pages (`static.yaml`) deploys the frontend only.** The Go API and PostgreSQL must run on a separate host (Railway, Render, Fly.io, etc.).

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step guide (Pages + backend + viewing records).

**GitHub stores your code only** — it does not run PostgreSQL. You deploy the Go app to a host and attach a managed Postgres database.

Typical flow:

1. Push repo to **GitHub**
2. Deploy app on **Railway** / **Render** / **Supabase** / **Neon**
3. Add a **PostgreSQL** add-on on that platform
4. Set env var on the app: `DATABASE_URL=postgres://user:pass@host:5432/dbname?sslmode=require`

### View records on hosted Postgres

**Option A — Platform dashboard**

- **Railway:** Project → PostgreSQL → **Data** tab or **Connect**
- **Render:** Database → **Connect** → External connection string
- **Supabase / Neon:** SQL Editor in the web UI

**Option B — psql from your laptop**

Copy `DATABASE_URL` from your host’s dashboard (often under “External URL” or “Connection string”):

```bash
psql "postgres://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

```sql
SELECT * FROM registrations ORDER BY created_at DESC;
```

**Option C — GUI**

Use [TablePlus](https://tableplus.com/), [DBeaver](https://dbeaver.io/), or pgAdmin with the same connection string.

### Security tips for production

- Never commit `DATABASE_URL` to GitHub — use platform **Secrets** / **Environment variables**
- Use `sslmode=require` for remote connections
- Restrict database to your app’s network where the host allows it

---

## Environment variable

```bash
DATABASE_URL=postgres://scicrush:scicrush@localhost:5432/scicrush?sslmode=disable
```

See `.env.example` for local defaults.
