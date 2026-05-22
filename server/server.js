/**
 * server.js – DevTrackr Express Application Entry Point
 * Bootstraps middleware, routes, DB connection, and starts the HTTP server.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load env vars BEFORE any module that needs them
dotenv.config();

const connectDB = require('./config/db');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
  
// ── Route Imports ────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const aiRoutes = require('./routes/ai');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notification');

// ── Connect Database ─────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());                         // Sets various HTTP security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));  // Body size limit for security
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api/', globalRateLimiter);

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start HTTP & WebSocket Server ────────────────────────────────────────────
const http = require('http');
const { initSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Bootstrap socket server
initSocket(server);

server.listen(PORT, () => {
  console.log(`\n🚀 DevTrackr Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

// ── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(`\n💥 Unhandled Promise Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
