# Phase 02 — Google integration feasibility

Status: Not started

## Dependencies

Phase 01 scope decisions. Google feasibility should begin early; independent UI work may continue while approval is pending.

## Implementation checklist

- [ ] Create the Google Cloud project and request Business Profile API access before depending on live integrations.
- [ ] Configure OAuth consent, redirect URLs, required business.manage scope, test users, and applicable verification requirements. Login consent and Business Profile connection are distinct.
- [ ] Test a real authorized verified location: list accounts and locations, fetch reviews, and publish/update an owner-approved reply.
- [ ] Exercise token refresh, revoked permissions, missing locations, unverified location, and 401/403/429 responses.
- [ ] Review current Google policies for commercial SaaS, explicit reply authorization, automation, AI processing, and storage/retention; document constraints before designing persistence.
- [ ] If approval is pending, label mocks clearly and continue independent UI work. If unavailable, decide on a QR-only fallback without claiming live Google management.

## Acceptance criteria

Document a successful real review fetch and approved reply, or an explicit integration blocker/fallback. Never assume approval.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.
