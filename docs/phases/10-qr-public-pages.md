# Phase 10 — QR codes and public business pages

Status: Not started

## Dependencies

Prior relevant phases; see the execution order in [README.md](README.md).

## Implementation checklist

- [ ] Create a permanent public identifier/URL for each business QR page and generate downloadable PNG/SVG codes.
- [ ] Provide a simple fixed template with editable logo, name, greeting, colors and Google review button; defer drag-and-drop builder.
- [ ] Keep Google review access equally visible to every visitor regardless of sentiment. Never gate, incentivize or fabricate reviews.
- [ ] If private feedback is offered, label it clearly and keep the Google review option available to everyone.
- [ ] Validate uploads and links, sanitize public content, rate-limit feedback and expose only public-safe configuration.
- [ ] Track privacy-conscious scans and CTA clicks separately; never equate clicks with published reviews. Define expiry behavior that preserves existing printed QR links.

## Acceptance criteria

Printed QR codes scan on mobile, page edits preserve the URL, and all visitors can access the neutral Google review CTA.

## Handoff

Record changed files, validation performed, unresolved dependencies and any scope decisions. Review this phase before starting the next dependent phase. Never mark mock integrations as complete live integrations.
