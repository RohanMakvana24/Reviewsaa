# Phase 04 — Design system and template migration

Status: Implemented; verified locally and ready for review

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [x] Port useful React components and layouts from review/template into Next.js; replace Vite/TanStack Router-specific routing and environment usage.
- [x] Retain the MIT copyright/license notice for reused code. Remove demo branding and unused chat/tasks features.
- [x] Create shared color, spacing and typography tokens, buttons, forms, tables, dialogs, loading states and notifications.
- [x] Build separate Owner and Super Admin navigation, responsive sidebar, light/dark mode and accessible keyboard navigation.
- [x] Create empty/error/loading states and mobile layouts; do not present demo numbers as real customer analytics.

## Acceptance criteria

Both dashboard shells work in Next.js on mobile and desktop with consistent styling and accessible navigation.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.

## Implementation handoff — 2026-11-05

### Delivered

- `apps/web/components/ui`: shadcn-admin button, badge, card, input, table, sheet, dialog and skeleton components adapted to Next.js, with attribution in `apps/web/SHADCN_ADMIN_LICENSE`.
- Tailwind v4/PostCSS setup, shared color and typography tokens, persisted light/dark theme, responsive Owner/Admin navigation and accessible mobile drawer.
- Owner routes: `/dashboard`, `/dashboard/reviews`, `/dashboard/ai-replies`, `/dashboard/qr-page`, `/dashboard/plan`, `/dashboard/settings`.
- Admin routes: `/admin`, `/admin/clients`, `/admin/plans`, `/admin/payments`, `/admin/system-health`.
- Review/client search and filters, reply preview dialog, local settings persistence, notification feedback, loading skeletons, error recovery and 404.
- Development sample labels, unconnected integration states, disabled real publish/payment/QR-download actions and noindex metadata. No AutoPay.

### Validation

Workspace TypeScript, ESLint, formatting, production build and existing three API tests passed. All eleven Owner/Admin routes returned HTTP 200 with noindex. Browser checks covered search/no-results, rating/status filters, reply dialog Escape, dark theme persistence, local preferences persistence, and mobile 375px drawer/focus return with no document overflow. Owner overview axe audit reported zero violations after fixing rating semantics and disclaimer landmark. Sample trend values now match the 18-new-reviews metric. Independent visual evaluation passed; provider-diverse evaluation was unavailable.

### Remaining boundaries

These are public development previews, not authenticated dashboards. Role switching does not provide authorization. Phase 5 must implement real authentication and server-enforced tenant/role access. Google feasibility is still open. QR editing is an appearance preview, not a published page or generated code; AI and payment integrations remain deferred to their own phases. Sample metrics are not live API data. No claims of production authentication, billing or integration readiness are made.

Final fresh visual review: PASS. Owner light and Admin dark accessibility audits both reported zero violations. Desktop, tablet, mobile and dark-mode screenshots are stored in `docs/screenshots/phase-04/`. Production previews at http://localhost:3000/dashboard and http://localhost:3000/admin returned HTTP 200 after the final rebuild.
