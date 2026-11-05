# Phase 07 — Business Profile connection and review sync

Status: Implemented; real Google API access/consent verification pending

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [x] Implement separate Business Profile OAuth authorization, secure state, encrypted token storage, refresh, disconnect and revocation.
- [x] List accessible profiles and permit one selected location under the initial plan. Model connected Google accounts separately from business locations.
- [x] Queue initial and incremental review synchronization with quota controls, pagination, retry/backoff and deduplication.
- [x] Scope every connection, location and review to its organization. Avoid storing API content beyond the documented policy allowance; implement refresh/deletion jobs.
- [x] Display permission, verification, sync and reconnect statuses without exposing tokens in APIs or logs.

## Acceptance criteria

A real owner can connect one authorized profile and see accurate reviews; refresh, reconnect and tenant isolation are tested.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.

## Implementation handoff — 2026-11-05

Implemented separate Business Profile OAuth with session/browser binding, state/nonce/PKCE and encrypted refresh/access tokens; account/profile discovery; one-profile selection; read-only Google review inbox; periodic BullMQ sync, incremental updates/daily reconciliation, retry/backoff, quota controls, bounded temporary cache and disconnect/revocation retry. Owner overview, Settings and onboarding now use actual connection/cache state rather than sample review data. Reply publishing and AI generation are not included in Phase 7.

API and worker share the `packages/google-business` integration package. Local API/worker encryption/OAuth settings were synchronized without exposing secrets. Register `http://localhost:3000/api/google-business/callback` as an additional authorized redirect URI in the existing Google OAuth web client. Google Business Profile API approval and enabled APIs are still external requirements; live integration acceptance is not yet verified.

Validation already performed: 43 integration/security/crypto tests passed, including an actual isolated BullMQ job; four additional provider transport/OIDC tests passed. Independent visual review passed, with mobile and accessibility checks. Three further regression cases were added but not run; additional test execution was stopped at the user's request. Last source refinements address empty rating query parameters, error-state reconciliation and filtered refresh consistency. Final production build passed. API, web and worker are being restarted with the implemented code.

See [google-business.md](../google-business.md) for setup, API/cache/worker behavior and limitations. Screenshots are stored in `docs/screenshots/phase-07/`.
