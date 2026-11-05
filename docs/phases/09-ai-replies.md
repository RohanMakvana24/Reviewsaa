# Phase 09 — AI drafts and controlled automation

Status: Not started

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [ ] Implement a Gemini provider interface, versioned prompts and configurable model/token limits; treat review text as untrusted input.
- [ ] Generate concise contextual drafts using business tone and language, without fabricated facts, private information or promises.
- [ ] Count trial and paid AI generations server-side, including regenerations; apply rate limits, atomic usage accounting and spend monitoring.
- [ ] Default to AI draft → owner approval → publication. Hold negative, sensitive or uncertain content for human review.
- [ ] Enable automatic replies only after Google policy feasibility is confirmed and specific explicit owner consent, scoped rules, a stop switch, audit logs and duplicate prevention are implemented. Otherwise keep this deferred.
- [ ] Test prompt injection, empty/rating-only reviews, provider failure, quota exhaustion and concurrent generation.

## Acceptance criteria

Useful drafts and enforced limits work; no unapproved public AI reply is posted. Automation remains off unless its separate requirements are satisfied.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.
