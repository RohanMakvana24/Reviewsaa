# Phase 13 — Reports, reminders and owner settings

Status: Not started

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [ ] Add review trends, reply rate, response time, AI usage and QR scan/click reports with documented definitions and data freshness.
- [ ] Implement email/in-app alerts for new reviews, approval needs, connection failures, trial expiry and manual renewal reminders.
- [ ] Add scheduled deduplicated notification jobs, delivery failure handling and notification preferences.
- [ ] Provide business tone/language settings, disconnect, data deletion/account closure and support contact.
- [ ] Keep historical analytics compatible with Google retention restrictions; defer unsupported long-term review content storage and misleading attribution.

## Acceptance criteria

Reports reconcile with available source data and reminders are timely, deduplicated and actionable.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.
