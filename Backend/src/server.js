require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocketServer } = require('./socket');
const { pool } = require('./config/database');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

// Initialize Socket.IO
initSocketServer(server);

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🔌 Shutting down gracefully...');
  await pool.end();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║     🚀 NexChat Backend Server       ║
  ║     Running on port ${PORT}            ║
  ║     Environment: ${process.env.NODE_ENV || 'development'}     ║
  ╚══════════════════════════════════════╝
  `);
});
