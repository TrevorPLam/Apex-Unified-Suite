# tasks/infrastructure/VENDOR‑RISK‑MANAGEMENT.md – Vendor Risk Management

This file covers third-party vendor inventory, risk tiering, review cadence, and procurement controls for vendors that process data or support critical platform operations.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Vendor Governance

### [ ] VRM‑001: Vendor Inventory & Risk Tiering
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No authoritative vendor inventory exists.

**Description:** Create a vendor register covering purpose, data access, system criticality, regions, subprocessors, and risk tier for every third-party provider.

**Depends on:** [N/A]
**Blocks:** `infrastructure/DORA‑COMPLIANCE.md → DORA‑004`, `VRM‑002`, `VRM‑003`
**Related Files:** `docs/security/vendor‑risk‑register.md`

### [ ] VRM‑002: Annual Vendor Reviews
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** Security review cadence is undefined.

**Description:** Establish annual review requirements for critical vendors, including SOC 2, ISO 27001, penetration test summary, breach history, and remediation tracking.

**Depends on:** `infrastructure/VENDOR‑RISK‑MANAGEMENT.md → VRM‑001`
**Blocks:** `VRM‑004`
**Related Files:** `docs/security/vendor‑review‑checklist.md`, `docs/security/vendor‑review‑schedule.md`

### [ ] VRM‑003: Contractual Risk Controls
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** Contract requirements are not standardized.

**Description:** Define minimum contract clauses for audit rights, security commitments, termination authority, breach notification, data return, and regional hosting commitments.

**Depends on:** `infrastructure/VENDOR‑RISK‑MANAGEMENT.md → VRM‑001`
**Blocks:** `infrastructure/DORA‑COMPLIANCE.md → DORA‑004`
**Related Files:** `docs/security/vendor‑contract‑requirements.md`

### [ ] VRM‑004: Vendor Risk Dashboard
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Review status and gaps are not visible anywhere.

**Description:** Add an admin-facing dashboard showing vendor tier, last review, outstanding findings, renewal date, and contract gap status.

**Depends on:** `infrastructure/VENDOR‑RISK‑MANAGEMENT.md → VRM‑002`, `VRM‑003`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/Settings.tsx`, `artifacts/api‑server/src/routes/admin/vendor‑risk.ts`

**Verification**
- [ ] Produce a completed review package for one critical vendor
- [ ] Confirm DORA-required contract clauses are tracked per vendor

## Subtasks
- [ ] VRM‑001.1 (AGENT): Draft the vendor inventory with initial tiering.
- [ ] VRM‑001.2 (HUMAN): Validate the provider list and criticality assignments.
- [ ] VRM‑002.1 (AGENT): Create the annual review checklist and evidence requirements.
- [ ] VRM‑002.2 (HUMAN): Complete at least one sample vendor review.
- [ ] VRM‑003.1 (AGENT): Document mandatory contract clauses and exception handling.
- [ ] VRM‑003.2 (HUMAN): Legal review of contractual controls.
- [ ] VRM‑004.1 (AGENT): Define dashboard fields and API contract.
- [ ] VRM‑004.2 (AGENT): Add backlog items for reminder jobs and overdue review alerts.