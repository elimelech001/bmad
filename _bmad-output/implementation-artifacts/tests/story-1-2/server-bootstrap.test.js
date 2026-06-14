'use strict';

/**
 * Story 1.2: Bootstrap HTTP Server
 * Tests validating server.js startup, port configuration, request handling,
 * and graceful shutdown behavior.
 *
 * Acceptance Criteria covered:
 *   AC1 - npm start / node server.js starts without error and does not exit immediately
 *   AC2 - Startup message containing the active port is printed to stdout
 *   AC3 - Default port is 3000 when PORT env var is not set
 *   AC4 - When PORT=4000, server binds to 4000 and startup message shows port 4000
 *   AC5 - Server stays alive (does not crash) after receiving an HTTP request
 *   AC6 - Server closes gracefully on SIGTERM and SIGINT
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const { resolve } = require('node:path');

// Project root is 4 levels up: tests/story-1-2/ -> tests/ -> implementation-artifacts/ -> _bmad-output/ -> project-root
const PROJECT_ROOT = resolve(__dirname, '../../../../');
const SERVER_JS = resolve(PROJECT_ROOT, 'server.js');

/** Time to allow server process to start up (ms). */
const STARTUP_TIMEOUT_MS = 3000;

/**
 * Spawn server.js and wait until it prints a ready line to stdout.
 * Resolves with { proc, port, startupLine } on success.
 * Rejects after STARTUP_TIMEOUT_MS if no ready signal is received.
 *
 * @param {object} [env] - Additional environment variables to set (merged with process.env).
 * @returns {Promise<{ proc: import('node:child_process').ChildProcess, port: number, startupLine: string }>}
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
        reject(new Error(`Server did not print startup message within ${STARTUP_TIMEOUT_MS}ms.\nstdout: ${stdout}\nstderr: ${stderr}`));
      }
    }, STARTUP_TIMEOUT_MS);

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
      // Look for the startup message: "Listening on http://localhost:<port>"
      const match = stdout.match(/Listening on http:\/\/localhost:(\d+)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timer);
        const port = parseInt(match[1], 10);
        resolve({ proc, port, startupLine: match[0] });
      }
    });

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk) => { stderr += chunk; });

    proc.on('error', (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    });

    proc.on('exit', (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`Server process exited unexpectedly with code ${code}.\nstdout: ${stdout}\nstderr: ${stderr}`));
      }
    });
  });
}

/**
 * Send a GET request to the server and resolve with { statusCode, body }.
 *
 * @param {number} port
 * @param {string} path
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
function get(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
  });
}

/**
 * Stop a server process with the given signal and wait for it to exit.
 * Returns the exit code (or null if killed).
 *
 * @param {import('node:child_process').ChildProcess} proc
 * @param {string} signal
 * @returns {Promise<number|null>}
 */
function stopServer(proc, signal = 'SIGTERM') {
  return new Promise((resolve) => {
    if (proc.exitCode !== null) {
      resolve(proc.exitCode);
      return;
    }
    proc.on('exit', (code) => resolve(code));
    proc.kill(signal);
  });
}

// ─── AC1 + AC2 + AC3: Default startup behavior ───────────────────────────────

