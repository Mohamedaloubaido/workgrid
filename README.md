# Workgrid

Workgrid is a portfolio-grade project management SaaS built to demonstrate production-minded full-stack engineering: authentication, multi-tenant PostgreSQL data modeling, workspace RBAC, an auditable task workflow, a React Kanban dashboard, Docker and automated quality gates.

## Demo and source status

Frontend deployment: https://workgrid-web.vercel.app  
Portfolio case study: https://mohammed-portfolio-git-redesign-fullstack-portfolio-dev-talent.vercel.app/work/workgrid

> The React dashboard is deployed publicly. The Fastify API and PostgreSQL database are implemented in this repository and are currently intended to run locally with Docker rather than as a public production service.

## What this project demonstrates

Workgrid is intentionally **not** a basic todo app. It models real SaaS concerns:

- Users authenticate with expiring JWT access tokens.
- Users belong to workspaces with `OWNER`, `ADMIN` or `MEMBER` roles.
- Projects and tasks are scoped through workspace ownership.
- Authorization is enforced server-side, separately from authentication.
- Task mutations produce workspace-scoped audit records.
- The dashboard consumes the real API and supports drag-and-drop task state changes.
- Request payloads and environment configuration are validated.
- Docker provides repeatable local infrastructure.
- CI is defined for linting, types, tests and production builds.

## Stack

### API

- Node.js 22
- Fastify 5
- TypeScript
- PostgreSQL 16
- Prisma ORM
- JWT authentication
- Zod validation
- Swagger / OpenAPI
- Vitest

### Dashboard

- React 19
- TypeScript
- Vite
- CSS design system
- Native HTML drag and drop

### Delivery

- Docker / Docker Compose
- GitHub Actions
- Vercel (dashboard)

## Architecture

```text
React dashboard
      │
      ▼
Fastify HTTP API
      │
      ├── JWT authentication
      ├── Zod validation
      ├── Workspace RBAC
      ├── Domain routes
      │     ├── Workspaces
      │     ├── Projects
      │     └── Tasks
      ├── Audit service
      │
      ▼
Prisma ORM
      │
      ▼
PostgreSQL
```

## Core data model

```text
User
 └── WorkspaceMember ── Workspace
                         └── Project
                              └── Task

User + Workspace ── AuditLog
```

`WorkspaceMember` is the tenant authorization boundary. A user can have a different role in each workspace.

## Dashboard features

- Sign in / registration
- Workspace switcher
- Workspace creation
- Project navigation and creation
- Project metrics
- Four-stage Kanban board
- Task creation with priority
- Drag-and-drop task status updates
- Recent workspace audit trail
- Responsive desktop/mobile UI

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Current authenticated user |
| GET | `/workspaces` | List user's workspaces |
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces/:workspaceId/members` | List workspace members |
| GET | `/workspaces/:workspaceId/activity` | Recent audit activity |
| GET | `/workspaces/:workspaceId/projects` | List projects |
| POST | `/workspaces/:workspaceId/projects` | Create project |
| GET | `/projects/:projectId/tasks` | List tasks |
| POST | `/projects/:projectId/tasks` | Create task |
| PATCH | `/tasks/:taskId` | Update task |

Swagger UI is available at `/docs` when the API is running.

## Local setup

### 1. API and database

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:api
```

API: `http://localhost:4000`  
Docs: `http://localhost:4000/docs`

### 2. Dashboard

```bash
cp web/.env.example web/.env
npm --prefix web install
npm run dev:web
```

Dashboard: `http://localhost:3000`

Demo seed credentials:

```text
demo@workgrid.dev
DemoPass123!
```

> Demo credentials exist only for local seeded development data. Do not use them in production.

## Security choices

- Passwords are hashed with bcrypt.
- JWT access tokens expire after one hour.
- Workspace role checks run server-side before protected operations.
- Task assignees must belong to the same workspace.
- The API is rate limited.
- Request bodies are validated with Zod.
- Database uniqueness constraints protect workspace slugs and project keys.
- Important mutations create audit records tied to actor + workspace.
- CORS origins are environment-controlled.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run build:web
```

## Roadmap

- Refresh-token rotation
- Workspace invitations
- Task comments
- Pagination and filtering
- Optimistic concurrency/version fields
- PostgreSQL integration tests
- Assignee controls in the dashboard
- Production database deployment
- Runtime observability

## What this proves

Workgrid demonstrates:

1. Multi-tenant relational modeling.
2. Authentication vs. authorization separation.
3. Server-side workspace RBAC.
4. API and frontend integration.
5. Auditability and explicit state transitions.
6. Validation and predictable error responses.
7. Containerized local infrastructure.
8. Automated quality-gate design.

---

Built by Mohammed Al-Obaido as a full-stack engineering portfolio project.
