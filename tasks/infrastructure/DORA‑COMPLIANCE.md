# tasks/infrastructure/DORA‑COMPLIANCE.md – Digital Operational Resilience Act (DORA)

The EU’s Digital Operational Resilience Act (DORA) applies to any SaaS serving financial institutions in the EU. It has been fully enforceable since January 17, 2025, and covers ICT risk management, incident classification and reporting, digital operational resilience testing, third‑party ICT provider oversight, and ICT audit logging.  
Without demonstrable DORA compliance, the platform cannot be sold to EU banks, insurers, or investment firms.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## DORA‑001: ICT Risk Management Framework
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No formal ICT risk management framework exists. Financial customers require documented risk identification, assessment, and mitigation processes.  
**Size:** Medium  

**Description:**  
Establish a living ICT Risk Management Framework that covers:
- **Risk Register:** A catalog of ICT risks (e.g., data breach, DDoS, critical third‑party outage, ransomware, insider threat) with likelihood, impact, risk owner, and current mitigating controls.
- **ICT Asset Inventory:** A complete inventory of all information assets (databases, servers, object storage, message brokers, CI/CD pipelines, secrets managers) with ownership, classification, and criticality.
- **Business Impact Analysis (BIA):** For each critical ICT asset, document the impact on the business if it is unavailable, including financial, reputational, and regulatory impact.
- **Risk Treatment Plan:** For risks above the organization’s risk appetite, define additional controls, timelines, and responsible parties.

This framework is a living document updated at least annually, and after any major system change or incident.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001` (all infrastructure must exist before a meaningful inventory can be built)  
**Blocks:** `DORA‑003`, `DORA‑004`, `DORA‑005`

**Related Files:** `docs/dora/ict‑risk‑register.md`, `docs/dora/ict‑asset‑inventory.md`, `docs/dora/business‑impact‑analysis.md`, `docs/dora/risk‑treatment‑plan.md`

**Definition of Done**
- [ ] `docs/dora/ict‑risk‑register.md` created with at least 15 identified risks, each with likelihood/impact, risk owner, and mitigating controls.  
- [ ] `docs/dora/ict‑asset‑inventory.md` created listing all production assets with ownership, classification (confidential/internal/public), and criticality (critical/high/medium/low).  
- [ ] `docs/dora/business‑impact‑analysis.md` created for all assets classified as critical or high.  
- [ ] `docs/dora/risk‑treatment‑plan.md` created with additional controls for risks exceeding the risk appetite.  
- [ ] Documents reviewed and approved by HUMAN (CISO / Head of Engineering).  

**Verification**
```bash
# Manual: open each document and verify completeness
```

---

### Subtasks
- [ ] DORA‑001.1 (AGENT): Draft ICT Risk Register based on typical SaaS risks. **File:** `docs/dora/ict‑risk‑register.md`
- [ ] DORA‑001.2 (AGENT): Draft ICT Asset Inventory from the infrastructure defined in DEVOPS.md, DATABASE.md, and SECURITY.md. **File:** `docs/dora/ict‑asset‑inventory.md`
- [ ] DORA‑001.3 (AGENT): Draft Business Impact Analysis for critical assets. **File:** `docs/dora/business‑impact‑analysis.md`
- [ ] DORA‑001.4 (AGENT): Draft Risk Treatment Plan. **File:** `docs/dora/risk‑treatment‑plan.md`
- [ ] DORA‑001.5 (HUMAN): Review and approve all four documents. **Verification:** Approved.

---

## DORA‑002: Incident Classification & Reporting
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No incident classification aligned with DORA exists. DORA requires specific incident categories and mandatory regulatory reporting for major incidents.  
**Size:** Medium  

**Description:**  
Align the incident classification system (from INCIDENT‑RESPONSE.md) with DORA requirements. Define:
- **Incident categories** that map DORA’s required categories (e.g., unauthorized access, data breach, data loss, service disruption, third‑party failure).
- **Severity classification** (P1‑P4) with clear criteria based on: number of affected clients, duration of disruption, data compromised, geographic spread, economic impact.
- **Regulatory reporting templates** for DORA major incident notifications: initial notification (within 4 hours), intermediate report (within 72 hours), and final report (within 1 month).
- **Integration** with the existing SOC 2 incident response process so a single incident workflow satisfies both regimes.

**Depends on:** `infrastructure/INCIDENT‑RESPONSE.md → IR‑001` (incident response plan exists)  
**Blocks:** `DORA‑003`

**Related Files:** `docs/dora/incident‑classification.md`, `docs/dora/regulatory‑reporting‑templates.md`

**Definition of Done**
- [ ] `docs/dora/incident‑classification.md` created: defines DORA incident categories, P1‑P4 severity criteria, and classification workflow.  
- [ ] `docs/dora/regulatory‑reporting‑templates.md` created: templates for initial, intermediate, and final reports, with all fields required by DORA (Article 18).  
- [ ] Incident response plan updated to reference DORA reporting timelines. **File:** `docs/incident‑response‑plan.md`  
- [ ] Integration test (tabletop exercise) verifies that a simulated DORA‑reportable incident follows the reporting templates within the required timeframes.  
- [ ] Documents approved by HUMAN.  

**Verification**
```bash
# Manual: open docs/dora/incident‑classification.md and docs/dora/regulatory‑reporting‑templates.md
# Tabletop exercise: verify report generation within time limits
```

---

### Subtasks
- [ ] DORA‑002.1 (AGENT): Draft incident classification and severity criteria aligned with DORA and SOC 2. **File:** `docs/dora/incident‑classification.md`
- [ ] DORA‑002.2 (AGENT): Draft regulatory reporting templates. **File:** `docs/dora/regulatory‑reporting‑templates.md`
- [ ] DORA‑002.3 (HUMAN): Review and approve both documents. **Verification:** Approved.
- [ ] DORA‑002.4 (AGENT): Update the incident response plan to cross‑reference DORA requirements. **File:** `docs/incident‑response‑plan.md`

---

## DORA‑003: Digital Operational Resilience Testing
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No regular resilience testing is conducted beyond restore drills (DR‑005). DORA requires annual testing of all critical ICT systems.  
**Size:** Large  

**Description:**  
Establish an annual digital operational resilience testing program that includes:
- **Vulnerability assessments** (already partially covered by PENETRATION‑TESTING.md – DAST/SAST).
- **Scenario‑based testing** of specific failure modes (e.g., database failure, Redis failure, Stripe API outage, R2 unavailability).
- **Tabletop exercises** for incident response (overlaps with INCIDENT‑RESPONSE.md).
- **Full end‑to‑end resilience test:** simulate a major incident (e.g., primary region outage), execute disaster recovery procedures (DR‑005), and measure actual RTO/RPO against targets.

All test results must be documented, reviewed, and made available to regulators and auditors upon request.

**Depends on:** `DORA‑001` (risk register identifies critical systems), `DORA‑002` (incident classification), `DR‑005` (restore drill), `infrastructure/INCIDENT‑RESPONSE.md → IR‑001`, `security/PENETRATION‑TESTING.md → PENTEST‑001`  
**Blocks:** None

**Related Files:** `docs/dora/resilience‑testing‑policy.md`, `artifacts/api‑server/src/jobs/resilience‑test‑runner.ts`

**Definition of Done**
- [ ] `docs/dora/resilience‑testing‑policy.md` created: defines annual testing schedule, test types, success criteria, and reporting format.  
- [ ] Automated scenario tests built: at minimum, test Stripe API failure (circuit breaker opens), Redis failure (BullMQ pauses), and R2 failure (documents return degraded status).  
- [ ] Full resilience test runbook: step‑by‑step procedure for simulating a full regional outage and measuring RTO/RPO.  
- [ ] Test results from at least one annual test documented and approved by HUMAN.  
- [ ] `pnpm run typecheck` passes for any automated test code.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- resilience‑scenarios.test.ts
# Manual: execute full resilience test runbook and record results in docs/dora/test‑results‑YYYY.md
```

