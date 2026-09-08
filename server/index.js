import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import aiRoutes from './routes/ai.js';
import noteRoutes from './routes/notes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'notioniq-secret-key-2026-production';

// Security Headers & Fingerprint Removal
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Body parsers with tight limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// CORS setup for local Astro dev server
app.use(cors({
  origin: ['http://localhost:4321', 'http://127.0.0.1:4321', 'http://localhost:3000'],
  credentials: true,
}));

// Initialize DB and Session store
const dbConnection = await connectDB();

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    client: dbConnection.getClient(),
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60, // 14 days
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));

// API Routes
app.use('/api', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/documents', aiRoutes);
app.use('/api/notes', noteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// Global generic error handling middleware (No leak of stack traces / internals)
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  const status = err.status || (err.statusCode && err.statusCode >= 400 ? err.statusCode : 500);
  const clientMessage = status < 500 ? (err.message || 'Invalid request') : 'An unexpected server error occurred. Please try again later.';
  
  res.status(status).json({
    error: err.name || 'ServerError',
    message: clientMessage,
  });
});

app.listen(PORT, () => {
  console.log(`[NotionIQ Backend] Server running on port ${PORT}`);
});

export default app;
