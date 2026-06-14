'use strict';

/**
 * Story 2.1: Hello World Route
 * Tests validating that GET / returns 200, exact body "Hello World",
 * Content-Type text/plain, and is idempotent across multiple requests.
 *
 * Acceptance Criteria covered:
 *   AC1 - GET / returns HTTP 200 OK
 *   AC2 - GET / response body is exactly "Hello World"
 *   AC3 - GET / response Content-Type is text/plain (or contains text/plain)
 *   AC4 - GET / is idempotent: every call returns the same status and body
 *
 * Additional coverage:
 *   - Non-GET methods to / do NOT return 200 (route is GET-guarded)
 *   - Unknown routes still return 404 (regression: 404 fallthrough preserved)
 *   - Server stays alive after all requests (no crash)
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const { resolve } = require('node:path');

// Project root is 4 levels up: tests/story-2-1/ -> tests/ -> implementation-artifacts/ -> _bmad-output/ -> project-root
const PROJECT_ROOT = resolve(__dirname, '../../../../');
const SERVER_JS = resolve(PROJECT_ROOT, 'server.js');

/** Time to allow server process to start up (ms). */
const STARTUP_TIMEOUT_MS = 3000;

/**
 * Spawn server.js and wait until it prints its "Listening on …" line to stdout.
 * Resolves with { proc, port }.
 *
 * @param {object} [env] - Extra environment variables (merged with process.env).
 * @returns {Promise<{ proc: import('node:child_process').ChildProcess, port: number }>}
 */
function startServer(env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [SERVER_JS], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill('SIGKILL');
        reject(new Error(
          `Server did not print startup message within ${STARTUP_TIMEOUT_MS} ms.\n` +
          `stdout: ${stdout}\nstderr: ${stderr}`
        ));
      }
    }, STARTUP_TIMEOUT_MS);

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
      const match = stdout.match(/Listening on http:\/\/localhost:(\d+)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ proc, port: parseInt(match[1], 10) });
      }
    });

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk) => { stderr += chunk; });

    proc.on('error', (err) => {
      if (!settled) { settled = true; clearTimeout(timer); reject(err); }
    });

    proc.on('exit', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(
          `Server process exited unexpectedly with code ${code}.\n` +
          `stdout: ${stdout}\nstderr: ${stderr}`
        ));
      }
    });
  });
}

/**
 * Send an HTTP request to the test server.
 *
 * @param {number} port
 * @param {string} method  - HTTP method (GET, POST, …)
 * @param {string} path    - URL path (e.g. "/")
 * @returns {Promise<{ statusCode: number, headers: object, body: string }>}
 */
function request(port, method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, method, path },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

/**
 * Convenience wrapper: GET request.
 */
function get(port, path) {
  return request(port, 'GET', path);
}

/**
 * Stop a server process and wait for exit.
 */
function stopServer(proc, signal = 'SIGTERM') {
  return new Promise((resolve) => {
    if (proc.exitCode !== null) { resolve(proc.exitCode); return; }
    proc.once('exit', (code) => resolve(code));
    proc.kill(signal);
  });
}

// ─── Story 2.1 test suite ────────────────────────────────────────────────────

