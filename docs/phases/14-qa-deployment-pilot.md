# Phase 14 — QA, deployment and paid pilot launch

Status: Not started

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [ ] Run end-to-end onboarding → profile connect → review sync → AI draft → approved reply → QR scan → manual payment → expiry/renewal.
- [ ] Test authorization, OAuth errors, concurrent usage, webhook replay, refunds, sync limits, upload abuse and worker retries.
- [ ] Configure production domains/TLS, secret management, database migrations, backup/restore drills, monitoring, error alerts and rollback.
- [ ] Load-test realistic active users and job volume; scale based on measured bottlenecks rather than promising 2,000 tenants upfront.
- [ ] Launch with 1–5 consenting local businesses, then 10–50. Record onboarding effort, cost, trial conversion, retention and support load.
- [ ] Obtain live Google/Razorpay readiness, accurate legal/tax setup, and owner sign-off before charging for promised integrations. Keep AutoPay out of launch scope.

## Acceptance criteria

Pilot businesses complete the real flow; essential checks pass, operations are documented, and launch blockers are resolved.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.
