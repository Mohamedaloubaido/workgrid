# Workgrid

A portfolio-grade project management SaaS backend built to demonstrate production-minded full-stack engineering: authentication, PostgreSQL data modeling, role-based authorization, validation, audit logging, API documentation, tests, Docker and CI.

## Why this project exists

Workgrid is intentionally **not** a basic todo app. It models real multi-tenant product concerns:

- Users belong to workspaces with `OWNER`, `ADMIN` or `MEMBER` roles.
- Projects are isolated inside a workspace.
- Tasks belong to projects and can be assigned only to workspace members.
- Permission checks happen server-side.
- Important mutations create audit-log entries.
- Validation and error responses are explicit.
- CI verifies linting, types, tests and builds.

## Stack

- Node.js 22
- Fastify 5
- TypeScript
- PostgreSQL 16
- Prisma ORM
- JWT authentication
- Zod validation
- Swagger / OpenAPI
- Vitest
- Docker
- GitHub Actions

## Architecture

```text
Client
  │
  ▼
Fastify HTTP API
  │
  ├── Authentication (JWT)
  ├── Validation (Zod)
  ├── Authorization (workspace RBAC)
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

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| GET | `/workspaces` | List user's workspaces |
| POST | `/workspaces` | Create workspace |
| GET | `/workspaces/:workspaceId/projects` | List projects |
| POST | `/workspaces/:workspaceId/projects` | Create project |
| GET | `/projects/:projectId/tasks` | List tasks |
| POST | `/projects/:projectId/tasks` | Create task |
| PATCH | `/tasks/:taskId` | Update task |

Swagger UI is available at `/docs`.

## Local setup

```bash
cp .env.example .env
docker compose up -d postgres
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

API: `http://localhost:4000`  
Docs: `http://localhost:4000/docs`

Demo seed credentials:

```text
demo@workgrid.dev
DemoPass123!
```

> The demo credential is only for local seeded development data. Do not use it in production.

## Security choices

- Passwords are hashed with bcrypt.
- JWTs expire after one hour.
- Workspace membership and minimum role are checked server-side.
- Task assignees must belong to the same workspace.
- The API is rate limited.
- Request bodies are validated.
- Unique database constraints protect workspace slugs and project keys.
- Mutating domain operations produce audit records.

## CI

Every push and pull request runs:

```text
install
→ Prisma generate
→ database schema setup
→ lint
→ typecheck
→ tests
→ build
```

## Roadmap

- Refresh-token rotation
- Workspace invitations
- Task comments
- Pagination and filtering
- Optimistic concurrency/version fields
- Integration tests against PostgreSQL
- React/Next.js dashboard
- Deployment and observability

## Portfolio talking points

This project demonstrates:

1. Multi-tenant relational data modeling.
2. Authentication vs. authorization separation.
3. RBAC with explicit server-side checks.
4. Transaction-safe product boundaries.
5. Validation and predictable errors.
6. Auditability.
7. Automated quality gates.
8. Containerized local infrastructure.

---

Built by Mohammed Al-Obaido as a full-stack engineering portfolio project.
