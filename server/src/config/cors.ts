import cors, { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins: string[] = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or requests without origin in development
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);
