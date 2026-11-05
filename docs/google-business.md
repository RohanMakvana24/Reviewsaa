# Google Business Profile integration — Phase 7

## Enable locally

Google login remains separate from Business Profile authorization. The existing OAuth web client is reused, requesting `openid` and `https://www.googleapis.com/auth/business.manage` only when the Owner explicitly connects a business.

Add this authorized redirect URI in Google Cloud:

```text
http://localhost:3000/api/google-business/callback
```

For deployment, use the canonical HTTPS frontend origin. API `GOOGLE_BUSINESS_REDIRECT_URI` must equal `WEB_ORIGIN/api/google-business/callback`. Enable the relevant Account Management, Business Information and Google My Business review APIs and obtain required project access. OAuth consent/test-user/verification requirements also apply. Authorization and API approval are distinct; approval/permission errors are surfaced without fabricating reviews.

API and worker need the same Google client credentials and `TOKEN_ENCRYPTION_KEY` (32 random bytes encoded as base64). These local settings are already stored in ignored, permission-restricted environment files. Do not print, commit, regenerate or lose the key: existing encrypted tokens depend on it. Use a secret manager in production. Run database migrations/generation before starting services.

## Owner flow

Settings or onboarding → Connect Google Business Profile → Google consent → load accounts → load profiles → select one profile → initial sync. Review inbox is read-only in this phase, including any existing Google owner replies. Profile replacement requires clearing the current selection; different Google identities require disconnect first. Trial dates do not reset.

## Security and revocation

OAuth attempts expire after ten minutes and bind to the initiating app session, user, organization, browser cookie and connection revision. Credentials use AES-256-GCM with tenant/connection/field authenticated context. No raw token is returned to clients, logs or job payloads. Membership checks and CSRF protect actions. Refresh/reconnect/disconnect revisions and SQL locks stop late work from restoring removed credentials/content.

Disconnect immediately clears selected profiles and cached reviews. Failed remote revocation retains only an encrypted revocation token, blocks reconnect, and retries through the worker or Owner action. Google token expiry/revocation yields a reconnect state rather than expiring the application's own login.

## Cache and jobs

`google-business` BullMQ jobs contain only organization ID, internal location ID and connection revision. Worker concurrency is two with exponential retries; a shared Redis request budget limits Google calls to sixty per minute. Maintenance runs each minute, removes expired content, retries revocations and schedules eligible selected profiles approximately every fifteen minutes.

Sync orders by Google update time, overlaps incremental windows and performs full reconciliation daily. Cache is capped at 500 current reviews; larger Google histories are explicitly marked partial. Google-supplied totals/average are displayed unchanged rather than calculated from a limited cache. Content is cached for seven days, filtered from responses at expiry and physically removed by maintenance; discovery candidates expire after ten minutes. Operate/monitor cleanup and keep backups within applicable retention limits. No sentiment or long-term review aggregates are implemented.

API access denial, missing permission, unverified profiles, refresh failure, rate limiting, queue failure and temporary provider errors have separate safe states. Review publishing, AI calls, billing and AutoPay remain outside this phase.

## API routes

All org routes below use `/api/organizations/:id/google-business` from the browser and require active organization membership. Writes require Origin and session CSRF token.

- GET base: safe connection/profile/sync status.
- POST `/connect`: authorization URL; callback `/api/google-business/callback`.
- GET `/accounts`, GET `/locations?accountName=...&pageToken=...`: explicit discovery; selection uses an expiring server candidate ID.
- POST `/location` with `{candidateId}`: one-profile selection and initial sync.
- DELETE `/location`: clear selected profile/cache without revoking Google authorization.
- POST `/sync`: queue sync, with cooldown and truthful queue failures.
- POST `/disconnect`, POST `/revoke-retry`: local removal and remote permission release.
- GET `/reviews?page=1&query=...&rating=1..5&reply=all|replied|unanswered`: paginated limited cache. Omit rating for all ratings.

## Validation and remaining work

43 earlier integration/security/crypto tests and four provider/OIDC transport tests passed. Tests use real isolated MySQL/Redis and simulated Google, not a live consenting business. Independent UI evaluation passed. Three newer regression tests were written but not executed because the user requested no further testing. Real Google consent, project approval and a verified profile fetch remain unverified external acceptance criteria.

Official references: [OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [location discovery](https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list), [reviews API](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list), [Business Profile policies](https://developers.google.com/my-business/content/policies).
