> **Latest implementation decisions:** See [phases/README.md](phases/README.md) for the current phased backlog. It takes precedence over conflicting proposals below: Next.js frontend, Express backend, MySQL + Prisma, Super Admin and Business Owner, 14-day trial, and Razorpay one-time payments/manual renewal. **AutoPay is deferred.** Latest proposed entry pricing is ₹99/month; branding spelling and final allowances must be confirmed before launch. The original blueprint below is retained as reference.

AI REVIEW SAAS

Product & Engineering Master Blueprint

Working brand: Revynq (not finalized)  |  Version 1.0  |  November 2026

Purpose: A copy-ready product requirements document for an AI coding assistant, product designer, backend developer, and founding team. Proposed decisions are distinguished from external dependencies.

1. Executive Vision

Build a multi-tenant, affordable, subscription-based reputation management SaaS for salons, gyms, restaurants, cafes, hotels, clinics and other local businesses. Each business connects an authorized Google Business Profile, views reviews, replies manually or with AI assistance, and creates a fully branded mobile landing page accessible through a stable QR code.

Core promise: one dashboard for business reputation, one customizable QR destination for customers, and safe AI-assisted responses. Initial target: 1–5 pilot businesses; then 10–50; architecture designed to scale toward 1,000+ tenants, subject to API quotas, approvals, security and infrastructure capacity.

2. Product Principles and Non-Negotiable Rules

Real reviews only. Never generate fake testimonials, impersonate customers, offer incentives conditional on positive reviews, or suppress negative feedback.

Customer-facing QR pages must offer a neutral and equally accessible Google review path regardless of rating or sentiment. Do not use review gating.

Customers must submit Google reviews themselves. The product cannot submit a customer review via the business-owner API.

AI may help customers organize their own genuine feedback, but avoid pushing AI-written, fabricated or templated public reviews; prefer direct Google review links.

Google Sign-In alone does not grant Business Profile access. Separate OAuth authorization, appropriate scopes, verified/eligible profiles, and API approval are required.

Business replies may be drafted and, where authorized and supported, posted through Google Business Profile review reply APIs. Require explicit client opt-in for auto-posting.

Google Business Profile API eligibility, commercial SaaS permissions, quota and applicable policy restrictions must be confirmed before promising a paid integration.

Protect OAuth tokens using encryption, least privilege, access logs, revocation, and tenant isolation.

3. Roles and Permissions

Role

Main access

Platform Super Admin

Manage tenants, plans, billing, usage, support, moderation and audit logs

Business Owner

Manage organization, connected Google accounts, locations, QR pages, subscriptions, reply rules

Business Staff

Assigned location reviews and replies; no billing or token access unless granted

Customer / QR Visitor

Public branded page; optional feedback; direct Google review link; no login required

4. End-to-End Journeys

4.1 Business onboarding

Sign in using Google OAuth / OpenID Connect; create organization and membership.

Choose plan and duration (1, 3, 6, or 12 months), complete checkout, verify payment via signed webhook.

Connect Google Business Profile with separate consent and required scope; handle access denial and unverified/no-location states.

Select managed business location(s); sync available review data; configure AI reply settings.

Upload logo/cover, customize page widgets, publish QR page, download print-ready QR asset.

4.2 Customer QR scan

Scan stable QR pointing to https://example.com/r/{publicSlug} or immutable QR identifier.

Load only published tenant-specific page configuration, optimized for mobile and accessibility.

Show logo, cover, business name, greeting, optional star rating/feedback and a clear Google Review button.

Offer Google review link equally to all visitors; do not selectively redirect based on stars.

If a feedback form is included, clearly disclose whether it is private business feedback; do not represent it as a published Google review.

Track privacy-conscious QR scans and button clicks; do not claim a scan equals a completed Google review.

4.3 Review management and AI

Sync reviews with Google API under quotas; store external IDs, rating, text, timestamps and reply status.

Business staff can filter, search, draft, edit, approve, publish or update owner replies.

Gemini generates context-aware, non-defensive, non-repetitive drafts using approved business tone.

