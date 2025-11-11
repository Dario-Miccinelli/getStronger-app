Get Stronger
============

A lightweight full‑stack app to track strength training personal records (PRs), plan workouts, and run rest timers. The frontend is a Vue 3 + Vite PWA; the backend is an Express API with PostgreSQL (prod).

Features
- Track PRs per exercise and player (sample players included)
- Create custom exercises on the fly
- Charts of progress per exercise
- Simple program templates with set tracking and rest timers
- Works offline as a PWA (installable, cached assets and data)

Tech Stack
- Client: Vue 3, Vite, Pinia, vue‑router, Chart.js, vite‑plugin‑pwa
- Server: Node.js, Express 5, PostgreSQL via `pg`  

Quick Start (Local Dev)
1) Prereqs: Node.js 18+ and npm
2) Install deps (root, server, client):
   - `npm install`
   - `npm install --prefix server`
   - `npm install --prefix client`
3) Run both API and client in dev mode:
   - `npm run dev`
   - Client on `http://localhost:5173`, API on `http://localhost:3001`

Notes
- No database required for local dev: the API falls back to a LokiJS JSON DB at `server/data/getstronger.db.json`.
- The Vite dev server proxies `/api` to `http://localhost:3001` (see `client/vite.config.js`).

Scripts
- Root:
  - `npm run dev` — run server (`nodemon`) and client (`vite`) together
  - `npm run build` — build client (`client/dist`)
  - `npm start` — serve API + static client with `NODE_ENV=production`
- Client:
  - `npm run dev` — Vite dev server (with `/api` proxy)
  - `npm run build` — production build
  - `npm run preview` — preview built client
- Server:
  - `npm run dev` — nodemon on `server/index.js`
  - `npm start` — start API


API Overview (mounted under `/api`)
- Health: `GET /health`
- Exercises
  - `GET /exercises` — list all exercises
  - `POST /exercises` — create exercise `{ label: string }`
- Personal Records (PRs)
  - `GET /prs/:playerId/:exerciseKey` — list PRs for player/exercise
  - `POST /prs` — add PR `{ playerId, exerciseKey, weight, reps, rpe, dateISO? }`
  - `GET /prs?playerId=&exerciseKey=&limit=&offset=` — list PRs (admin view)
  - `DELETE /prs/:id` — delete PR by id
  - `GET /prs/latest/:playerId` — latest PR per exercise for a player

Client Usage
- On first load, select a player profile.
- From the home view, pick or create an exercise.
- Add new PR entries on the exercise view; charts update automatically.
- Optionally pick a program template; track sets and use built‑in rest timers.

PWA
- Service worker is enabled for production builds (disabled during dev).
- Install to your device from the browser for an app‑like experience.

