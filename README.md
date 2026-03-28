# Home Work

Family homework/tasks and allowance app. Parents assign tasks, track progress, manage allowance; kids see tasks, update status, request spending, and message parents. Real-time updates via Socket.IO.

## Architecture (single server, single port)

There is **one Node.js process** and **one HTTP port** (`PORT` in `server/.env`, e.g. `3001`):

| Mode | What runs |
|------|-----------|
| **`pnpm run dev`** | Express (REST API + Socket.IO) + **Vite dev middleware** — React is compiled in-process; same origin, no separate frontend port. |
| **`pnpm run start` / PM2** | Express serves the **built** React app from `client/dist` plus the same API and Socket.IO on `PORT`. |

The browser talks to **`http://host:PORT`** only. `fetch('/auth/...')` and `io(window.location.origin)` use **relative / same-origin** URLs — no `VITE_API_BASE` or second server required for normal use.

Optional **`pnpm run dev:client`** is only for debugging Vite in isolation (separate port 5173); the supported workflow is integrated dev above.

Behind **HTTPS**, set **`SESSION_COOKIE_SECURE=true`** in `server/.env` so session cookies and Socket.IO work with secure cookies.

## Stack

- **Backend:** Node.js, Express, SQLite (better-sqlite3), Socket.IO, bcrypt, express-session, zod, helmet, express-rate-limit
- **Frontend:** React (Vite), Tailwind CSS, react-router-dom, socket.io-client
- **Package manager:** pnpm

## Setup

1. Clone and install:

   ```bash
   pnpm install
   ```
   The app uses `sql.js` (SQLite in WebAssembly) and Node’s built-in `crypto` (scrypt) for passwords, so no native build is required.

2. Copy env and set secrets:

   ```bash
   cp server/.env.example server/.env
   # Edit server/.env: set DATABASE_PATH, SESSION_SECRET, and optionally PORT, FRONTEND_ORIGIN
   ```

3. Run migrations:

   ```bash
   pnpm run migrate
   ```

4. (Optional) Seed dev data:

   ```bash
   pnpm run seed
   ```
   After seed: parent `parent@demo.local` / `parent123`; kids `alex@demo.local`, `sam@demo.local`, `jordan@demo.local` / `kid123`.

## Development

From the repo root, run:

```bash
pnpm run dev
```

This runs **one process**: Express (API + Socket.IO) and **Vite in middleware mode** (hot reload) on the same **`PORT`** from `server/.env` (default 3000). Open **`http://localhost:PORT`** (e.g. http://localhost:3001). Only that port needs to be open on your firewall or router for public access.

Optional: `pnpm run dev:client` starts **Vite alone** on port 5173 with API requests proxied to `http://127.0.0.1:3000` — use only if you are debugging the UI without the integrated dev server.

**Running on your local network (WiFi):** The dev server binds to `0.0.0.0:PORT` by default (`LISTEN_HOST` in `server/.env` to change). Share **http://YOUR_IP:PORT** (e.g. http://192.168.1.103:3001/login). CORS and Socket.IO allow any origin in development.

**iPhone / iPad – Add to Home Screen & full-screen:** Open the app in Safari, tap the Share button, then **Add to Home Screen**. When launched from the home screen, the app runs in standalone (full-screen) mode without the browser UI. Optional: add `client/public/icon-192.png` (192×192) and `client/public/icon-512.png` (512×512) for a custom home screen icon; otherwise iOS uses a screenshot.

## Production build

```bash
pnpm run build:client
pnpm run start
```

Set `NODE_ENV=production` and ensure `SESSION_SECRET` and `DATABASE_PATH` are set. The server serves the built client from `client/dist` on the same `PORT` as the API (one URL for the whole app).

### PM2 (single public port, e.g. 3001)

Requires global `pm2` (`npm i -g pm2`). In `server/.env` set `PORT=3001` (and secrets). `ecosystem.config.cjs` forces `NODE_ENV=production` and loads `server/.env`.

```bash
pnpm run pm2:start
```

This migrates, builds the client, then starts or reloads the `home-work` process. Open **`http://YOUR_HOST:PORT`** (e.g. `http://localhost:3001`) — API, static UI, and Socket.IO all use that port. Optional: `FRONTEND_ORIGIN` in `server/.env` for a strict CORS allowlist; if unset, the server reflects the browser origin (typical for one host + one port).

## Scripts (from root)

| Script           | Description                          |
|-----------------|--------------------------------------|
| `pnpm run dev`        | Migrations + Express + Vite (one `PORT`) |
| `pnpm run dev:server` | Same as `dev` (server package script) |
| `pnpm run dev:client`  | Vite only on 5173 (optional; proxies API to :3000) |
| `pnpm run build:client`| Build React app to client/dist        |
| `pnpm run start`       | Run production server                |
| `pnpm run migrate`     | Run DB migrations only               |
| `pnpm run seed`        | Seed demo family + tasks + money     |
| `pnpm run pm2:start`   | Migrate + build + PM2 start/reload (global `pm2`) |

## Database

SQLite file path is set by `DATABASE_PATH` in `server/.env`. Back up this file for production. Migrations live in `server/src/db/migrations/` and run in order on `pnpm run migrate` or at server dev start.

## MVP acceptance

- Parent can create kids and assign tasks with due dates.
- Kid can mark tasks In Progress / Done; parent sees updates in real time.
- Parent can add allowance/penalty; kid can request spending; parent can approve; balance updates in real time.
- Parent and kid can message each other.
- UI is mobile-friendly (bottom nav for kids, responsive layout).
