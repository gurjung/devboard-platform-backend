# DevBoard Backend

Standalone REST API backend for **DevBoard** — a modern workspace, project, and task management platform.

Built with **Node.js**, **Express 5**, **TypeScript**, **Prisma 6**, and **PostgreSQL (Supabase)**.

---

## Tech Stack & Architecture

- **Runtime & Framework:** Node.js (`v18+`, tested on `v25`), Express 5.x
- **Language:** TypeScript (strict mode, `ES2022` target, `NodeNext` module resolution)
- **Database & ORM:** PostgreSQL (Supabase Connection Pooler) + Prisma 6 (multi-file schema folder)
- **Authentication:** JWT Access Tokens (15-min TTL) + Secure HTTP-only Refresh Tokens (7-day TTL)
- **Security & Hardening:**
  - **Helmet:** HTTP header hardening
  - **Rate Limiting:** Layered `express-rate-limit` (Global: 200 req/15m, Auth: 15 req/15m brute-force mitigation)
  - **Token Security:** Refresh Token Rotation (RTR), Replay/Theft Detection (revokes all active sessions upon replay), SHA-256 token hashing
  - **Password Hashing:** Bcrypt (10 salt rounds)
  - **Transport & Access:** CORS with credentials, Secure Cookie-Parser
- **Validation:** Zod schema validation middleware for request bodies and query parameters
- **API Documentation:** OpenAPI 3.0 specification served via interactive Swagger UI

---

## Project Structure

The codebase adheres to a clean layered architecture separating HTTP routing, validation, business domain logic, and data persistence:

```text
src/
├── config/             # Environment variable parsing & Zod schema validation
├── controllers/        # HTTP transport layer, request extraction & response formatting
├── docs/               # OpenAPI 3.0 specifications
├── middlewares/        # Authentication, RBAC, Rate Limiting, Validation & Error handling
├── routes/             # Express route definitions & nested sub-router mount points
├── schemas/            # Zod validation contracts (Auth, Workspace, Project, Task, Member)
├── services/           # Business domain logic & Prisma database transactions
├── types/              # Ambient & custom TypeScript type declarations
├── utils/              # Application error classes & token hashing utilities
├── app.ts              # Express application configuration & middleware pipeline
└── server.ts           # Server bootstrap & graceful shutdown handlers
prisma/
├── schema/             # Multi-file Prisma schemas (base, user, auth, workspace, project, task, invite)
└── seed.ts             # Deterministic database seeder for demo environments
```

---

## Data Model & Entity Relations

```mermaid
erDiagram
    User ||--o{ RefreshToken : owns
    User ||--o{ WorkspaceMember : belongs_to
    User ||--o{ WorkspaceInvite : sends
    User ||--o{ Project : creates
    User ||--o{ Task : "assigned / created"
    Workspace ||--o{ WorkspaceMember : contains
    Workspace ||--o{ WorkspaceInvite : has
    Workspace ||--o{ Project : contains
    Project ||--o{ Task : contains
```

---

## Getting Started

### 1. Prerequisites

- **Node.js:** `v18+` (recommended: `v20+` or `v25`)
- **PostgreSQL Database:** PostgreSQL 14+ instance or Supabase project

### 2. Installation

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and configure your environment:

```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `5001` (avoids macOS AirPlay port 5000) |
| `NODE_ENV` | Application runtime environment | `development` (`development` \| `production` \| `test`) |
| `CORS_ORIGIN` | Allowed client origin for CORS | `http://localhost:3000` |
| `DATABASE_URL` | Supabase transaction pooler URL (port 6543) | `postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase direct connection URL (port 5432) | `postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:5432/postgres` |
| `JWT_ACCESS_SECRET` | Cryptographic secret for signing JWT access tokens | `your-super-secret-access-token-key` |

### 4. Database Setup & Seeding

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Push Schema to Database:**
   ```bash
   npx prisma db push
   ```

3. **Seed Demo Data:**
   ```bash
   npx prisma db seed
   ```

**Demo Credentials (all share password: `Password123!`):**
- **Owner:** `owner@devboard.com`
- **Admin:** `sarah.lead@devboard.com`
- **Member:** `alex.dev@devboard.com`
- **Demo Workspace:** "DevBoard HQ" (slug: `devboard-hq`)

### 5. Running the Application

```bash
# Development mode with hot reloading (tsx watch)
npm run dev

# Production build and run
npm run build
npm start
```

---

## API Response & Error Handling Contract

All endpoints adhere to a standardized JSON response envelope:

### Success Response
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": {
    "tasks": [ ... ],
    "nextCursor": "cm123abc...",
    "hasMore": true,
    "totalCount": 42
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Project not found in this workspace"
}
```
*(In `development` mode, the error payload includes the error `stack` trace for debugging).*

---

## Interactive API Documentation (Swagger UI)

DevBoard provides a comprehensive OpenAPI 3.0 specification and interactive Swagger UI developer portal:

