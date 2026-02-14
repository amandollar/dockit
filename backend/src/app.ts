/// <reference path="./types/express.d.ts" />
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import env from './config/env';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import documentRoutes from './routes/document.routes';
import analyticsRoutes from './routes/analytics.routes';

const app: Express = express();

// Trust first proxy (e.g. Render) so X-Forwarded-For is used for client IP / rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, origin);
    return cb(null, false);
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'DOCIT Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Rate limit auth endpoints to reduce abuse
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // per window
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } },
  standardHeaders: true,
});
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handler
app.use((err: Error & { code?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  // Multer errors (file size, type, etc.)
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'File size exceeds limit' } });
    return;
  }
  if (err.message?.includes('allowed') || err.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.message || 'Invalid file' } });
    return;
  }
  const status = err.status ?? 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code ?? 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' && status === 500 ? 'Internal server error' : err.message,
    },
  });
});

export default app;
