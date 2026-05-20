# Nexus Client

Web frontend for the Nexus app — a distribution/ERP-style dashboard covering
catalog, inventory, sales, cart, purchases, reports, notifications, refunds and
exports.

It is a [Next.js](https://nextjs.org/) (App Router) application that talks to
the Nexus NestJS API. Browser requests never hit the API directly: each call
goes to a Next.js **Route Handler** under `/api/*` that proxies to the backend,
keeping it same-origin (no CORS) and the backend URL server-side.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **NextAuth v4** — credentials auth against the Nexus API
- **Zustand** — client-side user store
- **Tailwind CSS v4**
- **TypeScript**

## Project structure

```
nexus-client/
├── app/
│   ├── layout.tsx           # Root layout — wraps the app in AuthProvider
│   ├── page.tsx             # Home
│   ├── globals.css          # Tailwind v4 entry + theme tokens
│   ├── login/               # Login page (NextAuth credentials sign-in)
│   ├── api/                 # Route Handlers — proxy to the Nexus API
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── products/  inventory/  sales/  purchases/  suppliers/
│   │   ├── reports/  notifications/  refunds/  exports/
│   └── dashboard/
│       ├── layout.tsx       # Dashboard shell (Header + main)
│       ├── page.tsx         # Dashboard home
│       └── catalog/ inventory/ cart/ sales/ purchases/
│           reports/ notifications/ refunds/ exports/
├── components/              # Header, Table, ConfirmModal, AdminMiddleware
├── providers/               # AuthProvider, UserStoreSync
├── data/                    # Zustand stores (user)
├── lib/                     # auth config, format-date, use-modal helpers
└── types/                   # NextAuth module augmentation
```

## Requirements

- Node.js 20+
- npm
- A running instance of the Nexus API (see `../api`)

## Configuration

The app reads environment variables from `nexus-client/.env.local`. **This file
is git-ignored and must not be committed** — it holds the auth secret.

Create `nexus-client/.env.local` with the following keys (values shown are
placeholders):

```dotenv
# Public URL of this Next.js app — used by NextAuth for callbacks.
NEXTAUTH_URL=http://localhost:3000

# Secret used to sign/encrypt the session JWT.
# Generate one with: openssl rand -base64 32
NEXTAUTH_SECRET=<session-signing-secret>

# Base URL of the Nexus NestJS API (server-side only).
API_URL=http://localhost:3030
```

Notes:

- `API_URL` is read **server-side** by the route handlers, so the backend
  address is never exposed to the browser.
- The Nexus API defaults to port `3000`, the same as `next dev`. Run the API on
  a different port (e.g. `3030`) and point `API_URL` at it — or move the client
  with `next dev -p <port>` and update `NEXTAUTH_URL` to match.
- Ask a maintainer for the real `NEXTAUTH_SECRET` — never commit it.

## Running

```bash
cd nexus-client
npm install
npm run dev      # starts on http://localhost:3000
```

Then open `http://localhost:3000` and sign in at `/login`. The API must be
running and reachable at `API_URL`.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint with ESLint |

## How it works

- **Auth** — the login form calls NextAuth's credentials provider, which posts
  to the API's `POST /api/auth/login`. The returned identity (`user_id`,
  `username`, `is_admin`) is stored in a JWT session.
- **Session ↔ store** — `UserStoreSync` (inside `AuthProvider`) hydrates the
  Zustand user store from the session on load and clears it on sign-out.
- **API access** — pages call same-origin routes like `/api/products`; the
  matching Route Handler forwards the request to `API_URL`. Privileged routes
  (deletes, approvals, exports) verify the session server-side before
  forwarding.
- **Admin UI** — admin-only sections are gated with the `AdminMiddleware`
  component.
