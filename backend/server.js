import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import socketHandler from './socket/socketHandler.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS config
const io = new Server(server, {
  cors: {
    origin: '*', // Allow frontend development connection
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Set up connection flag in global scope
global.dbConnected = false;

// Connect to MongoDB
connectDB();

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: global.dbConnected ? 'connected' : 'fallback_memory_mode',
    timestamp: new Date()
  });
});

// Root path fallback
app.get('/', (req, res) => {
  res.send('bLINK Video Conferencing Server API');
});

// Bind Socket.io events
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`bLINK Backend Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
