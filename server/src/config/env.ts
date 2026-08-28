import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Also attempt loading from parent if run in workspace root
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL?: string;
  CLIENT_URL: string;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  DATABASE_URL: process.env.DATABASE_URL?.trim(),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
};

/**
 * Validates that database configuration is provided when needed.
 * Returns boolean status and a safe sanitised message.
 */
export const validateDatabaseEnv = (): { isConfigured: boolean; message: string } => {
  if (!env.DATABASE_URL || env.DATABASE_URL === 'YOUR_NEON_DATABASE_CONNECTION_STRING') {
    return {
      isConfigured: false,
      message: 'DATABASE_URL is not configured or using default placeholder.',
    };
  }
  return {
    isConfigured: true,
    message: 'DATABASE_URL is present in environment variables.',
  };
};
