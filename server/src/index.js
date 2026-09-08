import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import db, { initDatabase } from './config/db.js';
import { seed } from './seeds/seedDatabase.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import posRoutes from './routes/posRoutes.js';
import targetRoutes from './routes/targetRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Schema
initDatabase();

// Auto-seed initial demo data if database is fresh (0 users)
try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
  if (userCount === 0) {
    console.log('[INFO] Fresh database detected. Seeding demo organization data...');
    seed().then(() => console.log('[OK] Database auto-seeded successfully.'));
  }
} catch (e) {
  console.warn('[WARN] Auto-seed check notice:', e.message);
}

// CORS configuration (allow all in production when served together, or localhost in dev)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true 
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000'],
  credentials: true
}));

app.use(express.json());

// Rate limiter for authentication routes (login)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per window
  message: {
    success: false,
    error: '429 Too Many Requests',
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Pharmaceutical Management System API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/targets', targetRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Static frontend serving (Render / Production)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all client routes (e.g. /users, /pos, /reports)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 404 Route Handler for unmatched API requests
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '404 Not Found',
    message: `The requested resource '${req.originalUrl}' was not found on this server.`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  PHARMACEUTICAL MANAGEMENT SYSTEM`);
    console.log(`  Server listening on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Database: SQLite (server/data/pharma.db)`);
    console.log(`=======================================================`);
  });
}

export default app;
