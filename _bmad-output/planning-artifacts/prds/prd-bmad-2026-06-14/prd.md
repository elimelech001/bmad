---
title: Simple Node.js API Backend
status: draft
created: 2026-06-14
updated: 2026-06-14
---

# PRD: Simple Node.js API Backend

## 0. Document Purpose

This PRD defines requirements for a minimal Node.js HTTP API server. It is intended for the BMAD workflow team as a small, end-to-end test artifact — complete enough to exercise epic and story generation, architect handoff, and developer execution, but scoped to a few minutes of actual implementation.

---

## 1. Vision

A lightweight Node.js API server that exposes two HTTP endpoints. It serves as the canonical "Hello World"-tier test bed for the BMAD workflow: simple enough to implement in a single sitting, structured enough to produce multiple distinct epics and stories. Success means any developer can clone the repo, run one command, and get a working server with both routes responding correctly.

---

## 2. Target User

### 2.1 Jobs To Be Done

- **As the BMAD workflow tester:** I need a small, real project so I can exercise each step of the BMAD pipeline (PRD → Architecture → Epics → Stories → Dev → QA) without building something consequential.
- **As a developer evaluating the codebase:** I need a running server I can hit with curl or a browser to verify the implementation is correct.

### 2.2 Key User Journeys

- **UJ-1. Developer gets the server running.**
  Persona: Developer with Node.js installed, working from the repo root.
  Entry state: Fresh clone, no server running.
  Path: (1) `npm install`, (2) `npm start`, (3) server logs port to console, (4) developer opens browser or runs `curl localhost:3000`.
  Climax: Both routes return expected responses.
  Resolution: Developer confirms the server works; closes the terminal to stop.

---

## 3. Glossary

- **Route** — An HTTP path + method pair handled by the server that returns a defined response.
- **Payload** — A JSON object returned by an endpoint. Distinct from a plain-text string response.
- **Hello World Route** — The `/` route that returns the literal string `"Hello World"`.
- **Test Payload Route** — The `/test` route that returns a small JSON object.

---

## 4. Features

### 4.1 Hello World Endpoint

**Description:** A `GET /` route that returns the plain-text string `Hello World`. Realizes UJ-1. This is the simplest possible route — no auth, no body parsing, no query params.

**Functional Requirements:**

#### FR-1: Hello World response

Developer (or any HTTP client) can send `GET /` and receive the string `Hello World` with HTTP 200.

**Consequences (testable):**
- Response status is `200 OK`.
- Response body is exactly `Hello World` (plain text, no JSON wrapper, no trailing newline required).
- Response `Content-Type` is `text/plain` or equivalent.

---

### 4.2 Test Payload Endpoint

**Description:** A `GET /test` route that returns a small, static JSON object. Realizes UJ-1. The payload is hardcoded — no database, no dynamic data. It exists purely to exercise JSON serialization and confirm the server can return structured data.

**Functional Requirements:**

#### FR-2: Test payload response

Developer (or any HTTP client) can send `GET /test` and receive a JSON object with HTTP 200.

**Consequences (testable):**
- Response status is `200 OK`.
- Response body is a valid JSON object containing at least: `status`, `message`, and `timestamp` fields.
  - `status`: `"ok"`
  - `message`: `"Test payload"`
  - `timestamp`: ISO 8601 string of current server time at request time.
- Response `Content-Type` is `application/json`.

---

### 4.3 Server Bootstrap

**Description:** The server must start on a configurable port (default `3000`) and log a startup message to stdout. No framework is used — implementation uses Node.js built-in `node:http` module with zero runtime dependencies. Realizes UJ-1. [Updated post-Epic-1: Express assumption resolved; zero-dependency node:http chosen by architecture]

**Functional Requirements:**

#### FR-3: Server starts and listens

The server can be started with a single command (`npm start`) and begins accepting HTTP connections on port 3000 (or the value of the `PORT` environment variable).

**Consequences (testable):**
- Running `npm start` in the project root starts the server without errors.
- A startup message including the active port is printed to stdout.
- `GET /` and `GET /test` both return expected responses while the server is running.

**Out of Scope:**
- HTTPS / TLS termination.
- Hot reload / file watching.
- Process managers (PM2, forever).

---

## 5. Non-Goals (Explicit)

