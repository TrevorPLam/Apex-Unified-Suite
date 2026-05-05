# tasks/integrations/EMAIL‑INGESTION.md – Email Ingestion & Triage

This file covers inbound email ingestion, email-to-task conversion, attachment handling, and the Karbon-style triage workspace.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Inbound Email Workflow

### [ ] EMAIL‑INGEST‑001: Inbound Email Adapter
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** The platform can send email but cannot ingest it.

**Description:** Define the adapter layer for inbound email polling or webhook ingestion with normalized parsing for headers, bodies, participants, and raw payload retention.

**Depends on:** `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`
**Blocks:** `EMAIL‑INGEST‑002`, `EMAIL‑INGEST‑003`, `EMAIL‑INGEST‑004`
**Related Files:** `artifacts/api‑server/src/lib/email/ingestion`, `docs/email/inbound‑adapter.md`

### [ ] EMAIL‑INGEST‑002: Email-to-CRM Conversion
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Emails are not linked to CRM entities or tasks.

**Description:** Convert inbound email into CRM activity records and optional CRM follow-up tasks, with contact matching and create-if-missing logic.

**Depends on:** `integrations/EMAIL‑INGESTION.md → EMAIL‑INGEST‑001`, `crm/CRM‑ACTIVITIES‑TASKS.md → API‑CRM‑024`
**Blocks:** `EMAIL‑INGEST‑005`, `FRONT‑EMAIL‑TRIAGE‑001`
**Related Files:** `artifacts/api‑server/src/services/email/email‑triage‑service.ts`

### [ ] EMAIL‑INGEST‑003: Attachment Extraction & Storage
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Inbound attachments are dropped.

**Description:** Parse MIME attachments, upload them through the storage layer, and link the stored artifacts back to CRM activity records.

**Depends on:** `integrations/EMAIL‑INGESTION.md → EMAIL‑INGEST‑001`, `documents/DOCUMENTS‑MANAGEMENT.md → DOC‑STORAGE‑001`
**Blocks:** `FRONT‑EMAIL‑TRIAGE‑001`
**Related Files:** `artifacts/api‑server/src/lib/email/attachment‑pipeline.ts`

### [ ] EMAIL‑INGEST‑004: Shared Inbox Management
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** No team-shared inbox model exists.

**Description:** Support shared inbox definitions, assignment rules, and mailbox ownership boundaries for firm-wide triage.

**Depends on:** `integrations/EMAIL‑INGESTION.md → EMAIL‑INGEST‑001`
**Blocks:** `EMAIL‑INGEST‑005`, `FRONT‑EMAIL‑TRIAGE‑001`

### [ ] EMAIL‑INGEST‑005: Triage Delegation & Queue Controls
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** Delegated triage is unsupported.

**Description:** Allow temporary or permanent triage delegation with audit logs, assignment history, and permission checks.

**Depends on:** `integrations/EMAIL‑INGESTION.md → EMAIL‑INGEST‑002`, `EMAIL‑INGEST‑004`
**Blocks:** `FRONT‑EMAIL‑TRIAGE‑001`

### [ ] FRONT‑EMAIL‑TRIAGE‑001: Triage Workspace UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No inbox triage UI exists.

**Description:** Build a split-pane inbox workspace with email preview, convert-to-task actions, assignment controls, and archive/reply workflow.

**Depends on:** `integrations/EMAIL‑INGESTION.md → EMAIL‑INGEST‑002`, `EMAIL‑INGEST‑003`, `EMAIL‑INGEST‑005`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/pages/Triage.tsx`

## Subtasks
- [ ] EMAIL‑INGEST‑001.1 (AGENT): Define inbound provider contract and normalized email schema.
- [ ] EMAIL‑INGEST‑002.1 (AGENT): Map parsed email fields into CRM activities and tasks.
- [ ] EMAIL‑INGEST‑003.1 (AGENT): Define attachment extraction and storage handoff.
- [ ] EMAIL‑INGEST‑004.1 (AGENT): Model shared inbox ownership and assignment rules.
- [ ] EMAIL‑INGEST‑005.1 (AGENT): Define delegation states and audit requirements.
- [ ] FRONT‑EMAIL‑TRIAGE‑001.1 (AGENT): Design the triage workspace interactions and empty states.