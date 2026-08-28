# Architecture Overview - مؤسسة الشيخ
## Distribution Customer Management System

### 1. System Philosophy
This system is an enterprise distribution and customer management web application replacing manual Excel workflows with a robust, reliable, and auditable web platform.

```
+-------------------------------------------------------------+
|                 React Client (Vite + TS)                    |
|             (RTL Arabic UI, Framer Motion, GSAP)            |
+-------------------------------------------------------------+
                              |
                              | HTTP / REST API (CORS)
                              v
+-------------------------------------------------------------+
|                 Express REST API (Node.js + TS)             |
|              (Routes -> Controllers -> Services)            |
+-------------------------------------------------------------+
                              |
                              | Repositories (pg Pool)
                              v
+-------------------------------------------------------------+
|            PostgreSQL Database (Neon Serverless Cloud)       |
|                  (SSL Encrypted Connection)                 |
+-------------------------------------------------------------+
```

### 2. Multi-Tier Security & Isolation
- **No Direct Database Exposure**: The React frontend has **zero** knowledge or access to PostgreSQL credentials or `DATABASE_URL`.
- **Backend API Gateway**: All queries and mutations pass through the Express application.
- **Environment Isolation**: Connection strings and secrets live only in server-side environment variables (`.env`).
- **Standardized API Contract**: All endpoints respond with uniform JSON structures:
  ```json
  {
    "success": true,
    "message": "...",
    "data": {},
    "timestamp": "ISO-8601"
  }
  ```

### 3. Layer Separation
1. **Routes (`/src/routes`)**: Define endpoint paths, HTTP verbs, and middleware chains.
2. **Middleware (`/src/middleware`)**: Request logging, authentication/RBAC (Part 2), error handling, and 404 trapping.
3. **Controllers (`/src/controllers`)**: Parse incoming request parameters and invoke appropriate service methods.
4. **Services (`/src/services`)**: Business rules, validations, financial calculations, and orchestration.
5. **Repositories (`/src/repositories`)**: SQL queries, transactions, and data mapping.
6. **Config (`/src/config`)**: Database pool lifecycle, SSL parameters, environment variables, and CORS whitelist.

### 4. Phased Development Roadmap
- **Part 1 (Current)**: Foundation + Architecture + Neon Connection + RTL Shell + Presentation Intro.
- **Part 2**: Database Schema + JWT Authentication + RBAC + Core Backend.
- **Part 3**: Core Business Logic + Invoices + Payments + Account Statements + Financial Engine.
- **Part 4**: Comprehensive Dashboards + Excel/PDF Import/Export + Audit Logs + Production Deployment.