---

### Subtasks
- [ ] DORA‑003.1 (AGENT): Draft resilience testing policy. **File:** `docs/dora/resilience‑testing‑policy.md`
- [ ] DORA‑003.2 (AGENT): Implement automated scenario tests for Stripe, Redis, and R2 failure. **File:** `artifacts/api‑server/src/__tests__/resilience/resilience‑scenarios.test.ts`
- [ ] DORA‑003.3 (AGENT): Write full resilience test runbook. **File:** `docs/dora/full‑resilience‑test‑runbook.md`
- [ ] DORA‑003.4 (HUMAN): Execute annual resilience test, document results, and approve. **Verification:** Results documented.

---

## DORA‑004: Third‑Party ICT Provider Oversight
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** Vendor risk management now has a dedicated owner file in `infrastructure/VENDOR‑RISK‑MANAGEMENT.md`, but DORA-specific ICT oversight work remains unimplemented.  
**Size:** Medium  

**Description:**  
Enhance the vendor risk management program to meet DORA Articles 28‑31 requirements for ICT third‑party service providers:
- **Criticality Tiering:** Classify all ICT providers (Stripe, Plaid, Cloudflare, AWS/GCP, SendGrid, Sentry) based on the criticality of the services they provide.
- **Contractual Requirements:** Ensure all ICT provider contracts include DORA‑required clauses: termination authority, resilience requirements, audit rights, and incident notification obligations.
- **Annual Reviews:** Conduct annual security and resilience reviews of all critical ICT providers, including collecting their SOC 2 Type II reports, ISO 27001 certificates, and DORA compliance statements.
- **Concentration Risk:** Assess concentration risk (e.g., over‑reliance on a single cloud provider) and document mitigation strategies.

