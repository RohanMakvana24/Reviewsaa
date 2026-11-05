# Phase 12 — Super Admin operations

Status: Not started

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [ ] Build tenant search/detail, trial and paid status, connected-profile health, AI usage, payment history and integration failure views.
- [ ] Allow audited plan management, suspension/reactivation and controlled support actions with reason fields.
- [ ] Protect admin endpoints and sensitive data; never display raw OAuth secrets or allow arbitrary payment-success editing.
- [ ] Expose job retry tools with idempotency, operational health and configurable plan limits. Log who changed what and when.
- [ ] Define suspension separately from billing expiry and handle public QR availability consistently.

## Acceptance criteria

Only Super Admin can perform platform actions, every sensitive change is logged, and owner isolation remains intact.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.
