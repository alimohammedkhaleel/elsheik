import { createApp } from './app';
import { env, validateDatabaseEnv } from './config/env';
import { closeDatabasePool } from './config/database';
import { Logger } from './utils/logger';

const app = createApp();

// Global Process Crash Prevention Traps
process.on('uncaughtException', (err) => {
  Logger.error('[CRITICAL] Uncaught Exception trapped to prevent process termination:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('[CRITICAL] Unhandled Promise Rejection trapped to prevent process termination:', {
    reason,
    promise,
  });
});

// Only listen locally when NOT on Vercel Serverless
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const server = app.listen(env.PORT, () => {
    Logger.info(`=======================================================`);
    Logger.info(`Distribution Management System API (مؤسسة الشيخ)`);
    Logger.info(`Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
    Logger.info(`Base API URL: http://localhost:${env.PORT}/api`);
    Logger.info(`Health Check: http://localhost:${env.PORT}/api/health`);

    const dbValidation = validateDatabaseEnv();
    if (dbValidation.isConfigured) {
      Logger.info(`Neon PostgreSQL: Configured`);
    } else {
      Logger.warn(`Neon PostgreSQL: ${dbValidation.message}`);
    }
    Logger.info(`=======================================================`);
  });

  // Keep connections alive and prevent slowloris attacks
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  const handleGracefulShutdown = (signal: string) => {
    Logger.info(`Received ${signal}. Gracefully terminating server...`);
    server.close(async () => {
      try {
        await closeDatabasePool();
      } catch (err) {
        Logger.error('Error closing database pool:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
}

export default app;
