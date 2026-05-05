# tasks/security/PENETRATION‑TESTING.md – Penetration Testing & Vulnerability Assurance

This file defines the backlog for SAST, DAST, third-party penetration testing, vulnerability disclosure, and dependency vulnerability response.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Security Validation

### [ ] PENTEST‑001: SAST in CI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No static security scanning is enforced in CI.

**Description:** Add SAST scanning on every pull request with triage workflow, severity thresholds, and documented false-positive handling.

**Depends on:** `foundation/TOOLING.md → DEP‑001`
**Blocks:** `PENTEST‑003`
**Related Files:** `.github/workflows`, `docs/security/sast‑baseline.md`

### [ ] PENTEST‑002: DAST for Staging
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No automated dynamic security scanning exists.

**Description:** Run scheduled DAST scans against a staging surface and retain reports for audit and remediation tracking.

**Depends on:** `infrastructure/SECURITY.md → SEC‑001`
**Blocks:** `PENTEST‑003`
**Related Files:** `docs/security/dast‑schedule.md`

### [ ] PENTEST‑003: Annual Third-Party Penetration Test
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** No independent penetration test program is defined.

**Description:** Define scope, vendor selection, remediation SLAs, retest expectations, and evidence retention for an annual external pentest.

**Depends on:** `tasks/security/PENETRATION‑TESTING.md → PENTEST‑001`, `PENTEST‑002`
**Blocks:** `infrastructure/DORA‑COMPLIANCE.md → DORA‑003`
**Related Files:** `docs/security/pentest‑scope.md`, `docs/security/pentest‑sla.md`

### [ ] PENTEST‑004: Vulnerability Disclosure Program
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** No public disclosure channel exists.

**Description:** Publish a responsible disclosure policy, `security.txt`, response SLA, and intake ownership for external researchers.

**Depends on:** [N/A]
**Blocks:** [N/A]
**Related Files:** `public/.well‑known/security.txt`, `docs/security/vulnerability‑disclosure.md`

### [ ] PENTEST‑005: Dependency Vulnerability Response
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** Vulnerability monitoring is ad hoc.

**Description:** Add automated dependency vulnerability checks, patch SLAs, and escalation rules for critical CVEs.

**Depends on:** `foundation/TOOLING.md → DEP‑001`
**Blocks:** [N/A]
**Related Files:** `docs/security/dependency‑patch‑policy.md`

**Verification**
- [ ] Security scanning runs on a pull request and reports severity thresholds
- [ ] Pentest scope and remediation SLA are documented and approved

## Subtasks
- [ ] PENTEST‑001.1 (AGENT): Choose the SAST toolchain and define severity gates.
- [ ] PENTEST‑001.2 (AGENT): Document baseline findings and false-positive handling.
- [ ] PENTEST‑002.1 (AGENT): Define authenticated staging scan coverage.
- [ ] PENTEST‑002.2 (AGENT): Retain weekly DAST reports for audit evidence.
- [ ] PENTEST‑003.1 (HUMAN): Define annual pentest scope and shortlist vendors.
- [ ] PENTEST‑003.2 (HUMAN): Approve remediation SLAs and retest requirements.
- [ ] PENTEST‑004.1 (AGENT): Draft `security.txt` and disclosure policy.
- [ ] PENTEST‑005.1 (AGENT): Document dependency vulnerability triage and patch windows.