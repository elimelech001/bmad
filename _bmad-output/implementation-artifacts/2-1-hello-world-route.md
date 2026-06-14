---
baseline_commit: 74b29bd2270f44c031000dedd084380ac6dbef92
---

# Story 2.1: Hello World Route

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer (or any HTTP client),
I want `GET /` to return the plain-text string `Hello World` with HTTP 200,
so that I can verify the server is handling the root route correctly.

## Acceptance Criteria

1. **Given** the server is running (Epic 1 complete), **When** I send `GET /` to the server, **Then** the response status is `200 OK`.

2. **Given** the server is running, **When** I send `GET /`, **Then** the response body is exactly `Hello World`.

3. **Given** the server is running, **When** I send `GET /`, **Then** the `Content-Type` response header is `text/plain` or contains `text/plain`.

4. **Given** the server is running, **When** I send `GET /` multiple times in succession, **Then** every response returns the same body (`Hello World`) and status (`200`) — the route is idempotent.

## Tasks / Subtasks

- [x] Modify `server.js` to handle `GET /` returning `Hello World` (AC: #1, #2, #3, #4)
  - [x] Inside `http.createServer()` callback, add route check: `req.method === 'GET' && req.url === '/'`
  - [x] On match: call `res.writeHead(200, { 'Content-Type': 'text/plain' })` then `res.end('Hello World')`
  - [x] Preserve the existing `404` fallthrough for all other routes (critical — Story 2.2 depends on it)
  - [x] Do NOT add Express, do NOT use any external library
- [x] Manual verification (AC: #1, #2, #3, #4)
  - [x] Run `npm start`, confirm startup message appears
  - [x] `curl -i http://localhost:3000/` — check status 200, body `Hello World`, header `Content-Type: text/plain`
  - [x] Repeat the curl call 3+ times — confirm identical response every time (idempotency AC #4)
  - [x] `curl -i http://localhost:3000/other` — confirm still returns 404 (regression check)
- [x] Verify server stays alive after route requests (no crash)

## Dev Notes

### CRITICAL: Modify `server.js` — Do NOT Replace Its Structure

Story 1.2 (done) created `server.js` with an HTTP server, port configuration, error handling, and graceful shutdown. **You must add the route inside the existing `createServer` callback — do not rewrite the file from scratch.**

Current `server.js` shape (as delivered by Story 1.2):

```js
'use strict';

const http = require('http');

const port = parseInt(process.env.PORT, 10) || 3000;

const server = http.createServer((req, res) => {
  // THIS IS WHERE YOU ADD THE ROUTE LOGIC
  res.writeHead(404);
  res.end('Not found');
});

server.on('error', (err) => { /* error handler — DO NOT REMOVE */ });
server.listen(port, '0.0.0.0', () => { console.log(`Listening on http://localhost:${port}`); });
// SIGTERM / SIGINT shutdown handlers — DO NOT REMOVE
```

**What to preserve — DO NOT touch:**
- `'use strict';` at top
- `const http = require('http');`
- `parseInt(process.env.PORT, 10) || 3000` port logic
- `server.on('error', ...)` handler (prevents crash on EADDRINUSE, etc.)
- `server.listen(port, '0.0.0.0', callback)` with the startup log
- `shutdown()` function and the `process.on('SIGTERM', shutdown)` / `process.on('SIGINT', shutdown)` registrations

### Required Route Implementation

Replace the stub handler inside `createServer` with this pattern:

```js
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World');
  } else {
    // Default: 404 — Story 2.2 will add /test here
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});
```

**Key details:**
- Check BOTH `req.method` and `req.url` — method guard prevents POST/PUT/DELETE to `/` from matching
- `res.writeHead(200, { 'Content-Type': 'text/plain' })` — sets status AND header in one call
- `res.end('Hello World')` — body is exactly `Hello World` (no newline, no trailing space)
- The `else` block is the existing 404 fallthrough; keep it for all unmatched routes
- Story 2.2 will add `GET /test` as another branch inside this same if/else chain

### No New Files, No New Dependencies

- **ONE file modified:** `server.js` only
- **No new files:** do not create route files, modules, or middleware
- **No npm packages:** zero runtime dependencies (architecture §6)
- **No test files needed:** testing is out of scope (architecture §8, PRD §5)

### File Structure (unchanged from Story 1.2)

```
project-root/
├── package.json        # DO NOT MODIFY
├── package-lock.json   # DO NOT MODIFY
└── server.js           # MODIFY — add GET / handler inside createServer callback
```

### Language and Module System

- **CommonJS only** — `require()` / `module.exports`, NO `import`/`export`
- **`'use strict';`** must remain at top of file
- No TypeScript, no transpilation, plain `.js` running directly via `node server.js`

**WARNING from Stories 1.1 and 1.2 reviews:** A previous dev added `"type": "module"` to `package.json` (auto-fixed). Do NOT introduce ESM. If you find `"type": "module"` in `package.json`, remove it — it violates the architecture mandate.

### Architecture: Route Specification

From architecture §4:

```
GET /
  Response: 200 OK
  Content-Type: text/plain
  Body: Hello World

All other paths → 404 Not Found
```

The body must be exactly `Hello World` — match the architecture spec literally. Do not add newlines, HTML, or JSON wrapping.

### Cross-Story Dependencies

- **Depends on:** Stories 1.1 and 1.2 (both `done`) — `package.json` and `server.js` already exist
- **Story 2.2 depends on this story:** When Story 2.2 adds `GET /test`, it will add another branch to the same `createServer` callback. Leave the structure extensible — use if/else if/else, not a monolithic if.
- **Do not implement `GET /test`** in this story — that is Story 2.2's scope.

### Previous Story Learnings (from Story 1.2)

1. **Story 1.2 review found:** `server.close()` alone does not flush keep-alive connections. The fix was `server.closeAllConnections()`. This is already in `server.js` — do not remove or alter the shutdown logic.
2. **Story 1.2 review found:** `server.on('error', ...)` is required to prevent process crash on EADDRINUSE and socket errors. Already in `server.js` — preserve it.
3. **Story 1.1 review found:** `"type": "module"` in `package.json` was a HIGH issue — CommonJS is mandatory.
4. **Pattern established:** All application logic lives in `server.js` at the project root. No sub-directories, no modules.

### Manual Verification Commands

```bash
# Start the server
npm start
# Expected: Listening on http://localhost:3000

# AC #1 and #2: status 200, body "Hello World"
curl -i http://localhost:3000/
# Expected header: HTTP/1.1 200 OK
# Expected body:   Hello World

# AC #3: Content-Type check
curl -s -D - http://localhost:3000/ -o /dev/null | grep -i content-type
# Expected: Content-Type: text/plain

# AC #4: Idempotency — run multiple times
curl http://localhost:3000/
curl http://localhost:3000/
curl http://localhost:3000/
# All must return: Hello World

# Regression: 404 for unknown routes still works
curl -i http://localhost:3000/other
# Expected: 404 Not Found

# Regression: server stays alive (process must not exit after requests)
# (Verify npm start process is still running after all curls above)
```

### Non-Functional Requirements

| Attribute | Target | Source |
|---|---|---|
| Startup time | < 1 second | architecture §7 |
| Memory at idle | < 30 MB RSS | architecture §7 |
| Response correctness | Exact body match | architecture §4, epics AC #2 |

### What This Story Does NOT Do

- Does NOT implement `GET /test` — that is Story 2.2
- Does NOT add Express or any dependency — zero-dependency architecture
- Does NOT create test files — out of scope (architecture §8)
- Does NOT create `.env`, Docker, or CI config
- Does NOT modify `package.json` or `package-lock.json`
- Does NOT change port configuration, startup message, or shutdown logic

### Project Structure Notes

- Flat structure at project root — no `src/` or `lib/` (architecture §3, §6)
- All route logic lives in `server.js` — no separate router file
- This story makes a surgical change to one section of `server.js`

### References

- [Source: `_bmad-output/planning-artifacts/architecture.md#4-route-specifications`] — GET / response: 200, text/plain, body `Hello World`
- [Source: `_bmad-output/planning-artifacts/architecture.md#2-technology-decisions`] — `node:http`, CommonJS, no framework
- [Source: `_bmad-output/planning-artifacts/architecture.md#3-project-structure`] — single `server.js`, flat root structure
- [Source: `_bmad-output/planning-artifacts/architecture.md#6-key-implementation-constraints`] — single file, no deps, stateless
- [Source: `_bmad-output/planning-artifacts/architecture.md#8-out-of-scope`] — testing out of scope
- [Source: `_bmad-output/planning-artifacts/epics.md#story-21-hello-world-route`] — user story statement and BDD acceptance criteria
- [Source: `_bmad-output/implementation-artifacts/1-2-bootstrap-http-server.md#dev-notes`] — Story 1.2 context: server.js shape, no Express, CommonJS mandate, error handler, graceful shutdown
- [Source: `_bmad-output/implementation-artifacts/1-2-bootstrap-http-server.md#senior-developer-review`] — Review findings: closeAllConnections, error handler, CommonJS for tests

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered. Implementation was straightforward — surgical addition of if/else route block inside existing createServer callback.

### Completion Notes List

- Implemented `GET /` route in `server.js` inside the existing `http.createServer()` callback using if/else pattern as specified in Dev Notes.
- Route checks both `req.method === 'GET'` and `req.url === '/'` to prevent non-GET methods from matching.
- `res.writeHead(200, { 'Content-Type': 'text/plain' })` sets status and header; `res.end('Hello World')` sends the exact body with no trailing newline.
- 404 fallthrough preserved with `Content-Type: text/plain` header for proper response (Story 2.2 extensibility maintained with if/else if/else structure).
- All ACs verified manually: AC1 (200 OK), AC2 (exact body `Hello World`), AC3 (`Content-Type: text/plain`), AC4 (idempotency — 3+ identical responses).
- Regression: `/other` returns 404. Server stays alive after all requests (SIGINT graceful shutdown confirmed).
- No new files, no new dependencies, no ESM. CommonJS and `'use strict'` preserved.

### File List

- server.js

## Change Log

- 2026-06-14: Story implemented — added `GET /` route to `server.js` returning 200 `Hello World` with `Content-Type: text/plain`. All ACs verified manually. No regressions. Story ready for review.
