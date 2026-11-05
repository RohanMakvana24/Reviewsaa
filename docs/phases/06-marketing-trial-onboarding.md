# Phase 06 — Marketing, trial and onboarding

Status: Implemented and verified; Google/profile steps explicitly blocked until their integration phase

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [x] Build public homepage, features, pricing, FAQs, contact, privacy, terms and refund/cancellation pages.
- [x] Add page metadata, canonical URLs, sitemap, robots rules and fast responsive rendering. Keep private dashboards out of indexing.
- [x] On first organization creation, start a server-enforced 14-day trial and record its immutable start/end times.
- [x] Implement configurable trial limits, countdown, expired-trial state and protections against trivial repeat trials; never silently charge after trial.
- [x] Guide owners through business details, Google connection, profile selection and QR setup. Explain exactly which features are live.

## Acceptance criteria

A new owner can start a trial without payment, complete onboarding, and see accurate server-derived expiry and usage.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.

## Implementation handoff — 2026-11-05

Implemented public marketing/features/pricing/FAQ/contact and prelaunch policy pages, canonical metadata/sitemap/robots, real contact persistence with an admin-only inquiry inbox, trial grants/eligibility claims, atomic usage reservation service and authenticated onboarding. New-owner callback directs to setup; actual trial dates/counts replace sample trial fields in dashboards.

Applied additive migration `202611050003_trials_onboarding`, including legacy grants based on original workspace dates. Trial is fixed fourteen days; allowances are configured for new grants only. No public trial reset or pretend AI endpoint exists. Business and QR appearance drafts save while Google connection/profile selection stay blocked. Checkout and AutoPay remain absent.

Validation: 29 isolated-MySQL/security/crypto tests passed; workspace type checks, lint, formatting and production build passed. Browser flow verified business/QR persistence, trial expiry and contact→Admin inbox. Independent visual review passed; mobile overflow/ARIA/main-landmark/duplicate-status issues fixed. Public pages index correctly and private routes retain noindex.

See [trial-and-onboarding.md](../trial-and-onboarding.md) for API contracts, eligibility retention, usage-service integration requirements and remaining deployment decisions. The available onboarding steps are complete; actual Google/profile/QR publishing acceptance depends on later phases and is never represented as live here.