Default automation: 4–5 star replies may auto-post only after explicit opt-in; 1–3 star, safety, legal and sensitive content require human approval.

Idempotent background jobs, retry/backoff, rate limits, duplicate prevention and an audit trail for each publication.

5. Modules and Detailed Requirements

Marketing Website

Homepage, features, industry use cases, pricing, demo, FAQs, contact, legal pages, signup and SEO.

Identity & Tenant Management

Google Sign-In, organizations, invitations, RBAC, tenant-scoped data access, session management and secure logout.

Google Business Integration

Separate OAuth connection, eligible account/location discovery, token lifecycle, permission checks, review sync, owner reply endpoints, disconnect/reconnect flows.

Client Dashboard

KPIs, average rating, review counts, unanswered queue, trends, location selector, subscription and usage summaries.

Review Inbox

Review detail, search, filters, sentiment, manual reply editor, AI draft, approval queue, publish status and error handling.

AI Automation

Gemini provider abstraction, prompt templates, business tone, safety rules, confidence checks, reply quotas, scheduled workers and human override.

QR Management

Permanent QR destinations, downloadable PNG/SVG/PDF-ready output, campaign tags, QR scan counts and archive/disable states.

Visual Landing Page Builder

Template library, drag/drop or reorderable widget blocks, editable copy, logos, images, colors, typography, CTA, mobile preview, draft/publish and version history.

Public QR Page

Fast responsive rendering, public-safe configuration, Google review CTA, optional feedback, accessibility, analytics and anti-spam.

Subscriptions & Billing

Plans, 1/3/6/12-month prepaid terms, payment webhooks, entitlements, monthly AI usage caps, invoices, renewal and grace-period policy.

Super Admin

Tenant search, activation/suspension, plans, payment status, feature flags, integration health, API usage and support actions.

Analytics & Reporting

Review trends, response time, reply rate, sentiment, location comparison, QR scan and CTA-click metrics with clear measurement caveats.

Notifications

New review, approval required, reply failure, token expiry, plan expiry and renewal notices via email/in-app.

Security & Operations

Encryption, audit trails, rate limiting, monitoring, backups, retention, deletion, disaster recovery and policy review.

6. Pricing Proposal — INR, Prepaid

Plan

1 month

3 months

6 months

12 months

Basic

₹199

₹549

₹999

₹1,799

Pro

₹349

₹949

₹1,799

₹3,199

Business

₹599

₹1,599

₹2,999

₹5,399

These are draft introductory prices, NOT validated profitability. Taxes, gateway fees, AI consumption, support, infrastructure and Google API commercial terms must be modeled before launch.

Entitlement

Basic

Pro

Business

Business locations

1

1

3

QR landing pages

1

1

3

Review dashboard & manual replies

Yes

Yes

Yes

AI draft allowance / month

30

150

500

AI auto-replies

No

Opt-in

Opt-in

Advanced analytics

No

Limited

Yes

Subscription rules: payment-confirmed activation, immutable transaction records, signed webhook verification, expiry calculated from purchase/renewal terms, entitlement checks on server, AI auto-reply stopped on expiry, historical data retained under published retention policy. Monthly allowances reset on defined billing-cycle boundaries even for multi-month prepaid terms. Define upgrade proration, cancellation, refund, grace period and GST invoicing before launch.

7. Suggested Technical Architecture

Layer

Recommendation

Web

React + TypeScript + Tailwind CSS; mobile-first, accessible component system

API

Node.js + Express + TypeScript; versioned REST APIs

Database

MongoDB Atlas with tenantId indexes and unique external-ID constraints

Queue

Redis + BullMQ for sync, AI jobs, posting and notifications

AI

Gemini API with versioned prompts and provider abstraction

Auth

Google OpenID Connect for login; distinct Google Business Profile OAuth connection

Payments

Razorpay or suitable India-capable gateway; signed server-side webhooks

Storage

Private object storage for assets; CDN for published logos and cover images

Ops

Containerized deployments, secret manager, monitoring, CI/CD, backups

