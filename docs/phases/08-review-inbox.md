# Phase 08 — Review inbox and manual replies

Status: Not started

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [ ] Build paginated review lists with rating/date/reply filters, permitted search and review detail.
- [ ] Show reviewer content, rating, timestamps and current owner reply under approved retention rules.
- [ ] Implement draft/edit/approve/publish/update reply flows through Express with explicit owner authorization.
- [ ] Persist publication status and audit metadata, handle API failures visibly, and prevent duplicate/outdated jobs from overwriting newer replies.
- [ ] Compute honest review count, average rating and unanswered metrics for the available dataset with freshness labels.

## Acceptance criteria

An owner can publish and update a real reply, see its result, and safely recover from API failure.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.