describe('Story 1.2 — Bootstrap HTTP Server', () => {

  describe('AC1: server starts without error and stays alive', () => {
    let proc;

    before(async () => {
      ({ proc } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) {
        await stopServer(proc, 'SIGTERM');
      }
    });

    it('process is running (has not exited) after startup', () => {
      assert.equal(proc.exitCode, null, 'Server process must still be running after startup');
    });

    it('process pid is a positive integer', () => {
      assert.ok(typeof proc.pid === 'number' && proc.pid > 0, 'proc.pid must be a positive integer');
    });
  });

  // ─── AC2 + AC3: Startup message and default port ─────────────────────────

  describe('AC2 + AC3: startup message contains port number; default port is 3000', () => {
    let proc;
    let startupLine;
    let port;

    before(async () => {
      ({ proc, port, startupLine } = await startServer({ PORT: undefined }));
    });

    after(async () => {
      if (proc && proc.exitCode === null) {
        await stopServer(proc, 'SIGTERM');
      }
    });

    it('prints a startup message to stdout', () => {
      assert.ok(startupLine.length > 0, 'Startup line must be non-empty');
    });

    it('startup message matches "Listening on http://localhost:<port>"', () => {
      assert.match(startupLine, /^Listening on http:\/\/localhost:\d+$/,
        `Expected "Listening on http://localhost:<port>", got: "${startupLine}"`);
    });

    it('default port is 3000 when PORT env var is not set', () => {
      assert.equal(port, 3000, `Expected default port 3000, got ${port}`);
    });

    it('startup message contains "3000"', () => {
      assert.ok(startupLine.includes('3000'),
        `Startup message must include "3000" — got: "${startupLine}"`);
    });
  });

  // ─── AC4: Custom PORT via environment variable ───────────────────────────

  describe('AC4: PORT env var overrides the listening port', () => {
    let proc;
    let port;
    let startupLine;

    before(async () => {
      ({ proc, port, startupLine } = await startServer({ PORT: '4000' }));
    });

    after(async () => {
      if (proc && proc.exitCode === null) {
        await stopServer(proc, 'SIGTERM');
      }
    });

    it('binds to port 4000 when PORT=4000', () => {
      assert.equal(port, 4000, `Expected port 4000, got ${port}`);
    });

    it('startup message reflects port 4000', () => {
      assert.ok(startupLine.includes('4000'),
        `Startup message must include "4000" — got: "${startupLine}"`);
    });

    it('startup message format is "Listening on http://localhost:4000"', () => {
      assert.equal(startupLine, 'Listening on http://localhost:4000',
        `Expected exact message "Listening on http://localhost:4000", got: "${startupLine}"`);
    });
  });

  // ─── AC5: Server stays alive after HTTP requests ─────────────────────────

  describe('AC5: server process stays alive after receiving HTTP requests', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    after(async () => {
      if (proc && proc.exitCode === null) {
        await stopServer(proc, 'SIGTERM');
      }
    });

    it('responds to GET / without crashing (process still alive)', async () => {
      const { statusCode } = await get(port, '/');
      // Server currently returns 404 for all routes (stub) — any response means server is alive
      assert.ok(statusCode >= 100 && statusCode < 600,
        `Expected a valid HTTP status code, got: ${statusCode}`);
      assert.equal(proc.exitCode, null, 'Server process must still be running after a request');
    });

    it('responds to an unknown path without crashing', async () => {
      const { statusCode } = await get(port, '/unknown-path');
      assert.ok(statusCode >= 100 && statusCode < 600,
        `Expected a valid HTTP status code for /unknown-path, got: ${statusCode}`);
      assert.equal(proc.exitCode, null, 'Server must still be running after an unknown-path request');
    });

    it('responds to multiple sequential requests without crashing', async () => {
      await get(port, '/');
      await get(port, '/test');
      await get(port, '/another');
      assert.equal(proc.exitCode, null, 'Server must still be running after multiple requests');
    });

    it('returns 404 for the stub route handler (not an unhandled crash)', async () => {
      const { statusCode } = await get(port, '/not-implemented-yet');
      // The stub handler from the story dev notes explicitly returns 404
      assert.equal(statusCode, 404,
        `Expected 404 from stub handler, got: ${statusCode}`);
    });
  });

  // ─── AC6: Graceful shutdown on SIGTERM ───────────────────────────────────

  describe('AC6: graceful shutdown on SIGTERM', () => {
    let proc;
    let port;

    before(async () => {
      ({ proc, port } = await startServer());
    });

    it('process exits after SIGTERM (does not hang)', async () => {
      const exitCode = await Promise.race([
        stopServer(proc, 'SIGTERM'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Process did not exit within 3 s of SIGTERM')), 3000)
        ),
      ]);
      // null exit code means signal exit on some platforms; 0 means clean exit; both are acceptable
      assert.ok(
        exitCode === null || exitCode === 0,
        `Expected exit code 0 or null after SIGTERM, got: ${exitCode}`
      );
    });

    it('port is released after SIGTERM (new server can bind same port)', async () => {
      // The previous process was killed in the prior test; now confirm the port is free
      await new Promise((resolve, reject) => {
        const testServer = http.createServer();
        testServer.listen(port, '127.0.0.1', () => {
          testServer.close(() => resolve());
        });
        testServer.on('error', (err) => {
          // EADDRINUSE means port not yet freed — give it a moment and retry once
          if (err.code === 'EADDRINUSE') {
            setTimeout(() => {
              const retryServer = http.createServer();
              retryServer.listen(port, '127.0.0.1', () => {
                retryServer.close(() => resolve());
              });
              retryServer.on('error', reject);
            }, 500);
          } else {
            reject(err);
          }
        });
      });
    });
  });

  // ─── AC6: Graceful shutdown on SIGINT ────────────────────────────────────

  describe('AC6: graceful shutdown on SIGINT', () => {
    let proc;

    before(async () => {
      ({ proc } = await startServer());
    });

    it('process exits after SIGINT (does not hang)', async () => {
      const exitCode = await Promise.race([
        stopServer(proc, 'SIGINT'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Process did not exit within 3 s of SIGINT')), 3000)
        ),
      ]);
      assert.ok(
        exitCode === null || exitCode === 0,
        `Expected exit code 0 or null after SIGINT, got: ${exitCode}`
      );
    });
  });

  // ─── Non-functional: startup time ────────────────────────────────────────

  describe('NFR: startup time is under 1 second', () => {
    it('server is ready in under 1000 ms', async () => {
      const t0 = Date.now();
      const { proc } = await startServer();
      const elapsed = Date.now() - t0;
      await stopServer(proc, 'SIGTERM');
      assert.ok(elapsed < 1000, `Startup took ${elapsed} ms — must be under 1000 ms (architecture §7)`);
    });
  });

});
