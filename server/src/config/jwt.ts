import { env } from './env';

const INSECURE_DEFAULT_SECRET = 'sheikh-distribution-super-secure-jwt-secret-key-2026';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();
  if (env.NODE_ENV === 'production') {
    if (!secret || secret === INSECURE_DEFAULT_SECRET) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable must be explicitly defined and secure in production mode.'
      );
    }
    return secret;
  }
  return secret || INSECURE_DEFAULT_SECRET;
};

export const jwtConfig = {
  get secret(): string {
    return getJwtSecret();
  },
  expiresIn: '24h',
  refreshExpiresIn: '7d',
};
