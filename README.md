# Reviewsaa

Working application brand: ReviesNest.

Development foundation for a local-business review SaaS. Brand spelling is provisional. Server-side Google sign-in/session and tenant authorization are implemented; deployment-specific OAuth credentials and a real consent test are required. Business Profile, AI and payment integrations are not connected. AutoPay is excluded.

## Requirements and setup

Node.js 24 LTS, npm 11 and Docker Compose. Run commands from this directory. The cloned `template/` is an independent UI reference and is excluded from workspaces.

```sh
npm ci
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env.local
cp packages/database/.env.example packages/database/.env
npm run infra:up
npm run db:generate
npm run db:deploy
npm run dev
```

Local ports: web 3000, API 4000, MySQL 13307, Redis 16380. Docker publishes infrastructure to localhost only. Compose credentials are local-development examples; never reuse them in production. `infra:down` stops services while preserving MySQL volume data.

## Verification

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
curl http://localhost:4000/health/live
curl http://localhost:4000/health/ready
```

Readiness checks MySQL and Redis. Worker logs a scheduled heartbeat as proof of queue processing. It does not process business jobs yet.

## Boundaries

- `apps/web`: Next.js frontend with Owner and Super Admin dashboard previews; sample data only.
- `apps/api`: Express, restricted browser CORS, request IDs, safe errors, health probes.
- `apps/worker`: BullMQ infrastructure heartbeat with graceful shutdown.
- `packages/contracts`: Zod contracts, compiled before consumers.
- `packages/database`: Prisma schema and migrations for identity, organizations, memberships, sessions and audit records; review/billing models arrive later.
- `docs/phases`: implementation backlog and acceptance criteria.

Authentication uses server-side sessions, role checks and tenant-scoped APIs. See [authentication setup and verification](docs/authentication.md) for Google configuration, admin provisioning, cookie/CSRF protection and the isolated MySQL test suite. Configure proxy trust only for an explicitly trusted deployment proxy.

Google API approval and real-profile feasibility remain external prerequisites. Secrets must stay in ignored environment files. Payment will use Razorpay one-time checkout and manual renewals only.

## Dashboard preview (Phase 4)

Owner workspace: `/dashboard` (login required). Super Admin workspace: `/admin` (server-verified admin role required). `/login` starts Google sign-in when configured. All review/client/payment data is sample content. Google, AI generation and checkout are not connected. No AutoPay is enabled.

UI primitives are adapted from the MIT-licensed shadcn-admin reference. Attribution is retained in `apps/web/SHADCN_ADMIN_LICENSE`. The original `template/` remains separate from application workspaces.

Run `npm run dev` for development. After a production build, start web with `npm run start -w @reviesnest/web`. Restart production servers after rebuilding to avoid serving stale assets.

## Public website, trial and onboarding (Phase 6)

The homepage is now the public marketing site. Pricing, features, FAQ, contact and prelaunch policy pages are included. Private workspaces still require login. New owners are guided through `/onboarding`; business details and page-appearance drafts persist while Google/profile selection remains explicitly blocked.

Trials start once at first workspace creation and expire after fourteen days. Allowances, usage and expiry are server-derived; no automatic charge occurs. Contact submissions appear in the real Super Admin inbox at `/admin/inquiries`.

See [trial/onboarding implementation](docs/trial-and-onboarding.md) for API contracts, configuration, migration and security checks. Set `SITE_URL` to the real canonical frontend origin before a production build. Current proposed Basic offer remains ₹99/month; payments, Business Profile sync, AI jobs and published QR pages are future phases.

## Google Business Profile (Phase 7)

Owner Settings/onboarding now includes Google Business Profile connection and one-profile selection. Review inbox and overview use real authorized cached data, with truthful empty/error states. The API/worker share `packages/google-business`; start the worker for sync, reconciliation and retention cleanup. Reply publishing/AI remain future phases.

See [Google Business setup](docs/google-business.md) for the additional OAuth callback, project access, encrypted token settings and pending live verification. No Google project approval is assumed.
