# tasks/infrastructure/DISASTER‑RECOVERY.md – Disaster Recovery & Backup Strategy

This file defines the backup, restore, and disaster recovery (DR) procedures required to meet SOC 2 Type II Availability criteria, as well as general operational resilience. Without a documented and tested DR plan, enterprise customers cannot rely on the platform for business‑critical operations, and SOC 2 certification will be blocked.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## DR‑001: Define RPO/RTO Targets & DR Policy
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No RPO/RTO targets or DR policy exist. Business stakeholders have not agreed on acceptable data loss or downtime windows.  
**Size:** Small  

**Description:**  
Work with stakeholders to define the Recovery Point Objective (RPO) and Recovery Time Objective (RTO) for the platform. Document the agreed targets, the justification, and the technical strategy to achieve them. The recommended baseline for a B2B SaaS is RPO ≤ 1 hour and RTO ≤ 4 hours, but this must be formally signed off.

**Depends on:** None  
**Blocks:** `DR‑002` through `DR‑007` (all recovery procedures depend on agreed targets)

**Related Files:** `docs/dr‑policy.md`

**Definition of Done**
- [ ] RPO target documented (recommended: ≤ 1 hour – continuous WAL archiving).  
- [ ] RTO target documented (recommended: ≤ 4 hours – automated restore).  
- [ ] DR policy defines: backup frequency, retention periods, restore testing cadence, communication plan during an incident.  
- [ ] Policy reviewed and approved by HUMAN (CTO / VP Engineering).  
- [ ] Policy committed to `docs/dr‑policy.md`.

**Verification**
```bash
# Manual: open docs/dr‑policy.md and verify stakeholder approval
```

---

### Subtasks
- [ ] DR‑001.1 (AGENT): Draft DR policy with RPO/RTO targets, backup strategy, and restore drill cadence. **File:** `docs/dr‑policy.md`
- [ ] DR‑001.2 (HUMAN): Review, adjust targets if needed, and sign off. **Verification:** Approved.

---

## DR‑002: Automated PostgreSQL Backups (Continuous Archiving)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No automated backups exist. A database failure would result in total data loss since the last manual snapshot (if any).  
**Size:** Medium  

**Description:**  
Configure continuous WAL (Write‑Ahead Log) archiving for PostgreSQL using a tool such as `pgBackRest` or `WAL‑G`. Perform a full backup daily and incremental backups every 4 hours. All backups are stored in Cloudflare R2 (or an equivalent S3‑compatible object store) and encrypted at rest using KMS‑managed keys.

**Depends on:** `DR‑001`, `infrastructure/EMAIL‑STORAGE.md → STORAGE‑001` (R2 adapter), `infrastructure/DATABASE.md → DB‑ORG‑001` (database is operational)  
**Blocks:** `DR‑003`, `DR‑004`

**Related Files:** `infra/db‑backup/pgbackrest‑config.ini` (or equivalent), `artifacts/api‑server/src/services/infrastructure/backup‑service.ts`

**Definition of Done**
- [ ] WAL archiving enabled (`archive_mode = on`, `archive_command` points to a script that uploads WAL segments to R2).  
- [ ] Full backup schedule: daily at 02:00 UTC.  
- [ ] Incremental backup schedule: every 4 hours (02:00, 06:00, 10:00, 14:00, 18:00, 22:00 UTC).  
- [ ] Backup tool runs as a sidecar container or a scheduled job on the database host.  
- [ ] All backups encrypted at rest with AES‑256 (via R2 bucket encryption or client‑side encryption before upload).  
- [ ] Backup job logs success/failure to Pino, with alerts on failure.  
- [ ] Backup validation: after each full backup, a checksum verification runs.  
- [ ] Integration test: trigger a manual backup, verify backup appears in R2, restore it to a fresh database, verify data integrity.  
- [ ] `pnpm run typecheck` passes for any application code involved.

**Verification**
```bash
# Manual: inspect R2 bucket for backup files after a cycle
# Integration test: restore latest backup to a test DB and run schema checks
```

---

### Subtasks
- [ ] DR‑002.1 (AGENT): Select backup tool (`pgBackRest` or `WAL‑G`) and create configuration. **File:** `infra/db‑backup/`
- [ ] DR‑002.2 (AGENT): Configure WAL archiving on the PostgreSQL server. **Verification:** `pg_ls_waldir` shows archived segments.
- [ ] DR‑002.3 (AGENT): Write scheduled backup script and deploy as a cron job or Kubernetes CronJob. **Verification:** Backups appear in R2 on schedule.
- [ ] DR‑002.4 (AGENT): Implement backup validation and alerting. **Verification:** Test failure alert.
- [ ] DR‑002.5 (HUMAN): Perform a manual backup and restore to a scratch database. **Verification:** Data integrity confirmed.

---

## DR‑003: Backup Retention Policy
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No retention policy exists; backup storage will grow indefinitely or be manually pruned.  
**Size:** Small  