Suggested services: web app → API/auth → tenant-aware domain services → MongoDB; background workers → Google API/Gemini; object storage → CDN; billing provider → webhook handler → entitlement ledger. Never trust tenant IDs supplied by a browser without authorization checks.

8. Proposed Database Collections

Collection

Key fields / notes

users

_id, googleSubject, email, name, status

organizations

_id, name, slug, ownerUserId, status

memberships

organizationId, userId, role, locationPermissions

googleConnections

organizationId, googleSubject, encryptedRefreshTokenRef, scopes, status

businessLocations

organizationId, googleLocationId, displayName, reviewUrl, status

reviews

organizationId, locationId, googleReviewId, rating, comment, createdAt, replyStatus

reviewReplies

organizationId, reviewId, draftText, publishedText, status, actor, timestamps

replyRules

organizationId, locationId, enabled, starRules, tone, approvalThreshold

qrPages

organizationId, locationId, slug, publishedVersion, status

qrPageVersions

qrPageId, version, widgetConfig, theme, assetRefs, publishedAt

qrEvents

organizationId, qrPageId, eventType, timestamp, privacy-safe metadata

plans

code, durationOptions, entitlements, prices, version

subscriptions

organizationId, planId, startAt, endAt, status, usageCycle

payments

organizationId, gatewayId, amount, currency, verifiedStatus

usageCounters

organizationId, period, metric, consumed, limit

jobsAndAuditLogs

organizationId, event, actor, externalId, result, timestamp

Index organizationId on tenant collections; enforce composite uniqueness on organization/location + external review IDs; use immutable IDs for QR links where possible. Never expose tokens or internal credentials through public page APIs.

9. QR Landing Page Builder — Functional Specification

Widget types: Logo, cover hero, business name, subtitle, star input, optional private feedback, Google review CTA, social/contact buttons, footer.

Builder controls: add/remove/reorder blocks, visibility toggles, spacing, colors, font presets, button styles, backgrounds and logo/cover uploads.

Live mobile preview, desktop preview, draft autosave, explicit publish, rollback to prior published version.

Store widget configuration as validated structured JSON; sanitize content and restrict unsafe external embeds.

Render public pages server-side or via cached API for speed; cache invalidation on publish.

QR remains valid after redesign; redirect or render latest published version without changing printed code.

Per-location configuration; tenant cannot access another tenant’s assets or pages.

10. Google API Feasibility Gate

Before major implementation: review current Google Business Profile API documentation, apply for access where required, validate allowed commercial use for third-party SaaS, confirm quota and scope, and test with a real authorized verified location. Proof-of-concept acceptance: Google login, separate business OAuth consent, location selection, fetch real reviews, publish/update a permitted owner reply, disconnect/revoke, handle 401/403/429. If approval is denied, launch a QR + landing-page product without claiming automated Google review access.

11. Fifteen Development Phases and Acceptance Criteria

Phase 0 — Brand & Product Identity

Build: Shortlist unique names; trademark/domain checks; logo, palette, typography, product voice.

Done when: Approved working identity and design tokens.

Phase 1 — Foundations & Architecture

Build: Monorepo, React/Express TypeScript, environment configuration, MongoDB, Redis, CI, API conventions, tenant model.

Done when: Health checks, tests, linting, documented local setup.

Phase 2 — Marketing & Pricing UI

Build: Responsive website, plans, features, legal pages, signup CTAs.

Done when: Production-quality responsive pages; no misleading integrations.

Phase 3 — Auth & Tenant Security

Build: Google Sign-In, organizations, memberships, RBAC, onboarding.

Done when: Cross-tenant access tests pass.

Phase 4 — Google Integration Feasibility

Build: Access approval, separate OAuth, location discovery, real review sync/reply proof of concept.

Done when: Documented working integration or explicit fallback decision.

Phase 5 — Business Onboarding

Build: Connect account, select locations, profile setup, brand asset uploads.

Done when: New business completes onboarding end-to-end.

Phase 6 — Review Inbox

Build: Sync, filter, search, review detail, manual replies and statuses.

Done when: Authorized reply published and reflected in UI.

Phase 7 — AI Reply Engine

