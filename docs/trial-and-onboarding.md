# Phase 6 — Public website, trial and onboarding

## Public website

Public routes: `/`, `/features`, `/pricing`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refund-policy`. Marketing routes explicitly allow indexing with unique canonical metadata. The default root metadata remains noindex for login, onboarding and private dashboards. `robots.txt` disallows private areas; `sitemap.xml` contains only the public allowlist. Authorization remains enforced independently of robots.

Set `SITE_URL` in the web environment before production build to the actual canonical origin. The local default is `http://localhost:3000`; no production domain is assumed. Homepage/pricing revalidate the public offer every 60 seconds. A configuration outage shows clearly provisional offer details rather than claiming a live integration.

Contact submissions are stored in MySQL and visible at `/admin/inquiries` only to Super Admin. Validation, honeypot and rate limiting apply. No email is sent. Prelaunch privacy/terms/refund pages describe current functionality and must be finalized with operating-entity and paid-service details before payments launch.

## Trial policy

- A fourteen-day trial starts at first workspace creation in the same provisioning transaction.
- Start/end are persisted once and never exposed as writable account/onboarding fields.
- One trial per Google subject and normalized verified email, tracked by unique SHA-256 eligibility claims. These are personal-data-related hashes, not fully anonymous records.
- Trial eligibility records deliberately have no cascading user/workspace foreign key, so deleting/recreating an identity does not silently restore eligibility. Account deletion workflows must handle retention requests explicitly.
- Existing organizations are backfilled from their original creation dates, not deployment time; the initial migration uses the agreed default allowance of 20.
- `TRIAL_AI_ALLOWANCE` configures the allowance for new trials, default 20. Existing grants keep their recorded allowance and usage.
- `BASIC_MONTHLY_PRICE_INR=99` and `PAID_AI_ALLOWANCE=30` configure proposed public offer details. No paid entitlements or checkout are granted by this phase.
- Status is computed server-side as ACTIVE, EXPIRED, EXHAUSTED or UNAVAILABLE. Expired trials have zero available generations. UI shows exact IST expiry and server-derived remaining days and refreshes active status every minute/on tab visibility.
- No card/payment is required; no automatic charge, renewal mandate or AutoPay is created.

## Usage enforcement

`apps/api/src/product/trial.ts` exports the internal `reserveTrialGeneration` service for the future AI job path. There is no public pretend AI/usage endpoint. The service verifies active membership/account/workspace, atomically checks dates and quota and records an idempotent reservation. Concurrent requests cannot exceed the cap. Duplicate keys return `alreadyReserved=true`; a future worker must not invoke an AI provider again for that reservation. Expired/exhausted/ineligible workspaces are rejected before expensive generation. Paid usage, provider failures/refunds and actual AI jobs remain future-phase work.

## Onboarding

New owner callbacks go to `/onboarding` until business details and appearance drafts are saved. Available steps:

1. Save business name, category, city and optional phone.
2. View the Google connection explanation; actual connection is blocked pending its integration phase.
3. View the profile-selection explanation; no invented or unauthorized profile is selected.
4. Save greeting and accent-color appearance draft, then continue to dashboard.

Google and location steps always remain `blocked`; saving drafts produces `AWAITING_GOOGLE`, not a claim of a completed live integration. No public QR page/code is generated or published here. Actual connection, location discovery and QR publishing must be implemented in their own phases. Owners can still edit safe setup fields after trial expiry without restarting the trial.

## API additions

Browser paths use `/api` prefix; Express paths below omit it.

| Method | Path | Purpose |
|---|---|---|
| GET | `/public/config` | Proposed price, allowances, duration and honest integration flags |
| POST | `/public/contact` | Validate/store inquiry; returns 202 only on receipt or honeypot handling |
| GET | `/organizations/:id/onboarding` | Authenticated membership-scoped workspace/trial/onboarding summary |
| PATCH | `/organizations/:id/onboarding` | CSRF-protected business or appearance draft save |
| GET | `/admin/contact-inquiries` | Super Admin inbox, latest 50 requests |

Onboarding bodies are a strict discriminated union: business `{step,name,category,city,phone}` or QR `{step,greeting,accentColor}`. Unknown completion/trial fields are rejected. Google completion cannot be set by a browser. Writes authorize the actual organization in SQL and produce audit records. Contact data is not included in request logs.

## Verification and limitations

29 tests pass against the isolated `reviesnest_auth_test` database with simulated Google identity and separate signed-token tests. Added checks cover fourteen-day allocation, relogin immutability, identity/email reuse, strict tenant/CSRF boundaries, pending Google steps, expiry, concurrent quota exhaustion, idempotent retry, configuration snapshots and admin-only inquiry access.

Browser checks covered business/QR draft persistence, actual trial display, expired state with zero availability, real contact save followed by Admin inbox visibility, responsive 375px layouts and protected access. Onboarding and expired billing accessibility audits report zero violations. Independent public design evaluation passed after fixing mobile header overflow and star semantics; public pricing/contact audits passed. Homepage has no definite violations; one decorative contrast check required manual review. Screenshots are in `docs/screenshots/phase-06/`.

Google Business Profile, AI generation and paid checkout remain unavailable and clearly labelled. Real Google consent acceptance remains separate from simulated-provider testing. Do not mark blocked integration steps complete or claim those features live based on this phase.

Contact rate limiting is per-process; deployment must explicitly plan trusted proxy/client-IP handling and a shared limiter before operating multiple instances. Pricing, paid tax/refund/entity details and a production domain remain deployment/business decisions.