**Description:**  
Define and enforce a retention policy for database backups. The recommended policy: daily backups retained for 30 days, weekly backups retained for 90 days, monthly backups retained for 12 months. All retained backups are encrypted at rest. Implement an automated cleanup job that removes backups older than their respective retention windows.

**Depends on:** `DR‑002` (backups being generated)  
**Blocks:** None

**Related Files:** `infra/db‑backup/retention‑policy.sh` (or implemented via S3 lifecycle rules)

**Definition of Done**
- [ ] Retention policy documented in `docs/dr‑policy.md`.  
- [ ] R2 lifecycle rules configured (or a scheduled cleanup script) to enforce:
  - Daily backups: retain for 30 days.
  - Weekly backups (every Sunday): retain for 90 days.
  - Monthly backups (first of the month): retain for 12 months.
- [ ] Cleanup job logs deleted backup identifiers.  
- [ ] Integration test: upload a backup with a fake old timestamp, run cleanup, verify it’s deleted.  
- [ ] `pnpm run typecheck` – N/A (infrastructure).

**Rules to Follow**
- Never automatically delete the most recent full backup, even if it exceeds retention (safety net).  
- Cleanup must be idempotent; running it twice should not error.

**Verification**
```bash
# Manual: after a retention cycle, verify R2 bucket only contains backups within the retention window
```

---

### Subtasks
- [ ] DR‑003.1 (AGENT): Configure R2 lifecycle rules or write cleanup script. **File:** `infra/db‑backup/retention‑policy.sh`
- [ ] DR‑003.2 (AGENT): Test cleanup logic locally or with R2 test bucket. **Verification:** Old backups removed; recent backups preserved.
- [ ] DR‑003.3 (HUMAN): Review and sign off.

---

## DR‑004: Point‑in‑Time Recovery (PITR) Procedure
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No documented PITR procedure exists. In a disaster, recovery would be ad‑hoc and error‑prone.  
**Size:** Medium  

**Description:**  
Create a documented runbook and an automated script that can restore the database to any point in time within the retention window using the full backup + WAL archives. The script must be tested quarterly as part of `DR‑005`.

**Depends on:** `DR‑002` (backups + WAL), `DR‑003` (retention)  
**Blocks:** `DR‑005`

**Related Files:** `infra/db‑backup/pitr‑restore.sh`, `docs/dr‑pitr‑runbook.md`

**Definition of Done**
- [ ] PITR restore script: accepts a target timestamp, locates the closest full backup, restores it, and replays WAL segments up to the target time.  
- [ ] Script validates post‑restore schema integrity (runs `pg_dump --schema-only` and checks for errors).  
- [ ] Runbook document explains step‑by‑step: how to initiate a restore, how to verify it, and how to promote the restored instance to production.  
- [ ] Both script and runbook tested manually by an engineer (not the author).  
- [ ] `pnpm run typecheck` – N/A.

**Verification**
```bash
# Manual: run pitr-restore.sh --target-time '2026-05-01 12:00:00' on a test database
# Manual: verify a record inserted at 11:59 exists and a record inserted at 12:01 does not
```

---

### Subtasks
- [ ] DR‑004.1 (AGENT): Write PITR restore script with WAL replay. **File:** `infra/db‑backup/pitr‑restore.sh`
- [ ] DR‑004.2 (AGENT): Write PITR runbook. **File:** `docs/dr‑pitr‑runbook.md`
- [ ] DR‑004.3 (HUMAN): Execute runbook and script against a test environment; verify point‑in‑time accuracy. **Verification:** Approved.

---

## DR‑005: Quarterly Restore Drill (Automated)
**Status:** ⏳ Not Started  
**Actor:** AGENT + HUMAN  
**Priority:** 🔴 Critical  
**Current State:** No restore testing occurs. SOC 2 requires regular testing of recovery procedures.  
**Size:** Large  

**Description:**  
Implement an automated job that runs quarterly (or more frequently) and performs a full end‑to‑end restore drill:
1. Provisions a clean database instance.
2. Restores the latest backup using the PITR script (DR‑004).
3. Runs a suite of smoke tests against the restored database (schema integrity, basic CRUD operations on key tables).
4. Captures evidence: logs, timing, success/failure.
5. Sends a summary report to the operations team and stores the evidence in an auditor‑accessible location.

The automated drill can be triggered manually or on a schedule. A manual drill must also be possible in case the automated pipeline fails.

**Depends on:** `DR‑004`, `DR‑002`, `infrastructure/DATABASE.md → TEST‑INFRA‑001` (test database utilities)  
**Blocks:** SOC 2 audit evidence

**Related Files:** `infra/db‑backup/restore‑drill‑job.ts`, `artifacts/api‑server/src/jobs/restore‑drill‑job.ts`

