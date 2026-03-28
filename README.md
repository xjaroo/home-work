# Home Work

Family homework/tasks and allowance app. Parents assign tasks, track progress, manage allowance; kids see tasks, update status, request spending, and message parents. Real-time updates via Socket.IO.

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

This starts both the backend (migrations + Express + Socket.IO on port 3000) and the frontend (Vite on port 5173) in one terminal. Open http://localhost:5173. For API calls (e.g. curl), use the backend URL: `http://localhost:3000`.

To run them separately: `pnpm run dev:server` and `pnpm run dev:client`.

**Running on your local network (WiFi):** The Vite dev server is bound to all interfaces (`host: true`), so you can open the app from other devices on the same network. Find your machine’s IP (e.g. `192.168.1.103`) and share **http://YOUR_IP:5173** (e.g. http://192.168.1.103:5173/login). In development, CORS and Socket.IO allow any origin, so the same URL works from phones/other laptops. API and WebSocket traffic is proxied through Vite, so only port 5173 needs to be reachable.

**iPhone / iPad – Add to Home Screen & full-screen:** Open the app in Safari, tap the Share button, then **Add to Home Screen**. When launched from the home screen, the app runs in standalone (full-screen) mode without the browser UI. Optional: add `client/public/icon-192.png` (192×192) and `client/public/icon-512.png` (512×512) for a custom home screen icon; otherwise iOS uses a screenshot.

## Production build

```bash
pnpm run build:client
pnpm run start
```

Set `NODE_ENV=production` and ensure `SESSION_SECRET` and `DATABASE_PATH` are set. The server serves the built client from `client/dist`.

## Scripts (from root)

| Script           | Description                          |
|-----------------|--------------------------------------|
| `pnpm run dev`        | Run both server and client           |
| `pnpm run dev:server` | Run migrations + Express + Socket.IO  |
| `pnpm run dev:client`  | Run Vite dev server                  |
| `pnpm run build:client`| Build React app to client/dist        |
| `pnpm run start`       | Run production server                |
| `pnpm run migrate`     | Run DB migrations only               |
| `pnpm run seed`        | Seed demo family + tasks + money     |

## Database

SQLite file path is set by `DATABASE_PATH` in `server/.env`. Back up this file for production. Migrations live in `server/src/db/migrations/` and run in order on `pnpm run migrate` or at server dev start.

## MVP acceptance

- Parent can create kids and assign tasks with due dates.
- Kid can mark tasks In Progress / Done; parent sees updates in real time.
- Parent can add allowance/penalty; kid can request spending; parent can approve; balance updates in real time.
- Parent and kid can message each other.
- UI is mobile-friendly (bottom nav for kids, responsive layout).
