# tasks/infrastructure/EU‑DATA‑ACT.md – EU Data Act Switching & Portability

This file covers provider-switching obligations, comprehensive organization export, and contract transparency required by the EU Data Act.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Provider Switching

### [ ] EU‑DATA‑001: Comprehensive Organization Export
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No complete machine-readable tenant export exists.

**Description:** Provide a tenant-wide export path covering CRM, Projects, Finance, Documents, Assets, Portal, and Settings data in a machine-readable package.

**Depends on:** All domain CRUD APIs
**Blocks:** `infrastructure/GDPR‑COMPLIANCE.md → GDPR‑009`, `EU‑DATA‑002`
**Related Files:** `lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/services/export/org‑export‑service.ts`

### [ ] EU‑DATA‑002: Switching Assistance Documentation
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No migration support runbook exists.

**Description:** Publish a switching guide describing package contents, export limitations, handoff steps, and 30-day transition support commitments.

**Depends on:** `infrastructure/EU‑DATA‑ACT.md → EU‑DATA‑001`
**Blocks:** [N/A]
**Related Files:** `docs/compliance/eu‑data‑act‑switching‑guide.md`

### [ ] EU‑DATA‑003: Contract Transparency
**Status:** ⏳ Not Started
**Actor:** HUMAN
**Priority:** 🟠 High
**Current State:** Customer terms do not explicitly document portability rights.

**Description:** Update commercial terms and trust documentation to explain portability rights, transition process, and any technical limitations.

**Depends on:** [N/A]
**Blocks:** [N/A]
**Related Files:** `docs/legal/data‑portability.md`, `docs/trust/portability‑faq.md`

**Verification**
- [ ] Run one full tenant export and validate completeness against a reference tenant
- [ ] Confirm switching guide matches exported package structure

## Subtasks
- [ ] EU‑DATA‑001.1 (AGENT): Define the export scope and package manifest by module.
- [ ] EU‑DATA‑001.2 (AGENT): Add API and background-job tasks for tenant export generation.
- [ ] EU‑DATA‑002.1 (AGENT): Draft the switching assistance guide and support timeline.
- [ ] EU‑DATA‑002.2 (HUMAN): Review customer obligations and transition commitments.
- [ ] EU‑DATA‑003.1 (HUMAN): Update contract language and portability FAQ.
- [ ] EU‑DATA‑003.2 (HUMAN): Approve publication-ready wording.