Build: Gemini draft generation, templates, rules, approvals, worker jobs and audit logs.

Done when: No duplicates; opt-in auto-post; risky replies held.

Phase 8 — QR Generator

Build: Unique permanent URLs, printable/downloadable codes, campaigns and scan events.

Done when: Printed QR resolves correctly across devices.

Phase 9 — Visual Page Builder

Build: Widgets, themes, drag/reorder, previews, drafts, publish and versioning.

Done when: Business owner can customize without code.

Phase 10 — Customer Experience

Build: Mobile QR destination, clear Google CTA, optional private feedback, accessibility.

Done when: All star ratings have equal Google review access.

Phase 11 — Billing & Entitlements

Build: Payment gateway, prepaid durations, webhooks, invoices, expiry, renewals and feature gates.

Done when: Paid activation/expiry works under replayed webhooks.

Phase 12 — Super Admin

Build: Client and subscription management, usage, support, admin audit trail.

Done when: Admin actions are permissioned and logged.

Phase 13 — Analytics & Notifications

Build: Review and QR metrics, email/in-app alerts, scheduled reports.

Done when: Metrics traceable; no unsupported conversion claims.

Phase 14 — QA, Security & Launch

Build: Load tests, privacy/security review, backup drills, pilot rollout, observability.

Done when: Pilot sign-off and documented scale thresholds.

12. Testing, Reliability & Scale

Unit tests: entitlements, reply policies, date math, tenant authorization, builder config validation.

Integration tests: OAuth callback, Google API errors, token refresh, signed payment webhook replay, retry/idempotency.

E2E: onboarding → payment → business connection → QR publish → scan → review inbox → reply.

Security: OWASP checks, CSRF/state/PKCE for OAuth, secrets encryption, object authorization, upload validation, abuse limits.

Operational metrics: queue depth, Google 429 rate, token refresh failures, AI spend, payment mismatch, p95 latency.

Scale gradually with pilot tenants, per-tenant throttles, backoff, queue partitioning and realistic load testing.

13. Risks, Dependencies & Open Decisions

Risk / decision

Mitigation

Google Business Profile commercial access

Validate approval, permitted SaaS use, quotas before committing to features

Review content policy

Neutral review access; no gating, fabricated or incentivized reviews

Unverified business or missing permission

Graceful onboarding status and help guidance

AI errors or harmful replies

Guardrails, human approval, audit and rollback process

Low-cost plan profitability

Measure real AI tokens, support cost and payment fees; tune allowances

Brand name conflicts

Trademark and domain checks before registration

Privacy and data retention

Publish policies, minimize personal data, secure deletion workflow

Exact billing/renewal rules

Finalize tax, proration, refunds and grace periods

14. Recommended Immediate Execution Order

Finalize shortlist of brand names and verify domain/trademark.

Build a Google Business Profile API feasibility proof-of-concept immediately, in parallel with visual design.

Freeze MVP scope: Google login, one business location, review inbox, manual reply, QR builder, simple AI drafts and prepaid subscription.

Pilot with one verified consenting business, then 5, then 10–50 before expanding feature depth.

Only enable automatic public replies after client opt-in, robust monitoring and policy review.

15. AI Developer Handoff Instructions

Act as a senior SaaS product architect, UX engineer and full-stack developer. Use this document as the source of truth. Do not silently invent API access or Google capabilities. Implement one phase at a time, beginning with an architecture proposal, directory structure, data models, API contracts, security boundaries and acceptance tests. Prefer production-grade TypeScript, reusable components, tenant isolation, mobile-first UI, accessible forms, robust error states and documented environment variables. Ask for credentials only via secure configuration, never in chat or source code. Clearly distinguish mock UI from live integration. Do not start the next phase until the current phase is reviewed.

Initial deliverables: (1) brand identity proposal, (2) architecture diagram and schema, (3) phase-by-phase backlog, (4) MVP wireframes, (5) Google API feasibility checklist. Working name “Revynq” is provisional.

CONFIDENTIAL WORKING BLUEPRINT  •  REVIEWPILOT / REVYNQ CONCEPT