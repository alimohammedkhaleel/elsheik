import { env } from './env';

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'sheikh-distribution-super-secure-jwt-secret-key-2026',
  expiresIn: '7d',
};
