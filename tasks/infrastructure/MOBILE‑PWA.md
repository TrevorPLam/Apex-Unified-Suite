# tasks/infrastructure/MOBILE‑PWA.md – Mobile Responsiveness & PWA

This file covers responsive QA, installable PWA behavior, offline shell support, and mobile-specific capabilities needed for field workflows.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Mobile Surface

### [ ] MOBILE‑001: Responsive Design Audit
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** The platform has not been systematically validated on small screens.

**Description:** Audit all pages and key workflows across 320px-1920px widths with touch target and overflow checks.

**Depends on:** All frontend pages
**Blocks:** `MOBILE‑002`, `MOBILE‑003`

### [ ] MOBILE‑002: PWA Manifest & Offline Shell
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** The app is not installable and has no offline shell.

**Description:** Add manifest, service worker, install prompt handling, and offline shell support for read-only fallback and deferred sync.

**Depends on:** `infrastructure/MOBILE‑PWA.md → MOBILE‑001`
**Blocks:** [N/A]

### [ ] MOBILE‑003: Mobile-first Capabilities
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Field workflows lack mobile-native affordances.

**Description:** Add barcode scanning for assets and review other mobile-native capabilities with clear scope boundaries.

**Depends on:** `infrastructure/MOBILE‑PWA.md → MOBILE‑001`
**Blocks:** [N/A]

## Subtasks
- [ ] MOBILE‑001.1 (AGENT): Capture responsive issues by page and severity.
- [ ] MOBILE‑001.2 (HUMAN): Prioritize the audit findings for implementation phases.
- [ ] MOBILE‑002.1 (AGENT): Define offline shell scope and deferred-action rules.
- [ ] MOBILE‑003.1 (AGENT): Define barcode scanning workflow and permissions.