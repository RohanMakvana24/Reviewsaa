# Implementation phases

These phase files capture the latest conversation decisions and supersede conflicting proposals in ../master-plan.md. They are a backlog, not completed implementation.

## Agreed direction

- Frontend: Next.js + TypeScript, using the cloned shadcn-admin UI as a reference. It is currently Vite/TanStack Router, so components need migration.
- Backend: Express + TypeScript. Database: MySQL + Prisma. Background jobs: Redis + BullMQ.
- Roles: Super Admin and Business Owner; public QR visitors need no login.
- Trial: 14 days, no automatic charge afterward.
- Billing: Razorpay one-time payments and manual renewal only. AutoPay and recurring mandates are deferred.
- Latest proposed entry price: ₹99/month. Initial proposed limits: one Google Business Profile and 30 AI generations/month; trial allowance: 20 total. Keep these configurable, and confirm before selling. No annual offer is finalized.
- Latest user-entered brand: ReviesNest; confirm spelling before buying a domain or finalizing public branding.
- AI drafts and approved publishing are baseline. Automated public replies require separate policy validation and explicit authorization.

## Execution order

Start scope and Google feasibility first. Pending external approvals may run alongside foundation and UI development. Do not ship a Google-dependent paid feature until the real integration passes its feasibility gate. Each dependent phase requires review of the previous work. Credentials belong in secure configuration, never in docs.

## Phase index

1. [Phase 01 — Product scope and brand](01-product-scope.md)
2. [Phase 02 — Google integration feasibility](02-google-feasibility.md)
3. [Phase 03 — Repository and infrastructure foundation](03-foundation.md)
4. [Phase 04 — Design system and template migration](04-design-and-template.md)
5. [Phase 05 — Authentication and tenant isolation](05-identity-tenancy.md)
6. [Phase 06 — Marketing, trial and onboarding](06-marketing-trial-onboarding.md)
7. [Phase 07 — Business Profile connection and review sync](07-google-connection-sync.md)
8. [Phase 08 — Review inbox and manual replies](08-review-inbox.md)
9. [Phase 09 — AI drafts and controlled automation](09-ai-replies.md)
10. [Phase 10 — QR codes and public business pages](10-qr-public-pages.md)
11. [Phase 11 — Razorpay manual payments and entitlements](11-razorpay-manual-payments.md)
12. [Phase 12 — Super Admin operations](12-super-admin.md)
13. [Phase 13 — Reports, reminders and owner settings](13-reports-notifications.md)
14. [Phase 14 — QA, deployment and paid pilot launch](14-qa-deployment-pilot.md)

## Deferred work

AutoPay, staff permissions, advanced drag-and-drop builder, multi-branch pricing, deep analytics and agency integrations require separate future scope. Multiple Google locations can be supported by the data model without granting them in the initial plan.
