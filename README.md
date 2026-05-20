# Nexus

Nexus is a distribution / ERP-style application covering catalog, inventory,
sales, purchases, reports, notifications, refunds and exports.

The repository holds two projects:

| Folder | Project | Stack |
|---|---|---|
| [`api/`](api) | **Nexus API** — backend | NestJS 11 · TypeORM · Supabase (PostgreSQL) |
| [`nexus-client/`](nexus-client) | **Nexus Client** — frontend | Next.js 16 · React 19 · NextAuth · Zustand · Tailwind CSS 4 |

The backend was migrated from an earlier Flask prototype to NestJS.

## Architecture

```
┌─────────┐   /api/* (same origin)   ┌───────────────┐   /api/*    ┌──────────────┐
│ Browser │ ───────────────────────▶ │  nexus-client │ ──────────▶ │   api        │
│         │                          │  Next.js :3000│   (proxy)   │  NestJS :3030│
└─────────┘                          └───────────────┘             └──────┬───────┘
                                                                          │
                                                                   ┌──────▼───────┐
                                                                   │  Supabase    │
                                                                   │  PostgreSQL  │
                                                                   └──────────────┘
```

The browser never calls the API directly. Each request hits a Next.js Route
Handler in `nexus-client` that proxies to the NestJS API — keeping calls
same-origin (no CORS) and the backend URL server-side.

## Repository structure

```
nexus-app/
├── api/             # NestJS backend  — see api/README.md
├── nexus-client/    # Next.js frontend — see nexus-client/README.md
├── docs/            # Project docs (adr.md, journal.md, tasks.md)
└── README.md        # This file
```

## Prerequisites

- Node.js 20+
- npm
- Access to the Supabase PostgreSQL database (schema and seed data already
  exist there)

## Getting started

Run the backend and the frontend in two terminals.

### 1. Backend — `api`

```bash
cd api
npm install
# create api/.env.local with the DB credentials + JWT_SECRET
# (see api/README.md). Set PORT=3030 so it doesn't clash with the client.
npm run start:dev
```

The API serves every route under `/api` — e.g. `http://localhost:3030/api/health`.

### 2. Frontend — `nexus-client`

```bash
cd nexus-client
npm install
# create nexus-client/.env.local with NEXTAUTH_SECRET and
# API_URL=http://localhost:3030 (see nexus-client/README.md)
npm run dev
```

Open `http://localhost:3000`, then sign in at `/login` with a user from the
database.

> **Ports** — both the API and `next dev` default to port `3000`. Run the API
> on another port (`PORT=3030`) and point the client's `API_URL` at it.

Each project has its own README with full detail on configuration, structure
and environment variables:

- [`api/README.md`](api/README.md)
- [`nexus-client/README.md`](nexus-client/README.md)

## Backend — `api`

NestJS + TypeORM over Supabase Postgres. Feature modules for catalog, inventory,
sales, purchases, reports, notifications, refunds, exports, finance, users and
health — each with a controller, service and entities.

```
api/src/
├── app.module.ts        # Root module — wires modules + TypeORM
├── main.ts              # Bootstrap (global /api prefix)
├── data-source.ts       # TypeORM CLI DataSource (migrations)
├── auth/  catalog/  inventory/  sales/  purchases/
├── reports/  notifications/  refunds/  exports/
├── finance/  email/  users/  health/
└── migrations/
```

| Command | What it does |
|---|---|
| `npm run start:dev` | Start in watch mode |
| `npm run start:prod` | Run the compiled build |
| `npm run build` | Compile to `dist/` |
| `npm test` | Run the Jest unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint and auto-fix |
| `npm run migration:run` | Apply pending TypeORM migrations |

## Frontend — `nexus-client`

Next.js App Router app. Pages live under `app/dashboard/*`; API access goes
through Route Handlers under `app/api/*` that proxy to the backend.

```
nexus-client/
├── app/
│   ├── layout.tsx       # Root layout (AuthProvider)
│   ├── login/           # Login page
│   ├── api/             # Route Handlers — proxy to the Nexus API
│   └── dashboard/       # Catalog, inventory, cart, sales, purchases,
│                        # reports, notifications, refunds, exports
├── components/          # Header, Table, ConfirmModal, AdminMiddleware
├── providers/           # AuthProvider, UserStoreSync
├── data/  lib/  types/  # Zustand store, helpers, NextAuth types
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint with ESLint |

## Documentation

Project notes live in [`docs/`](docs): architecture decisions (`adr.md`),
a running `journal.md`, and `tasks.md`.
