
# Evidence Collector

A small demo observability / evidence-collection system for learning, testing and developer demos. It's intentionally lightweight and not production hardened.

## Overview

This repository provides an end-to-end demo that:

- runs a `dummy-server` that logs incoming HTTP requests,
- optionally generates traffic against that server with `traffic-gen`,
- stores logs in MongoDB and exposes them via a TypeScript backend API,
- visualizes events and metrics in a React + Vite frontend.

Main components

- `dummy-server/` — Express app (default port 4000) that receives and logs requests. It now records a redacted `headers` object and a `hasMedia` boolean for POST/PUT requests.
- `traffic-gen/` — a simple Node.js script that can flood the dummy server with randomized requests for testing.
- `backend/` — TypeScript Express API (default port 3000) that reads log documents from MongoDB and exposes endpoints for events, metrics, top IPs, and streaming export.
- `frontend/` — React + Vite dashboard (default port 5173) that shows metrics and a paginated events table.

Quick summary

- Purpose: runnable demo of capturing HTTP requests and exploring them in a dashboard.
- Not production-ready: lacks authentication, hardened input handling, rate-limiting, and secret management.

## What's new / Important notes

- The dummy server now persists a redacted `headers` object and a `hasMedia` boolean for POST/PUT requests so the UI can show request headers and whether the request included media.
- Backend model updated to include `headers` and `hasMedia` fields and the `/api/evidence/events` endpoint returns `params`, `headers`, `body`, `has_media`, and `body_hash` per event.
- Streaming export endpoint added: `GET /api/evidence/events/export?format=csv|json&limit=N`.
  - Streams CSV or JSON and supports filters: `path`, `ip`, `method`, `from`, `to`.
  - `limit` is capped by `EXPORT_MAX_ROWS` (env var) to protect the server.
- Frontend: events table rows are clickable and open a details modal showing Params, Headers, Body (pretty-printed), Has Media and Body Hash. The export UI supports CSV/JSON and a limit input.

## Quick start (local)

Prerequisites

- Node.js (16+ recommended)
- MongoDB running locally or remotely (default URI: `mongodb://localhost:27017`)

Run services (open separate shells)

Backend (API)
```powershell
cd evidence-collector\backend
npm install
npm run dev
```
Health: http://localhost:3000/health

Dummy server (receives & logs requests)
```powershell
cd evidence-collector\dummy-server
npm install
npm start
```
Health: http://localhost:4000/health

Frontend (dashboard)
```powershell
cd evidence-collector\frontend
npm install
npm run dev
```
Open: http://localhost:5173

Traffic generator (optional)
```powershell
cd evidence-collector\traffic-gen
npm install
npm start
```
Tip: set `SERVER_URL=http://localhost:4000` when running locally.

Environment variables of interest

- Backend:
  - `PORT` — port for the API (default: 3000)
  - `MONGODB_URI` — MongoDB connection string
  - `EXPORT_MAX_ROWS` — maximum rows allowed by the export endpoint (default 10000)

- Frontend (Vite):
  - `VITE_API_URL` — optional base URL for the backend API (if unset, the frontend relies on the dev server proxy and uses `/api` paths)

## API (selected endpoints)

- GET `/api/evidence/events` — list events with query filters `path`, `ip`, `method`, `from`, `to`, `limit`, `offset`.
  - Response events include `params` (query), `headers` (redacted headers object), `body`, `has_media` and `body_hash`.
- GET `/api/evidence/events/export` — streaming export. Query `format=csv|json`, `limit` and same filters as above.
- GET `/api/evidence/metrics/summary` — aggregated metrics by time window.
- GET `/api/evidence/ips/top` — top source IPs.

## Running tests (backend)

```powershell
cd evidence-collector\backend
npm install
npm test
```

Notes: the tests use `mongodb-memory-server` which downloads a MongoDB binary during install. On Windows behind strict proxies you may need to configure a mirror or allow the binary download (see `mongodb-memory-server` docs).

## Troubleshooting

- Frontend showing 404s for `/api/...` routes? Ensure the frontend `VITE_API_URL` is unset to use the dev-server proxy or set it to the full backend URL (for example `http://localhost:3000`). Also check the backend is running on the expected port.
- Tests failing due to missing jest types or ts-jest errors? Run `npm install` in the `backend/` folder to install dev dependencies.

## Next / optional improvements

- Include headers/has_media in the streaming export output (CSV/JSON) — currently CSV exports core fields; JSON export includes query and body hash. I can extend CSV/JSON to include headers and has_media if you want.
- Add a `docker-compose.yml` to launch MongoDB + backend + frontend for a one-command demo.
- Add a small integration test to assert the `/api/evidence/events` endpoint returns `headers` and `has_media` for seeded documents.
- Remove committed `node_modules/` and add `.gitignore` entries (I can prepare a cleanup patch).

## Contributing

- Fork, create a branch, add tests and open a PR. If you'd like me to make additional doc edits (docker-compose, CONTRIBUTING.md or export changes), say which and I'll implement them.

---

If you'd like a shorter quickstart or a Docker compose file next, tell me which and I will add it.
