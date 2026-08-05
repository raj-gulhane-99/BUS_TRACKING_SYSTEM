const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db');
const { initializeSocket } = require('./src/socket/socketHandlers');

const authRoutes       = require('./src/routes/authRoutes');
const studentRoutes    = require('./src/routes/studentRoutes');
const driverRoutes     = require('./src/routes/driverRoutes');
const busRoutes        = require('./src/routes/busRoutes');
const routeRoutes      = require('./src/routes/routeRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');
const gpsRoutes        = require('./src/routes/gpsRoutes');
const notifRoutes      = require('./src/routes/notificationRoutes');

const app    = express();
const server = http.createServer(app);

// Allow multiple frontend origins (local + Render)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    // Allow any onrender.com subdomain
    if (origin.endsWith('.onrender.com')) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.onrender.com'))) {
        return callback(null, true)
      }
      callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect DB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to every request so controllers can emit events
app.use((req, _res, next) => { req.io = io; next(); });

// Routes
app.use('/api/auth',         authRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/drivers',      driverRoutes);
app.use('/api/buses',        busRoutes);
app.use('/api/routes',       routeRoutes);
app.use('/api/assignments',  assignmentRoutes);
app.use('/api/gps',          gpsRoutes);
app.use('/api/notifications', notifRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: '🚌 BusTrack API is running', timestamp: new Date() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Socket.IO
initializeSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 BusTrack Server running on port ${PORT}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📡 WebSocket: Ready`);
});
