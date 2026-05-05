# tasks/infrastructure/DEVELOPER‑PORTAL.md – Developer Portal & Sandbox

This file covers the external developer experience: interactive docs, sandbox tenants, SDK visibility, changelog, and deprecation communication.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Developer Experience

### [ ] DEV‑PORTAL‑001: Interactive API Reference
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Generated APIs are not exposed through a polished external portal.

**Description:** Publish interactive API docs with authentication guidance, examples, and testing support.

**Depends on:** `lib/api‑spec/openapi.yaml`, generated client packages
**Blocks:** `DEV‑PORTAL‑002`, `DEV‑PORTAL‑003`

### [ ] DEV‑PORTAL‑002: Sandbox Environment
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** External developers have no safe test environment.

**Description:** Define sandbox tenant provisioning, rate limits, data reset behavior, and support boundaries for developer testing.

**Depends on:** `infrastructure/DEVELOPER‑PORTAL.md → DEV‑PORTAL‑001`
**Blocks:** [N/A]

### [ ] DEV‑PORTAL‑003: Changelog & Deprecation Notices
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** API change communication is not formalized.

**Description:** Publish a public changelog, deprecation policy, and consumer notification workflow.

**Depends on:** `infrastructure/DEVELOPER‑PORTAL.md → DEV‑PORTAL‑001`
**Blocks:** [N/A]

## Subtasks
- [ ] DEV‑PORTAL‑001.1 (AGENT): Define portal information architecture and auth examples.
- [ ] DEV‑PORTAL‑002.1 (MIXED): Document sandbox provisioning, quotas, and reset process.
- [ ] DEV‑PORTAL‑003.1 (MIXED): Define deprecation windows and notification channels.