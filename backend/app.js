import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './db/db.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import aiRoutes from './routes/ai.routes.js';
import { corsOptions } from './config/cors.js';
import { generalRateLimiter } from './middleware/rateLimiter.middleware.js';

connectDB();

const app = express();

// ─── Security Headers (helmet) ───────────────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security,
// X-XSS-Protection, Referrer-Policy, and other hardening headers automatically.
app.use(helmet({
  // Allow cross-origin requests for the API (CORS handles origin control)
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // HSTS: enforce HTTPS for 1 year, include subdomains, allow preload
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  // Prevent clickjacking by denying framing entirely
  frameguard: { action: 'deny' },
  // Disable Content-Security-Policy in helmet (configure separately if needed for a frontend)
  contentSecurityPolicy: false
}));

app.use(morgan('dev'));
app.use(cors(corsOptions));

// ─── Bounded Request Body Size ───────────────────────────────────────────────
// Prevents DoS via oversized payloads. 10MB allows moderate project file trees
// while blocking multi-hundred-MB abuse payloads.
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

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

export default app;
