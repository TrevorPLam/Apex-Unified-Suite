# tasks/infrastructure/INCIDENT‑RESPONSE.md – Incident Response

This file defines the operational incident response backlog required for SOC 2, GDPR, DORA, and NIS2 readiness. It covers incident classification, response coordination, breach communication, and recurring validation exercises.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Incident Management

### [ ] IR‑001: Incident Response Plan
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No formal incident response plan exists.

**Description:** Define a single incident response plan with severity levels (`P1`-`P4`), response roles, escalation matrix, communication channels, evidence handling, and recovery checkpoints.

**Depends on:** [N/A]
**Blocks:** `infrastructure/DORA‑COMPLIANCE.md → DORA‑002`, `DORA‑003`
**Related Files:** `docs/incident‑response‑plan.md`, `docs/security/escalation‑matrix.md`

**Definition of Done**
- [ ] Severity model and response roles documented
- [ ] Escalation path and on-call decision tree documented
- [ ] Internal comms template and incident log format documented

### [ ] IR‑002: Breach Notification Templates
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🔴 Critical
**Current State:** No regulator-ready notification templates exist.

**Description:** Create reusable templates for GDPR 72-hour breach notices, DORA incident reporting, customer notifications, and post-incident summaries.

**Depends on:** `infrastructure/INCIDENT‑RESPONSE.md → IR‑001`
**Blocks:** `infrastructure/DORA‑COMPLIANCE.md → DORA‑002`
**Related Files:** `docs/security/breach‑notification‑templates.md`

### [ ] IR‑003: Annual Tabletop Exercise Program
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟠 High
**Current State:** No recurring incident exercise program exists.

**Description:** Schedule and run annual tabletop exercises for ransomware, provider outage, credential compromise, and data breach scenarios, with after-action reviews and remediation tracking.

**Depends on:** `infrastructure/INCIDENT‑RESPONSE.md → IR‑001`
**Blocks:** `infrastructure/DORA‑COMPLIANCE.md → DORA‑003`
**Related Files:** `docs/security/tabletop‑exercise‑runbook.md`, `docs/security/after‑action‑review.md`

### [ ] IR‑004: Alert Integration & Evidence Capture
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Alerting inputs are not connected to an incident workflow.

**Description:** Wire monitoring alerts, security signals, and support escalations into a unified incident intake flow with evidence retention requirements and timeline capture.

**Depends on:** `infrastructure/INCIDENT‑RESPONSE.md → IR‑001`, `infrastructure/OBSERVABILITY.md → OBS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/lib/incident/intake.ts`, `docs/security/incident‑evidence‑guide.md`

**Verification**
- [ ] Run one tabletop exercise and retain the incident record
- [ ] Confirm breach templates cover GDPR and DORA timelines

## Subtasks
- [ ] IR‑001.1 (AGENT): Draft `docs/incident‑response‑plan.md` with severity matrix, roles, and escalation workflow.
- [ ] IR‑001.2 (HUMAN): Review the plan and approve the final workflow.
- [ ] IR‑002.1 (AGENT): Draft regulator, customer, and internal notification templates.
- [ ] IR‑002.2 (HUMAN): Legal/compliance review of notification language and timing.
- [ ] IR‑003.1 (AGENT): Write tabletop scenarios and facilitator guide.
- [ ] IR‑003.2 (HUMAN): Run the annual exercise and record the after-action review.
- [ ] IR‑004.1 (AGENT): Define incident intake points from monitoring, support, and security alerts.
- [ ] IR‑004.2 (AGENT): Document evidence retention and timeline capture requirements.