- Authentication or authorization of any kind.
- Database connectivity or persistent storage.
- More than two application routes in v1.
- A frontend or UI.
- Deployment configuration (Docker, cloud, CI/CD).
- Error handling beyond Node.js HTTP server defaults. [Updated post-Epic-1: no Express in use]
- Automated test suite (the BMAD QA step can add this as a follow-on story if desired).

---

## 6. MVP Scope

### 6.1 In Scope

- Node.js project scaffold (`package.json`, entry point).
- Zero runtime dependencies — Node.js built-in `node:http` module only. [Updated post-Epic-1: Express dropped; zero-dependency approach implemented]
- `GET /` → `Hello World` (plain text, 200).
- `GET /test` → JSON payload with `status`, `message`, `timestamp` (200).
- Server listens on `PORT` env var or `3000` by default.
- Startup log message.

### 6.2 Out of Scope for MVP

- Testing framework — deferred to v2 or a follow-on BMAD story.
- `.env` file support — environment variable is sufficient for this scope.
- Logging library — `console.log` is acceptable.
- Any additional routes — `[NOTE FOR PM]` revisit if more routes are needed to exercise additional BMAD story patterns.

---

## 7. Success Metrics

**Primary**
- **SM-1:** Both routes (`GET /` and `GET /test`) return correct status codes and body shapes on the first `curl` after `npm start`. Validates FR-1, FR-2, FR-3.

**Counter-metrics (do not optimize)**
- **SM-C1:** Implementation time — this should not exceed 30 minutes of developer time. If it does, scope has drifted.

---

## 8. Open Questions

1. Should the test payload include additional fields (e.g., `version`, `env`) to make it more useful as a health-check endpoint pattern? *(Non-blocking — current spec is sufficient for BMAD testing.)*

---

## 9. Assumptions Index

- [ASSUMPTION §4.2] The `timestamp` field is generated server-side at request time using `new Date().toISOString()` — no client clock or timezone inference required.
- [ASSUMPTION §4.3 — RESOLVED post-Epic-1] The no-dependency implementation was chosen: Node.js built-in `node:http` module, zero runtime dependencies. FR-3 consequences are unchanged — the server starts, logs port, accepts connections.

---

## Stories

*Small-scope all-inclusive — stories listed inline for direct handoff to the dev agent.*

### Epic 1: Project Setup & Infrastructure

**Epic Goal:** Establish a runnable Node.js project with a single-command startup using Node.js built-in `node:http` (no external framework). [Updated post-Epic-1]

---

**Story 1.1 — Initialize Node.js project**
As a developer, I can run `npm install` in the project root so that all dependencies are resolved and the project is ready to run.

Acceptance criteria:
- `package.json` exists with `name`, `version`, `main`, and `scripts.start` defined.
- `dependencies` block is empty `{}` — no Express, no external packages. [Updated post-Epic-1]
- Running `npm install` completes without errors (installs nothing — validates package.json only).

---

**Story 1.2 — Bootstrap HTTP server**
As a developer, I can run `npm start` so that an HTTP server starts on port 3000 (or `$PORT`) and prints a startup message to stdout.

Acceptance criteria:
- Entry point file `server.js` at project root exists and is referenced by `scripts.start`. [Updated post-Epic-1: flat structure, no src/ folder]
- Server binds to `process.env.PORT || 3000`.
- Startup log includes the active port number (format: `Listening on http://localhost:<port>`).
- Running `npm start` exits without errors and the process stays alive.
- Graceful shutdown on SIGTERM/SIGINT via `server.close()` + `closeAllConnections()`.

---

### Epic 2: API Endpoints

**Epic Goal:** Implement the two application routes, each returning the correct response shape, so that the server satisfies all functional requirements.

---

**Story 2.1 — Hello World route**
As a developer (or HTTP client), I can send `GET /` to the running server so that I receive the plain-text string `Hello World` with HTTP 200.

Acceptance criteria:
- `GET /` returns status `200`.
- Response body is exactly `Hello World`.
- `Content-Type` header indicates plain text.

---

**Story 2.2 — Test payload route**
As a developer (or HTTP client), I can send `GET /test` to the running server so that I receive a JSON object with HTTP 200.

Acceptance criteria:
- `GET /test` returns status `200`.
- Response body is valid JSON with fields: `status: "ok"`, `message: "Test payload"`, `timestamp` (ISO 8601 string, server-generated at request time).
- `Content-Type` header is `application/json`.