- **Swagger UI:** [`http://localhost:5001/api-docs`](http://localhost:5001/api-docs) (Interactive dashboard with Bearer JWT authorization)
- **OpenAPI 3.0 Spec JSON:** [`http://localhost:5001/api-docs/json`](http://localhost:5001/api-docs/json) (Raw JSON for automated client & TypeScript type generation)

| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api-docs` | Public | Interactive Swagger UI developer portal |
| `GET` | `/api-docs/json` | Public | Raw OpenAPI 3.0 specification JSON |

---

## API Endpoints Reference

### System Health

| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System uptime, timestamp, and health status |

### Authentication (`/auth`)
*Rate limit: 15 requests per 15 minutes per IP*

| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Registers a new user with bcrypt-hashed password (10 salt rounds) |
| `POST` | `/auth/login` | Public | Validates credentials; returns 15-min JWT access token + sets 7-day `httpOnly` refresh cookie |
| `POST` | `/auth/refresh` | Cookie | Single-use token rotation; detects reuse/theft (revokes all sessions on replay) |
| `POST` | `/auth/logout` | Public/Idempotent | Revokes refresh token in database and clears the `refreshToken` cookie |
| `GET` | `/auth/me` | Bearer Token | Returns sanitized profile (`id`, `name`, `email`, `createdAt`) of logged-in user |

### Workspaces (`/workspaces`)

| Method | Route | Auth / Min Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/workspaces` | Bearer Token | Creates a new workspace with unique slug; auto-assigns creator as `OWNER` |
| `GET` | `/workspaces` | Bearer Token | Lists all workspaces where the authenticated user is a member |
| `GET` | `/workspaces/:workspaceId` | `MEMBER` | Retrieves details and member role for a specific workspace |
| `PATCH` | `/workspaces/:workspaceId` | `ADMIN` | Updates workspace name or logo |
| `DELETE` | `/workspaces/:workspaceId` | `OWNER` | Deletes workspace and cascade-deletes member associations |
| `GET` | `/workspaces/:workspaceId/my-tasks` | `MEMBER` | Aggregates tasks assigned to current user across all projects with cursor pagination |
| `GET` | `/workspaces/:workspaceId/stats` | `MEMBER` | Aggregated metrics (project/task/member counts, overdue, completed, and recent tasks) |

### Workspace Members (`/workspaces/:workspaceId/members`)

| Method | Route | Auth / Min Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/workspaces/:workspaceId/members` | `MEMBER` | Lists all workspace members with user profiles |
| `PATCH` | `/workspaces/:workspaceId/members/:memberId` | `ADMIN` | Updates member role (`ADMIN` or `MEMBER`); protects owner role |
| `DELETE` | `/workspaces/:workspaceId/members/:memberId` | `MEMBER`/`ADMIN` | Self-leave or member removal; prevents owner from leaving/removal |

### Workspace Invites (`/workspaces/:workspaceId/invites`)

| Method | Route | Auth / Min Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/workspaces/:workspaceId/invites` | `ADMIN` | Generates a 7-day cryptographic invite link for an email address |
| `GET` | `/workspaces/:workspaceId/invites` | `ADMIN` | Lists all pending invitations for the workspace |
| `DELETE` | `/workspaces/:workspaceId/invites/:inviteId` | `ADMIN` | Revokes/cancels a pending workspace invitation |

### Invitations (`/invites`)

| Method | Route | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/invites/:token` | Public | Previews invitation details (workspace name, inviter, role) without auth |
| `POST` | `/invites/:token/accept` | Bearer Token | Accepts invitation, verifies email match, and atomically adds user as member |

### Projects (`/workspaces/:workspaceId/projects`)

| Method | Route | Auth / Min Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/workspaces/:workspaceId/projects` | `ADMIN` | Creates a project within workspace with auto-generated scoped slug |
| `GET` | `/workspaces/:workspaceId/projects` | `MEMBER` | Lists all projects belonging to the workspace |
| `GET` | `/workspaces/:workspaceId/projects/:projectId` | `MEMBER` | Retrieves single project details within the workspace |
| `PATCH` | `/workspaces/:workspaceId/projects/:projectId` | `ADMIN` | Updates project name, description, or status (slug remains immutable) |
| `DELETE` | `/workspaces/:workspaceId/projects/:projectId` | `ADMIN` | Permanently deletes project from workspace |

### Tasks (`/workspaces/:workspaceId/projects/:projectId/tasks`)

| Method | Route | Auth / Allowed Actors | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/workspaces/:workspaceId/projects/:projectId/tasks` | Workspace `MEMBER` | Creates a task; validates that `assigneeId` is a member of the workspace |
| `GET` | `/workspaces/:workspaceId/projects/:projectId/tasks` | Workspace `MEMBER` | Cursor-paginated task list with filtering & sorting |
| `GET` | `/workspaces/:workspaceId/projects/:projectId/tasks/:taskId` | Workspace `MEMBER` | Retrieves task details with joined safe assignee and creator profiles |
| `PATCH` | `/workspaces/:workspaceId/projects/:projectId/tasks/:taskId` | Creator / Assignee / `ADMIN` | Updates task fields; regular members can only update tasks they created or are assigned to |
| `DELETE` | `/workspaces/:workspaceId/projects/:projectId/tasks/:taskId` | Creator / `ADMIN` / `OWNER` | Deletes a task; assignees who did not create the task are strictly forbidden (`403`) |

#### Task Filtering & Pagination Query Parameters

`GET /workspaces/:workspaceId/projects/:projectId/tasks` and `GET /workspaces/:workspaceId/my-tasks` accept the following query parameters:

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `cursor` | `string` | `undefined` | Task ID pointer for cursor pagination |
| `pageSize` | `number` | `20` | Number of tasks per page (min `1`, max `100`) |
| `status` | `enum` | `undefined` | Filter by `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, or `DONE` |
| `priority` | `enum` | `undefined` | Filter by `LOW`, `MEDIUM`, `HIGH`, or `URGENT` |
| `assigneeId` | `string` | `undefined` | Filter by assignee User ID, `"null"`, or `"unassigned"` |
| `dueDate` | `string` | `undefined` | Filter tasks due on or before ISO date string |
| `overdue` | `boolean` | `undefined` | When `"true"`, filters tasks past their `dueDate` that are not `DONE` |
