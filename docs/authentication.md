# Authentication and tenant access — Phase 5

The application now enforces server-side account sessions. `/dashboard` requires an active account; `/admin` additionally requires the `SUPER_ADMIN` platform role. Dashboard review/payment metrics are still explicitly sample data. Business Profile authorization remains separate from sign-in.

## Google configuration

In the ignored `apps/api/.env`, configure these three values together:

```dotenv
GOOGLE_CLIENT_ID=your-web-client-id
GOOGLE_CLIENT_SECRET=your-web-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

Use a Google OAuth web application client, configure the consent screen and eligible test users while in testing, and register the exact callback URI. Restart the API after configuration. Never send credentials in chat or commit them. The server fails startup for a partial or mismatched configuration. Without credentials, `/login` honestly disables Google sign-in.

The login flow follows [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect) and the [web-server authorization flow](https://developers.google.com/identity/protocols/oauth2/web-server). It requests only `openid email profile`; it does not request Business Profile scope, store Google access/refresh tokens, fetch reviews or enable auto-replies.

`WEB_ORIGIN` in API configuration is the exact canonical frontend origin (default `http://localhost:3000`, no trailing slash). `API_INTERNAL_URL` in `apps/web/.env.local` is the private API origin (default `http://127.0.0.1:4000`). Browser requests use same-origin `/api/*`, rewritten to Express. Change the internal origin before building; rewrites are generated during the build. Restart/rebuild the frontend when that configuration changes. Keep the API internal in deployment.

## Sessions and OAuth protection

- Random opaque 256-bit session IDs; only SHA-256 hashes are stored in MySQL. Sessions have a seven-day absolute lifetime.
- HttpOnly, SameSite=Lax, root-path, host-only cookies. `NODE_ENV=production` on the API enforces HTTPS `WEB_ORIGIN` and Secure `__Host-` cookies. Do not deploy with development mode.
- Google authorization uses random state and nonce plus S256 PKCE. The ten-minute attempt is browser-bound and consumed atomically; replay cannot mint another session.
- ID tokens are verified against Google's signing keys, issuer, audience, expiry, required claims, nonce, authorized-party claim when present, and verified email. Google `sub` is the stable identity key; email never links accounts automatically.
- New users become Owners with one organization and Owner membership in a transaction. A browser cannot choose its role.
- Authentication re-reads user status and role on every API request. Disabled, expired or revoked sessions fail. Logout revokes the current session; admin disable revokes all target sessions.
- Cookie-authenticated writes require exact `Origin` and the session-bound `X-CSRF-Token` from `/auth/me`. CORS is not authorization.
- OAuth initiation/callback have per-process rate limiting. A shared limiter and explicit trusted-proxy configuration should be chosen before a multi-instance deployment; never blindly trust forwarded client IPs.
- Completed OAuth attempts are consumed; expired attempts are pruned on subsequent login starts, and expired sessions on successful login. Audit history does not contain raw cookies, OAuth codes or tokens.

## API contract

Paths below are Express paths; use `/api` prefix from the frontend.

| Method | Path | Access |
|---|---|---|
| GET | `/auth/config` | Public; returns only `googleConfigured` |
| GET | `/auth/google` | Start Google login |
| GET | `/auth/google/callback` | Browser-bound callback |
| GET | `/auth/me` | Active session; safe user/organization summary and CSRF token |
| POST | `/auth/logout` | Active session + CSRF; revoke current session |
| PATCH | `/auth/account` | Active session + CSRF; `{ "name": "..." }` only |
| GET | `/organizations/:organizationId` | Active membership in that active organization |
| PATCH | `/organizations/:organizationId` | Same membership + CSRF; name only |
| GET | `/admin/organizations` | Super Admin; first 50 organization summaries |
| PATCH | `/admin/users/:userId/status` | Super Admin + CSRF; ACTIVE/DISABLED, cannot target self |

Foreign/missing/suspended tenant resources return the same 404. SQL predicates scope reads and mutations by authenticated membership; client-supplied IDs do not establish ownership. All future review, billing and asset queries must follow this pattern. Admin platform role does not automatically grant membership in an owner's organization.

## Provisioning Super Admin

Sign in normally first. An operator with trusted server/database access finds the intended existing user ID, verifies its identity, and runs from the API environment:

```sh
npm run admin:provision -w @reviesnest/api -- EXISTING_USER_ID
```

The command promotes that existing active user, revokes their sessions and appends an operator audit event. They must sign in again. No public endpoint can promote users. Do not provision users based on a public signup parameter or an unverified email allowlist.

## Verification

```sh
npm run infra:up
# Create the isolated test database and grant local test credentials access:
docker compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -u root' <<'SQL'
CREATE DATABASE IF NOT EXISTS reviesnest_auth_test;
GRANT ALL ON reviesnest_auth_test.* TO 'reviesnest'@'%';
SQL
DATABASE_URL='mysql://reviesnest:local-dev-only@127.0.0.1:13307/reviesnest_auth_test' npm run db:deploy
AUTH_TEST_DATABASE_URL='mysql://reviesnest:local-dev-only@127.0.0.1:13307/reviesnest_auth_test' npm test
```

The integration suite clears only `reviesnest_auth_test` and refuses any other database name. It uses actual MySQL and a simulated Google provider; separate cryptographic tests verify valid and invalid signed ID tokens. Without `AUTH_TEST_DATABASE_URL`, integration tests are skipped; CI explicitly provisions that isolated database and runs them.

Local results: 20 tests passed, zero skipped with the test URL set. Browser checks with isolated test-database sessions verified Owner access, denied Owner→Admin navigation, Admin access, persisted account-name update and logout. Anonymous production preview redirects to login. Login/settings/admin accessibility audits returned zero violations.

**Pending external validation:** a real Google consent round trip with configured credentials has not been performed. Do not describe that integration as live-verified until a real account completes it. The implementation contains no fake-login or development-role bypass endpoint.

Dependency audit also reports advisories in the pre-existing Prisma 6 CLI/config toolchain (Effect/Deepmerge) and lint toolchain. Those development dependency upgrades need a separate compatibility pass before production release; the authentication implementation does not use those libraries at request time.