describe('Story 2.1 — Hello World Route (GET /)', () => {

  // ── AC1: status 200 ──────────────────────────────────────────────────────

  describe('AC1: GET / returns HTTP 200 OK', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) await stopServer(proc, 'SIGTERM');
    });

    it('status code is 200', async () => {
      const { statusCode } = await get(port, '/');
      assert.equal(statusCode, 200, `Expected status 200, got ${statusCode}`);
    });
  });

  // ── AC2: body is exactly "Hello World" ───────────────────────────────────

  describe('AC2: GET / response body is exactly "Hello World"', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) await stopServer(proc, 'SIGTERM');
    });

    it('body equals "Hello World" (no trailing newline, no extra whitespace)', async () => {
      const { body } = await get(port, '/');
      assert.equal(body, 'Hello World',
        `Expected body to be exactly "Hello World", got: ${JSON.stringify(body)}`);
    });

    it('body does not start with whitespace', async () => {
      const { body } = await get(port, '/');
      assert.ok(!body.startsWith(' ') && !body.startsWith('\n') && !body.startsWith('\r'),
        'Body must not start with whitespace');
    });

    it('body does not end with a newline or trailing space', async () => {
      const { body } = await get(port, '/');
      assert.ok(!body.endsWith('\n') && !body.endsWith(' '),
        'Body must not end with a newline or trailing space');
    });
  });

  // ── AC3: Content-Type contains text/plain ────────────────────────────────

  describe('AC3: GET / Content-Type header contains text/plain', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) await stopServer(proc, 'SIGTERM');
    });

    it('Content-Type header is present', async () => {
      const { headers } = await get(port, '/');
      assert.ok(
        Object.prototype.hasOwnProperty.call(headers, 'content-type'),
        'Content-Type header must be present'
      );
    });

    it('Content-Type header contains "text/plain"', async () => {
      const { headers } = await get(port, '/');
      assert.match(
        headers['content-type'],
        /text\/plain/,
        `Expected Content-Type to contain "text/plain", got: "${headers['content-type']}"`
      );
    });
  });

  // ── AC4: Idempotency ─────────────────────────────────────────────────────

  describe('AC4: GET / is idempotent — every call returns same status and body', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) await stopServer(proc, 'SIGTERM');
    });

    it('three successive GET / calls all return status 200', async () => {
      const results = await Promise.all([
        get(port, '/'),
        get(port, '/'),
        get(port, '/'),
      ]);
      for (const { statusCode } of results) {
        assert.equal(statusCode, 200, `Expected 200 on every call, got ${statusCode}`);
      }
    });

    it('three successive GET / calls all return body "Hello World"', async () => {
      const results = await Promise.all([
        get(port, '/'),
        get(port, '/'),
        get(port, '/'),
      ]);
      for (const { body } of results) {
        assert.equal(body, 'Hello World',
          `Expected "Hello World" on every call, got: ${JSON.stringify(body)}`);
      }
    });

    it('five sequential GET / calls return identical status and body each time', async () => {
      for (let i = 0; i < 5; i++) {
        const { statusCode, body } = await get(port, '/');
        assert.equal(statusCode, 200, `Call ${i + 1}: expected 200, got ${statusCode}`);
        assert.equal(body, 'Hello World', `Call ${i + 1}: expected "Hello World", got ${JSON.stringify(body)}`);
      }
    });
  });

  // ── Non-GET methods must NOT return 200 on / ─────────────────────────────

  describe('Route guard: non-GET methods to / do not match the Hello World handler', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) await stopServer(proc, 'SIGTERM');
    });

    it('POST / returns 404 (not handled by the GET / route)', async () => {
      const { statusCode } = await request(port, 'POST', '/');
      assert.equal(statusCode, 404,
        `Expected POST / to return 404 (not matched by GET handler), got: ${statusCode}`);
    });

    it('PUT / returns 404 (not handled by the GET / route)', async () => {
      const { statusCode } = await request(port, 'PUT', '/');
      assert.equal(statusCode, 404,
        `Expected PUT / to return 404, got: ${statusCode}`);
    });

    it('DELETE / returns 404 (not handled by the GET / route)', async () => {
      const { statusCode } = await request(port, 'DELETE', '/');
      assert.equal(statusCode, 404,
        `Expected DELETE / to return 404, got: ${statusCode}`);
    });
  });

  // ── Regression: 404 fallthrough preserved for unknown routes ─────────────

  describe('Regression: 404 fallthrough is preserved for all other routes', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) await stopServer(proc, 'SIGTERM');
    });

    it('GET /other returns 404', async () => {
      const { statusCode } = await get(port, '/other');
      assert.equal(statusCode, 404, `Expected 404 for /other, got ${statusCode}`);
    });

    it('GET /unknown returns 404', async () => {
      const { statusCode } = await get(port, '/unknown');
      assert.equal(statusCode, 404, `Expected 404 for /unknown, got ${statusCode}`);
    });

    it('GET /test returns 404 (Story 2.2 not yet implemented)', async () => {
      const { statusCode } = await get(port, '/test');
      // Story 2.2 will add /test; for now it must fall through to 404
      assert.equal(statusCode, 404, `Expected 404 for /test (not yet implemented), got ${statusCode}`);
    });
  });

  // ── Server stability: stays alive after all requests ─────────────────────

  describe('Server stability: process stays alive after route requests', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) await stopServer(proc, 'SIGTERM');
    });

    it('process is still running after GET / (no crash)', async () => {
      await get(port, '/');
      assert.equal(proc.exitCode, null,
        'Server process must still be running after GET /');
    });

    it('process is still running after 5 sequential GET / requests', async () => {
      for (let i = 0; i < 5; i++) {
        await get(port, '/');
      }
      assert.equal(proc.exitCode, null,
        'Server process must still be running after 5 requests');
    });

    it('process is still running after requests to multiple routes', async () => {
      await get(port, '/');
      await get(port, '/other');
      await get(port, '/');
      assert.equal(proc.exitCode, null,
        'Server process must still be running after mixed-route requests');
    });
  });

});
