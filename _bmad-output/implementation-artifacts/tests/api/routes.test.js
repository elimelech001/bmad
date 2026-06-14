import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// Import the server factory — server.js should export a createServer() function
// or the listening server instance. Adjust the import path when the app is wired up.
// import { createServer } from '../../server.js';

// ─── Minimal inline server matching the architecture spec ────────────────────
// Remove this block once the real server.js is in place and import it instead.
function createServer() {
  return http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello World');
    } else if (req.method === 'GET' && req.url === '/test') {
      const body = JSON.stringify({ status: 'ok', message: 'test payload' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(body);
    } else {
      res.writeHead(404);
      res.end();
    }
  });
}
// ─────────────────────────────────────────────────────────────────────────────

/** Send a GET request to the test server and resolve with { statusCode, headers, body }. */
function get(server, path) {
  return new Promise((resolve, reject) => {
    const { port } = server.address();
    const req = http.get(`http://localhost:${port}${path}`, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
  });
}

describe('Simple Node.js API — route integration', () => {
  let server;

  before(() => new Promise((resolve) => {
    server = createServer();
    server.listen(0, '127.0.0.1', resolve); // port 0 = OS picks a free port
  }));

  after(() => new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  }));

  describe('GET /', () => {
    it('returns 200 OK', async () => {
      const { statusCode } = await get(server, '/');
      assert.equal(statusCode, 200);
    });

    it('returns Content-Type text/plain', async () => {
      const { headers } = await get(server, '/');
      assert.match(headers['content-type'], /text\/plain/);
    });

    it('returns the literal string "Hello World"', async () => {
      const { body } = await get(server, '/');
      assert.equal(body, 'Hello World');
    });
  });

  describe('GET /test', () => {
    it('returns 200 OK', async () => {
      const { statusCode } = await get(server, '/test');
      assert.equal(statusCode, 200);
    });

    it('returns Content-Type application/json', async () => {
      const { headers } = await get(server, '/test');
      assert.match(headers['content-type'], /application\/json/);
    });

    it('returns { status: "ok", message: "test payload" }', async () => {
      const { body } = await get(server, '/test');
      const json = JSON.parse(body);
      assert.deepEqual(json, { status: 'ok', message: 'test payload' });
    });
  });

  describe('unknown routes', () => {
    it('returns 404 for GET /unknown', async () => {
      const { statusCode } = await get(server, '/unknown');
      assert.equal(statusCode, 404);
    });
  });
});
