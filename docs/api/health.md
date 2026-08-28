# API Endpoints: Health Checks

### 1. Server Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Verifies that the Express API server is operational.
- **Response**:
```json
{
  "success": true,
  "message": "API is running",
  "data": {
    "status": "healthy",
    "uptime": 128,
    "environment": "development",
    "version": "1.0.0"
  },
  "timestamp": "2026-08-28T11:00:00.000Z"
}
```

### 2. Database Connectivity Check
- **Endpoint**: `GET /api/health/db`
- **Description**: Executes a safe PostgreSQL ping (`SELECT 1`) to verify communication with Neon PostgreSQL.
- **Response (Connected)**:
```json
{
  "success": true,
  "message": "Database connection verified successfully",
  "data": {
    "status": "connected",
    "database": "Neon PostgreSQL",
    "responseTimeMs": 85,
    "timestamp": "2026-08-28T11:00:00.000Z"
  },
  "timestamp": "2026-08-28T11:00:00.000Z"
}
```