**Depends on:** `infrastructure/VENDOR‑RISK‑MANAGEMENT.md → VRM‑001` (vendor inventory exists)  
**Blocks:** None

**Related Files:** `docs/dora/ict‑provider‑oversight.md`

**Definition of Done**
- [ ] `docs/dora/ict‑provider‑oversight.md` created: lists all ICT providers, their criticality tier, contract status (DORA‑compliant y/n), most recent review date, and findings.  
- [ ] Contract review completed for all critical ICT providers; any gaps documented with remediation timelines.  
- [ ] Annual review cycle established; first round of reviews completed and documented.  
- [ ] Concentration risk assessment documented.  
- [ ] Documents approved by HUMAN (CISO / Legal).

**Verification**
```bash
# Manual: open docs/dora/ict‑provider‑oversight.md and verify completeness
# Manual: verify contracts for top 3 critical providers have DORA clauses
```

---

### Subtasks
- [ ] DORA‑004.1 (AGENT): Draft ICT provider oversight document with criticality tiering and contract status. **File:** `docs/dora/ict‑provider‑oversight.md`
- [ ] DORA‑004.2 (HUMAN): Legal review of contracts; flag gaps. **Verification:** Gaps documented with remediation timelines.
- [ ] DORA‑004.3 (AGENT): Update vendor risk register to include DORA‑specific fields. **File:** `docs/dora/ict‑provider‑oversight.md`
- [ ] DORA‑004.4 (HUMAN): Final approval. **Verification:** Approved.

---

## DORA‑005: ICT Audit Logging
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** The `audit_logs` table exists (DB‑SETTINGS‑002) but is not configured to meet DORA’s immutability and retention requirements.  
**Size:** Medium  

**Description:**  
Enhance the existing audit logging system to meet DORA requirements:
- **Immutability:** `audit_logs` rows must be legally immutable. Implement a tamper‑evident mechanism: periodically compute a SHA‑256 hash chain (Merkle tree) of audit log entries, and publish the root hash to a public append‑only ledger or an external witnessing service.
- **Retention:** Retain audit logs for a minimum of 7 years (or longer if required by applicable national law). Implement a lifecycle policy that archives logs older than 1 year to a lower‑cost cold storage tier, but never permanently deletes them within the retention window.
- **Completeness:** Log all DORA‑relevant ICT events:
  - User access and authentication events.
  - Changes to system configurations and security settings.
  - Data export and deletion operations.
  - Third‑party API calls (Stripe, Plaid, cloud provider management APIs).
  - Security incidents and responses.

**Depends on:** `infrastructure/SETTINGS‑AUDIT.md → DB‑SETTINGS‑002`, `infrastructure/SETTINGS‑AUDIT.md → API‑AUDIT‑001`, `infrastructure/DISASTER‑RECOVERY.md → DR‑002` (backup infrastructure)  
**Blocks:** None

**Related Files:** `artifacts/api‑server/src/services/audit/audit‑immutability‑service.ts`, `infra/audit‑log‑archival/`

**Definition of Done**
- [ ] `audit_logs` table inspection: verify that all DORA‑required event types are being logged. If any gaps, add logging to the corresponding services.  
- [ ] `AuditImmutabilityService` implemented:
  - Every hour, computes a SHA‑256 hash chain of the previous hour’s audit log entries.
  - Publishes the chain’s root hash to a public append‑only ledger (or stores it in a separate, access‑controlled, append‑only database table with a digital signature).
- [ ] `AuditLogArchivalJob` (BullMQ, runs daily):
  - Archives audit log entries older than 1 year to R2 cold storage (parquet or JSON.gz).
  - Verifies archive integrity after writing.
  - Deletes archived entries from the main `audit_logs` table only after confirmation of successful archival and integrity check.
- [ ] Retention policy documented: 7 years minimum, no automatic deletion before 7 years.  
- [ ] Integration test: write a batch of audit logs, run immutability chain computation, verify chain is valid and a root hash is published.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- audit‑immutability.test.ts
pnpm --filter @workspace/api‑server test -- audit‑archival.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] DORA‑005.1 (AGENT): Audit current `audit_logs` coverage; add logging for any missing DORA event types. **File:** Various domain services.
- [ ] DORA‑005.2 (AGENT): Implement `AuditImmutabilityService` with SHA‑256 hash chaining and root hash publishing. **File:** `artifacts/api‑server/src/services/audit/audit‑immutability‑service.ts` **Verification:** Unit tests.
- [ ] DORA‑005.3 (AGENT): Implement `AuditLogArchivalJob` with integrity verification. **File:** `artifacts/api‑server/src/jobs/audit‑log‑archival.ts` **Verification:** Integration test.
- [ ] DORA‑005.4 (AGENT): Update audit log retention policy document. **File:** `docs/dora/audit‑log‑retention‑policy.md`
- [ ] DORA‑005.5 (HUMAN): Final review – verify hash chain integrity and archival integrity. **Verification:** Approved.

---