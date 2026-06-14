'use strict';

const http = require('http');

const port = parseInt(process.env.PORT, 10) || 3000;

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

// Prevent unhandled 'error' events from crashing the process (AC: #1, #5)
server.on('error', (err) => {
  console.error('Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
    process.exit(1);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Listening on http://localhost:${port}`);
});

// Graceful shutdown (architecture §6)
// server.closeAllConnections() closes keep-alive sockets so the process can exit cleanly
function shutdown() {
  server.close(() => {
    process.exit(0);
  });
  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
