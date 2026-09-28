# DevBoard Backend

Standalone REST API backend for DevBoard — a modern workspace, project, and task management platform.

Built with Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL (Supabase).

---

## Tech Stack & Architecture

- **Runtime & Framework:** Node.js, Express 4.x
- **Language:** TypeScript (strict mode, `NodeNext` module resolution)
- **Database & ORM:** PostgreSQL (Supabase Connection Pooler) + Prisma 6 (multi-file schema)
- **Authentication:** JWT Access Tokens (15-min TTL) + Secure HTTP-only Refresh Tokens (7-day TTL)
- **Security:** Refresh Token Rotation (RTR), Replay/Theft Detection, Bcrypt (10 rounds), SHA-256 token hashing, CORS, Cookie-Parser
- **Validation:** Zod schema validation middleware

---

## Getting Started

### 1. Prerequisites

- Node.js (`v18+`, tested on `v25`)
- PostgreSQL instance (e.g. Supabase)

### 2. Installation

```bash
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key environment variables:

- `PORT` — Server port (default: `5001` to avoid macOS AirPlay conflict on 5000)
- `DATABASE_URL` — Supabase transaction pooler connection string (port 6543)
- `DIRECT_URL` — Supabase direct connection string (port 5432)
- `JWT_ACCESS_SECRET` — Secret key for signing 15-minute access tokens
- `CORS_ORIGIN` — Frontend origin (e.g. `http://localhost:3000`)

### 4. Database Setup

Push schema models to PostgreSQL:

```bash
npx prisma db push
```

### 5. Running the Application

```bash
# Development mode with hot-reloading
npm run dev

# Production build and run
npm run build
npm start
```

---

## API Endpoints (Current Implementation)

### System Health

| Method | Route     | Auth   | Description                                 |
| ------ | --------- | ------ | ------------------------------------------- |
| `GET`  | `/health` | Public | System uptime, timestamp, and health status |

### Authentication (`/auth`)

| Method | Route            | Auth              | Description                                                                                   |
| ------ | ---------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `POST` | `/auth/register` | Public            | Registers a new user with bcrypt-hashed password (10 salt rounds)                             |
| `POST` | `/auth/login`    | Public            | Validates credentials; returns 15-min JWT access token + sets 7-day `httpOnly` refresh cookie |
| `POST` | `/auth/refresh`  | Cookie            | Single-use token rotation; detects reuse/theft (revokes all sessions on replay)               |
| `POST` | `/auth/logout`   | Public/Idempotent | Revokes refresh token in database and clears the `refreshToken` cookie                        |
| `GET`  | `/auth/me`       | Bearer Token      | Returns sanitized profile (`id`, `name`, `email`, `createdAt`) of logged-in user              |

### Workspaces (`/workspaces`)

| Method   | Route                       | Auth / Min Role | Description                                                               |
| -------- | --------------------------- | --------------- | ------------------------------------------------------------------------- |
| `POST`   | `/workspaces`               | Bearer Token    | Creates a new workspace with unique slug; auto-assigns creator as `OWNER` |
| `GET`    | `/workspaces`               | Bearer Token    | Lists all workspaces where the authenticated user is a member             |
| `GET`    | `/workspaces/:workspaceId`  | `MEMBER`        | Retrieves details and member role for a specific workspace                |
| `PATCH`  | `/workspaces/:workspaceId`  | `ADMIN`         | Updates workspace name or logo                                            |
| `DELETE` | `/workspaces/:workspaceId`  | `OWNER`         | Deletes workspace and cascade-deletes member associations                 |

### Workspace Members (`/workspaces/:workspaceId/members`)

| Method   | Route                                        | Auth / Min Role  | Description                                                         |
| -------- | -------------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `GET`    | `/workspaces/:workspaceId/members`           | `MEMBER`         | Lists all workspace members with user profiles                      |
| `PATCH`  | `/workspaces/:workspaceId/members/:memberId` | `ADMIN`          | Updates member role (`ADMIN` or `MEMBER`); protects owner role      |
| `DELETE` | `/workspaces/:workspaceId/members/:memberId` | `MEMBER`/`ADMIN` | Self-leave or member removal; prevents owner from leaving/removal   |

### Workspace Invites (`/workspaces/:workspaceId/invites`)

| Method   | Route                                        | Auth / Min Role | Description                                                         |
| -------- | -------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `POST`   | `/workspaces/:workspaceId/invites`           | `ADMIN`         | Generates a 7-day cryptographic invite link for an email address     |
| `GET`    | `/workspaces/:workspaceId/invites`           | `ADMIN`         | Lists all pending invitations for the workspace                     |
| `DELETE` | `/workspaces/:workspaceId/invites/:inviteId` | `ADMIN`         | Revokes/cancels a pending workspace invitation                      |

### Invitations (`/invites`)

| Method | Route                   | Auth         | Description                                                                  |
| ------ | ----------------------- | ------------ | ---------------------------------------------------------------------------- |
| `GET`  | `/invites/:token`       | Public       | Previews invitation details (workspace name, inviter, role) without auth     |
| `POST` | `/invites/:token/accept`| Bearer Token | Accepts invitation, verifies email match, and atomically adds user as member |

---


