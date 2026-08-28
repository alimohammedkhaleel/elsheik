# Neon PostgreSQL Configuration & Guide

### 1. Overview
The database layer uses **PostgreSQL** hosted on **Neon** (Serverless PostgreSQL).

### 2. Environment Configuration
The backend expects `DATABASE_URL` in `.env` (or server environment settings in deployment):

```env
DATABASE_URL=postgres://[user]:[password]@[neon-host]/[dbname]?sslmode=require
```

### 3. Security Requirements
1. **Never Hardcode Secrets**: Do not store passwords or host URLs in source files.
2. **SSL Connection**: Neon requires SSL encrypted sessions. The backend pool is configured with `ssl: { rejectUnauthorized: false }`.
3. **Fail-Safe Behavior**: If `DATABASE_URL` is missing or set to the placeholder string, the backend will report `unconfigured` state safely without crashing or exposing raw stack traces.

### 4. Health Check
To verify database connectivity, execute:
```http
GET http://localhost:5000/api/health/db
```
Successful Response:
```json
{
  "success": true,
  "message": "Database connection verified successfully",
  "data": {
    "status": "connected",
    "database": "Neon PostgreSQL",
    "responseTimeMs": 142,
    "timestamp": "2026-08-28T11:00:00.000Z"
  },
  "timestamp": "2026-08-28T11:00:00.000Z"
}
```
