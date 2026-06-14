---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-2026-06-14/prd.md
workflowType: 'architecture'
project_name: 'Simple Node.js API Backend'
user_name: 'ElimelechAharon'
date: '2026-06-14'
status: 'complete'
---

# Architecture Decision Document
## Simple Node.js API Backend

---

## 1. System Overview

A minimal Node.js HTTP server exposing two routes (`GET /` and `GET /test`). No framework, no database, no auth — just Node's built-in `http` module and a single entry-point file.

---

## 2. Technology Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Runtime | Node.js (LTS) | PRD mandates Node.js; single-language stack |
| HTTP layer | `node:http` (built-in) | No framework needed for two static routes |
| Package manager | npm | Standard; `npm install` / `npm start` per PRD UJ-1 |
| Language | JavaScript (CommonJS) | Minimal setup; no transpilation required |
| Testing | None (out of scope) | PRD is a BMAD workflow test artifact only |

---

## 3. Project Structure

```
project-root/
├── package.json        # name, version, scripts.start → "node server.js"
└── server.js           # HTTP server — all route logic lives here
```

---

## 4. Route Specifications

### GET /
- **Response:** `200 OK`
- **Content-Type:** `text/plain`
- **Body:** `Hello World`

### GET /test
- **Response:** `200 OK`
- **Content-Type:** `application/json`
- **Body:** `{ "status": "ok", "message": "Test payload", "timestamp": "<ISO 8601 string>" }` [Updated post-Epic-1: capitalized "Test payload" to match PRD FR-2; added timestamp field per FR-2]

All other paths → `404 Not Found`.

---

## 5. Configuration

| Parameter | Value | Source |
|---|---|---|
| Port | `3000` | Hard-coded default; override via `PORT` env var |
| Host | `0.0.0.0` | Listens on all interfaces |

Server logs `Listening on http://localhost:3000` to stdout on startup.

---

## 6. Key Implementation Constraints

- **Single file:** All logic in `server.js` — no src/ folder, no modules.
- **No dependencies:** `package.json` has an empty `dependencies` block; only `devDependencies` if a linter is added later.
- **Stateless:** No in-memory state, no persistence, no sessions.
- **Graceful shutdown:** Handle `SIGTERM` / `SIGINT` to close the server before exiting (prevents port-already-in-use on restart).

---

## 7. Non-Functional Requirements

| Attribute | Target |
|---|---|
| Startup time | < 1 second |
| Memory footprint | < 30 MB RSS at idle |
| Concurrent requests | Sufficient for manual curl/browser testing |

---

## 8. Out of Scope

- Authentication / authorization
- Middleware framework (Express, Fastify, etc.)
- Database or external services
- Containerization (Docker)
- CI/CD pipeline
- Unit or integration tests

---

## 9. Developer Quickstart

```bash
npm install   # installs nothing — but validates package.json is well-formed
npm start     # node server.js → logs port, accepts connections
curl localhost:3000        # → Hello World
curl localhost:3000/test   # → {"status":"ok","message":"Test payload","timestamp":"<ISO 8601>"}
```
