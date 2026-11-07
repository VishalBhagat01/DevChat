import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';
import { corsOptions } from './config/cors.js';
import { generalRateLimiter } from './middleware/rateLimiter.middleware.js';
import mongoose from 'mongoose';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// ─── Security Headers (helmet) ───────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  contentSecurityPolicy: false
}));

// ─── Priority 2.5: HTTP Response Compression (gzip / deflate) ───────────────
// Compresses project file trees, AI code generations, and JSON responses to reduce latency & cloud egress costs
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses larger than 1KB
}));

app.use(morgan('dev'));
app.use(cors(corsOptions));

// ─── Bounded Request Body Size ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// Global rate limit: 100 requests per minute per IP (applied before all routes)
app.use(generalRateLimiter);

app.use("/users" , userRoutes);
app.use("/projects" , projectRoutes);
app.use("/ai" , aiRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'devchat-api' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/ready', (req, res) => {
  const isDatabaseReady = mongoose.connection.readyState === 1;

  if (!isDatabaseReady) {
    return res.status(503).json({
      status: 'not_ready',
      database: 'disconnected'
    });
  }

  return res.status(200).json({
    status: 'ready',
    database: 'connected'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
