'use strict';

const http = require('http');

const port = parseInt(process.env.PORT, 10) || 3000;

const server = http.createServer((req, res) => {
  // Route handling goes here — Story 2.1 and 2.2 will add actual routes
  // For now, a minimal handler that keeps the server alive is sufficient
  res.writeHead(404);
  res.end('Not found');
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
