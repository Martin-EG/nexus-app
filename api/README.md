# Nexus API

Backend for the Nexus app — a distribution/ERP-style service covering catalog,
inventory, sales, purchases, reports, notifications, refunds and exports.

It is a [NestJS](https://nestjs.com/) + [TypeORM](https://typeorm.io/)
application backed by a Supabase (PostgreSQL) database. It was migrated from an
earlier Flask prototype; every route now lives under the `/api` prefix.

## Tech stack

- **NestJS 11** — modules, controllers, services, dependency injection
- **TypeORM** — entities and repositories over PostgreSQL
- **Supabase Postgres** — connection pooler for the app, direct connection for migrations
- **Passport / JWT** — auth strategy
- **Jest** — unit tests (one `*.spec.ts` per service)

## Project structure

```
api/
├── src/
│   ├── app.module.ts        # Root module — wires every feature module + TypeORM
│   ├── main.ts              # Bootstrap; sets the global `/api` prefix
│   ├── data-source.ts       # Standalone TypeORM DataSource for the CLI (migrations)
│   ├── auth/                # Login + JWT strategy + admin guard
│   ├── catalog/             # Products
│   ├── inventory/           # Stock levels and warehouse views
│   ├── sales/               # Sales and returns
│   ├── purchases/           # Purchases, reconciliation, suppliers
│   ├── reports/             # Monthly / total / export reports
│   ├── notifications/       # Per-user notifications + broadcast
│   ├── refunds/             # Refund creation and approval
│   ├── exports/             # Pivot, CSV and aggregate exports
│   ├── finance/             # Shared pricing logic (IVA, discounts, currency)
│   ├── email/               # Email service (stub)
│   ├── users/               # User listing (admin)
│   ├── health/              # Health check
│   └── migrations/          # TypeORM migration files
└── test/                    # End-to-end tests
```

Each feature folder follows the same layout: an `entities/` folder, a
`*.service.ts` (business logic), a `*.controller.ts` (HTTP routes), a
`*.module.ts` (wiring) and a `*.service.spec.ts` (unit tests).

## Requirements

- Node.js 20+
- npm
- Access to the Supabase PostgreSQL database (the tables are already created
  and seeded)

## Configuration

The app reads environment variables from `api/.env.local`. **This file is
git-ignored and must not be committed** — it contains database credentials.

Create `api/.env.local` with the following keys (values shown are placeholders):

```dotenv
# Supabase project
SUPABASE_APP_NAME="nexus-app"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"

# Pooled connection — used by the running app
DATABASE_URL="postgresql://<user>:<password>@<pooler-host>:6543/postgres?pgbouncer=true"

# Direct connection — used for migrations
DIRECT_URL="postgresql://<user>:<password>@<pooler-host>:5432/postgres"

# Auth
JWT_SECRET="<jwt-signing-secret>"

# Discrete DB settings consumed by the app's TypeORM config
DB_HOST="<pooler-host>"
DB_PORT="6543"
DB_USER="<user>"
DB_PASSWORD="<password>"
DB_NAME="postgres"

# Optional — HTTP port (defaults to 3000)
# PORT="3000"
```

Notes:

- The running app connects through the **pooled** connection (`DB_*`, port
  `6543`) with SSL.
- The TypeORM CLI (migrations) uses **`DIRECT_URL`** (port `5432`), the
  non-pooled connection Supabase recommends for DDL.
- Ask a maintainer for the real values — never paste credentials into the repo,
  issues, or chat.

## Running

```bash
cd api
npm install        # install dependencies
npm run start:dev  # start in watch mode on http://localhost:3000
```

All endpoints are served under `/api` — e.g. `GET http://localhost:3000/api/health`.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Start the server in watch mode (reloads on change) |
| `npm run start` | Start the server once |
| `npm run start:prod` | Run the compiled build from `dist/` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run the Jest unit test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with a coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint and auto-fix with ESLint |
| `npm run format` | Format sources with Prettier |
| `npm run migration:run` | Apply pending TypeORM migrations |
| `npm run migration:revert` | Roll back the last migration |
| `npm run migration:generate` | Generate a migration from entity changes |

## Database & migrations

The Supabase database already contains the schema and seed data, so a fresh
checkout does **not** need to run migrations to get started.

Migrations live in `src/migrations/` and run against `DIRECT_URL`. Only run
`npm run migration:run` when you have new, unapplied migrations — applying a
migration that recreates existing tables will fail.

## Testing

Every service has a co-located `*.spec.ts` file. Tests mock their dependencies
(repositories, other services), so **no database connection is required** to
run them:

```bash
npm test
```
