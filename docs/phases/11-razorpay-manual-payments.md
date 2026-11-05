# Phase 11 — Razorpay manual payments and entitlements

Status: Not started

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [ ] Integrate Razorpay Orders + Checkout for one-time plan purchases and owner-initiated renewals. Do not create Subscriptions, AutoPay mandates or automatic deductions.
- [ ] Calculate amount and currency on the server from versioned plans. Store orders, payments and entitlement transactions with uniqueness constraints.
- [ ] Verify checkout signatures and signed webhooks; check payment/order ownership, currency, amount and captured state before activation.
- [ ] Handle webhook replay, delayed capture, browser closure, failures, refunds and reconciliation idempotently. Checkout success alone is not proof of paid access.
- [ ] Define monthly term calculations, early-renewal extension, AI reset boundaries, expiry and refund access behavior. Display renewal reminders and a Pay Now button.
- [ ] Use test mode before live KYC/activation. Provide receipts and configurable tax handling; do not collect GST without the applicable registration, and confirm obligations professionally.

## Acceptance criteria

Verified test payments activate/renew access exactly once; failed/unverified payments do not. No automatic future charge is scheduled.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.
