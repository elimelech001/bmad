# Test Suite — Simple Node.js API Backend

## Framework

**Node.js built-in test runner** (`node:test` + `node:assert/strict`)

- Zero additional dependencies
- Ships with Node.js ≥ 18
- TAP-compatible output; integrates with any CI runner

---

## Setup

```bash
# No install step needed — node:test is built in.
# Confirm your Node version:
node --version   # must be >= 18
```

---

## Running Tests

```bash
# Run all tests once
npm test
# or directly:
node --test

# Watch mode (re-runs on file change)
npm run test:watch
# or:
node --test --watch

# Run a single file
node --test tests/api/routes.test.js
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test": "node --test",
    "test:watch": "node --test --watch"
  }
}
```

---

## Structure

```
tests/
└── api/
    └── routes.test.js    # Integration tests for GET / and GET /test
```

---

## Architecture Overview

Tests spin up the HTTP server on a random free port (`:0`) before each suite and close it after. No mocking, no network calls to external services — this is a pure integration test hitting the real request handler.

**Pattern:**
1. `before()` — `server.listen(0)` to bind a random port
2. `get(server, path)` helper — fires a real `http.get` request
3. Assertions on `statusCode`, `headers`, and `body`
4. `after()` — `server.close()`

---

## Best Practices

- Keep each `it()` block focused on a single assertion.
- Use `node:assert/strict` (strict equality by default — no loose `==`).
- Do not share mutable state across tests; each describe block owns its server lifecycle.
- When `server.js` is implemented, replace the inline `createServer` shim in `routes.test.js` with a real import.

---

## CI Integration

```yaml
# Example GitHub Actions step
- name: Run tests
  run: npm test
```

Node.js built-in runner exits non-zero on any failure — no extra configuration needed for CI pass/fail detection.
