import express, { Application } from 'express';
import { corsMiddleware } from './config/cors';
import { requestLogger } from './middleware/requestLogger';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export const createApp = (): Application => {
  const app: Application = express();

  // Security & Utility Middlewares
  app.use(corsMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);

  // Mount API Router
  app.use('/api', apiRouter);

  // Fallback 404 handler for unknown routes
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
