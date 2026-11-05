# Phase 03 — Repository and infrastructure foundation

Status: Implemented foundation; ready for review

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [x] Create apps/web (Next.js), apps/api (Express), apps/worker (BullMQ), and shared packages for validated contracts and configuration. Keep the cloned template as reference.
- [x] Configure TypeScript, linting, formatting, environment examples, lockfile, and local MySQL/Redis services.
- [x] Initialize Prisma migrations, database connectivity, API health checks, centralized validation/errors, structured logging, and request IDs.
- [x] Set up local frontend/backend URLs, restricted CORS, secure cookie strategy, and development instructions.
- [x] Add CI for type checking, linting, build, and meaningful tests. Never commit credentials or real customer data.

## Acceptance criteria

A clean checkout runs locally with documented commands; API, database, worker and frontend health are verifiable.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.

## Implementation handoff — 2026-11-05

Created npm workspaces for Next.js web, Express API, BullMQ worker, shared Zod contracts and Prisma/MySQL. Docker Compose uses localhost MySQL port 13307 and Redis port 16380 to avoid existing local service ports. The template remains an independent reference.

Validation: dependency installation, Prisma generation and initial migration, TypeScript checks, ESLint, three API tests, and production builds passed. Live API readiness returned 200 with real MySQL/Redis connections; worker processed an infrastructure heartbeat. Web is a development placeholder, not the designed product.

Session cookies/CSRF behavior is documented as a required authentication-phase boundary; actual login and protected business endpoints are not implemented. CI configuration is present but has not run on a remote CI service. Google approval/feasibility, branding confirmation and later product phases remain open. No AutoPay, real reviews, AI calls or payment integration is implemented.
