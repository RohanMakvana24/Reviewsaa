# Phase 05 — Authentication and tenant isolation

Status: Implementation verified locally; live Google credential/consent validation pending

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [x] Implement Google sign-in with secure server-side sessions; validate OAuth state and applicable PKCE protections.
- [x] Create users, organizations, owner memberships and a securely provisioned Super Admin role. Never allow public admin self-assignment.
- [x] Enforce role and organization authorization in Express services and every resource query; do not trust browser-supplied organization IDs.
- [x] Implement logout, session expiry, disabled accounts and account settings. Protect cookie-authenticated writes against CSRF.
- [x] Create audit records for sensitive actions and tests proving owners cannot access another organization or admin endpoints.

## Acceptance criteria

Owner and Super Admin login flows work and cross-tenant/role access tests pass.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.

## Implementation handoff — 2026-11-05

Created identity/organization/membership/session/OAuth-attempt/audit tables and applied an additive migration. Implemented Google OIDC with signed-token validation, state/nonce/PKCE and browser binding; hashed opaque sessions, CSRF-protected writes, account settings, logout, tenant-scoped reads/mutations, admin-only endpoints and audited operator provisioning. Next.js pages and layouts validate sessions on the server; Owners cannot switch to Admin. Authentication is dynamic and uncacheable; product review/payment data remains sample content.

Validation: 20 tests passed with a real isolated MySQL database and simulated Google provider, including forged/expired/wrong-audience ID tokens, state replay/concurrency, CSRF, cross-tenant access, admin boundaries, status changes, expiry, cookie properties and logout. TypeScript, lint, formatting and production build passed. Browser checks covered anonymous redirects, Owner/Admin session boundaries, account update persistence and logout; accessibility audits returned zero violations.

See [authentication.md](../authentication.md) for setup, API contracts, test commands and operational limitations. Actual Google login is not live-verified because credentials are not configured. Configure them securely and complete the real consent round trip before marking the external acceptance criterion complete. No Business Profile permissions or AutoPay were added. Existing Prisma/lint development-tool advisories are documented for a separate compatibility upgrade.