**Definition of Done**
- [ ] `RestoreDrillJob` (BullMQ or GitHub Actions scheduled workflow) that performs the automated restore and smoke test.  
- [ ] Smoke tests verify: organizations table has expected rows, users can be queried, invoices table exists and is queryable.  
- [ ] Drill generates a report: `{ timestamp, success: boolean, durationMs, restoredBackupTimestamp, smokeTestResults }`.  
- [ ] Report stored in R2 (`dr‑drills/YYYY‑Q1‑drill‑report.json`) and sent via Slack/email to ops team.  
- [ ] Drill is scheduled to run on the first Saturday of each quarter at 03:00 UTC.  
- [ ] Manual run option: `pnpm dr:drill` triggers a drill manually.  
- [ ] Integration test: trigger drill, verify report exists and smoke tests pass.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm dr:drill
# inspect R2 bucket for report
pnpm --filter @workspace/api‑server test -- restore‑drill.test.ts
```

---

### Subtasks
- [ ] DR‑005.1 (AGENT): Write `RestoreDrillJob` using BullMQ, provisioning a test database and running PITR script. **File:** `artifacts/api‑server/src/jobs/restore‑drill‑job.ts`
- [ ] DR‑005.2 (AGENT): Write smoke test suite against restored database. **File:** `artifacts/api‑server/src/services/infrastructure/restore‑smoke‑tests.ts`
- [ ] DR‑005.3 (AGENT): Implement report generation and notification (email/Slack). **Verification:** Report received.
- [ ] DR‑005.4 (AGENT): Schedule quarterly drill job. **File:** `artifacts/api‑server/src/jobs/scheduler.ts`
- [ ] DR‑005.5 (HUMAN): Manually trigger a drill, review report, and approve. **Verification:** Approved.

---

## DR‑006: Redis Persistence (AOF + RDB)
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** Redis is used by BullMQ for background jobs. If Redis restarts, all enqueued jobs, rate‑limit counters, and caches are lost.  
**Size:** Small  

**Description:**  
Configure Redis with Append‑Only File (AOF) persistence (`fsync` every 1 second) and periodic RDB snapshots (every 6 hours). Back up both the AOF and RDB files to R2 after each snapshot, enabling recovery of job queues, rate‑limit state, and feature flag caches in case of Redis failure.

**Depends on:** `DR‑002` (same R2 bucket for backup storage), `infrastructure/DEVOPS.md → JOB‑INFRA‑001` (Redis in use)  
**Blocks:** None

**Related Files:** `infra/redis‑backup/backup‑script.sh`

**Definition of Done**
- [ ] Redis configuration updated: `appendonly yes`, `appendfsync everysec`. RDB snapshot policy: `save 3600 1`.  
- [ ] Backup script: after each RDB snapshot, copies the latest RDB and AOF files to R2.  
- [ ] Backup retention: 7 days for Redis backups.  
- [ ] Restore test: stop Redis, clear data, restore from R2 backup, start Redis, verify BullMQ queues contain expected jobs.  
- [ ] `pnpm run typecheck` – N/A.

**Verification**
```bash
# Manual: kill Redis, restore from R2 backup, verify job queues recover
```

---

### Subtasks
- [ ] DR‑006.1 (AGENT): Configure Redis AOF and RDB persistence. **File:** `redis.conf` or Helm values.
- [ ] DR‑006.2 (AGENT): Write backup script for Redis data to R2. **File:** `infra/redis‑backup/backup‑script.sh`
- [ ] DR‑006.3 (HUMAN): Perform a manual restore test. **Verification:** Approved.

---

## DR‑007: R2 Object Storage Cross‑Region Replication
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** Document storage (R2) is in a single region. A regional outage would make all uploaded documents unavailable.  
**Size:** Small  

**Description:**  
Configure Cloudflare R2 (or the chosen object storage) to replicate the document storage bucket to a secondary region. This ensures geographic redundancy for user‑uploaded files, letterhead logos, and exported reports. Replication should be near‑real‑time (within a few minutes).

**Depends on:** `DOC‑STORAGE‑001` (R2 bucket exists)  
**Blocks:** None

**Related Files:** R2 dashboard or Terraform configuration.

**Definition of Done**
- [ ] Replication rule configured on the primary R2 bucket (or equivalent) that copies all objects to a bucket in a different region.  
- [ ] Replication lag monitored; alerts if lag exceeds 15 minutes.  
- [ ] Restore test: remove an object from the primary bucket, verify it remains available in the secondary bucket.  
- [ ] `pnpm run typecheck` – N/A.

**Verification**
```bash
# Manual: upload a test file, delete it in the primary region, verify it exists in the secondary replication bucket
```

---

### Subtasks
- [ ] DR‑007.1 (AGENT): Configure cross‑region replication for the document storage bucket. **Verification:** Objects appear in secondary region.
- [ ] DR‑007.2 (AGENT): Set up replication lag monitoring and alert. **Verification:** Alert fires when lag > 15 minutes.
- [ ] DR‑007.3 (HUMAN): Verify replication and failover procedure. **Verification:** Approved.

---