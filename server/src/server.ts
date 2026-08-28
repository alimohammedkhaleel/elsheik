import { createApp } from './app';
import { env, validateDatabaseEnv } from './config/env';
import { closeDatabasePool } from './config/database';
import { Logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  Logger.info(`=======================================================`);
  Logger.info(`🚀 Distribution Management System API (مؤسسة الشيخ)`);
  Logger.info(`📡 Server is running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  Logger.info(`🌐 Base API URL: http://localhost:${env.PORT}/api`);
  Logger.info(`🩺 Health Check: http://localhost:${env.PORT}/api/health`);
  Logger.info(`🗄️  Database Check: http://localhost:${env.PORT}/api/health/db`);

  const dbValidation = validateDatabaseEnv();
  if (dbValidation.isConfigured) {
    Logger.info(`🔒 Neon PostgreSQL: Configured and ready`);
  } else {
    Logger.warn(`⚠️  Neon PostgreSQL: ${dbValidation.message}`);
  }
  Logger.info(`=======================================================`);
});

// Graceful shutdown handling
const handleGracefulShutdown = (signal: string) => {
  Logger.info(`Received ${signal}. Gracefully terminating server...`);
  server.close(async () => {
    Logger.info('HTTP server closed.');
    try {
      await closeDatabasePool();
      Logger.info('Database connection pool closed.');
    } catch (err) {
      Logger.error('Error closing database pool:', err);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
