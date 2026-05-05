# tasks/documents/DOCUMENTS‑ENTERPRISE.md – Documents: Enterprise Features

This file covers enterprise‑grade document security and lifecycle management: advanced permission matrices, dynamic watermarking, DRM protections, virtual data rooms, custom workflow builders, and document retention/archival policies. These tasks build on core document management and sharing capabilities.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] ENT‑DOCS‑001: Enterprise Document Management (Permission Matrices, Watermarking & DRM)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Basic share links and folder‑level permissions exist, but no fine‑grained permission matrix, dynamic watermarking, DRM, or comprehensive document audit trail.
**Size:** Large

**Description:** Implement enterprise‑grade document security: advanced permission matrices (role‑based, document‑type‑based, time‑based access), dynamic user‑specific watermarking on view/download, DRM protections (disable download, copy/paste, printing), bulk document operations with progress tracking, and a comprehensive document audit trail.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑004`, `integrations/INTEGRATION‑STORAGE.md → INT‑STORAGE‑001`
**Blocks:** `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑003`
**Related Files:** `artifacts/api‑server/src/services/documents/enterprise/permission‑matrix‑service.ts`, `watermark‑service.ts`, `drm‑service.ts`, `bulk‑operations‑service.ts`, `audit‑trail‑service.ts`, `artifacts/apex‑os/src/components/documents/enterprise/PermissionMatrix.tsx`, `DocumentDRM.tsx`

**Definition of Done**
- [ ] **Permission matrix**: role‑based, document‑type‑based, and time‑based access controls per document/folder; permission inheritance with override; admin UI matrix component.
- [ ] **Dynamic watermarking**: server‑side (sharp) and client‑side (CSS overlay) watermarks with configurable content (`{username}`, `{email}`, `{date}`, `{ip}`).
- [ ] **DRM protections**: disable download, copy/paste, and printing per document; enforced server‑side (signed URLs) and client‑side (UI blocks).
- [ ] **Bulk document operations**: multi‑select documents for bulk permissions, move, delete with progress tracking and undo.
- [ ] **Comprehensive audit trail**: every access, edit, share, permission change, and DRM event logged; filterable timeline viewer and export.
- [ ] Unit tests for all services; component tests for UI.
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- enterprise‑documents
pnpm --filter @workspace/apex‑os test -- PermissionMatrix.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Permission matrix, watermarking, and DRM are policies enforced by the Documents bounded context.
- TDD: Write unit tests for each policy evaluator; test watermark application and DRM enforcement.
- BDD: “As a compliance officer, I can configure fine‑grained permissions so that only authorised users can view sensitive documents, and every access is logged with a full audit trail.”
- Deep Module: `PermissionMatrixService.evaluateAccess(userId, documentId, 'download')` hides policy evaluation, caching, and audit logging.

---

### Subtasks
- [ ] ENT‑DOCS‑001.0.25 (AGENT): Read the Document domain schema and existing permission model.
- [ ] ENT‑DOCS‑001.1 (AGENT): Define schemas for `document_permissions`, `document_watermark_config`, `document_drm_config`, `document_audit_log`. **File:** `lib/db/src/schema/documents/enterprise/` **Verification:** `pnpm --filter @workspace/db run push` (requires human approval).
- [ ] ENT‑DOCS‑001.2 (AGENT): Implement `PermissionMatrixService`. **File:** `permission‑matrix‑service.ts` **Verification:** Unit tests pass.
- [ ] ENT‑DOCS‑001.3 (AGENT): Implement `WatermarkService`. **File:** `watermark‑service.ts` **Verification:** Download and viewer watermarks work.
- [ ] ENT‑DOCS‑001.4 (AGENT): Implement `DRMService` and `DocumentDRM` component. **File:** `drm‑service.ts`, `DocumentDRM.tsx` **Verification:** Restrictions enforced.
- [ ] ENT‑DOCS‑001.5 (AGENT): Implement `BulkOperationsService`. **File:** `bulk‑operations‑service.ts` **Verification:** Bulk actions work with progress.
- [ ] ENT‑DOCS‑001.6 (AGENT): Implement `DocumentAuditTrailService` and audit viewer. **File:** `audit‑trail‑service.ts`, `AuditTrail.tsx` **Verification:** All events logged.
- [ ] ENT‑DOCS‑001.7 (AGENT): Build `PermissionMatrix` admin UI. **File:** `PermissionMatrix.tsx` **Verification:** Component tests pass.
- [ ] ENT‑DOCS‑001.8 (AGENT): Run `pnpm run typecheck` and fix any errors.
- [ ] ENT‑DOCS‑001.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] ENT‑DOCS‑002: Document Workflow Automation (Approval Workflows & Template Automation)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Basic approval workflows exist (linear approve/reject). No conditional routing, templates, CRM/Projects triggers, or workflow analytics.
**Size:** Large

**Description:** Extend document approval workflows with conditional routing, reusable workflow templates with version control, CRM/Projects integration triggers, automated notifications and escalations, and a workflow analytics dashboard.

**Depends on:** `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑001`, `documents/DOCUMENTS‑SHARING.md → API‑DOCS‑010`
**Blocks:** `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑004`
**Related Files:** `artifacts/api‑server/src/services/documents/workflows/approval‑workflow‑engine.ts`, `workflow‑template‑service.ts`, `workflow‑triggers.ts`, `analytics‑service.ts`, `artifacts/apex‑os/src/components/documents/workflows/ApprovalWorkflows.tsx`

**Definition of Done**
- [ ] **Conditional routing**: branch on document type, amount, custom metadata.
- [ ] **Workflow templates**: reusable patterns with version control; apply template to pre‑fill workflow.
- [ ] **CRM/Projects triggers**: `DealWon` → initiate contract generation; `MilestoneReached` → initiate deliverable approval.
- [ ] **Escalations**: configurable multi‑level escalation chains with deadlines and notifications.
- [ ] **Workflow analytics**: KPIs (avg approval time, bottlenecks), charts, filterable dashboard.
- [ ] Unit tests for engine, templates, triggers; component tests for UI.
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- workflows
pnpm --filter @workspace/apex‑os test -- ApprovalWorkflows.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Workflow automation is a domain service within the Documents bounded context.
- TDD: Write tests for state machine transitions, conditional branching, and template versioning.
- BDD: “When a contract is uploaded that exceeds $100,000 in value, it automatically routes to the CFO for additional approval.”
- Deep Module: `ApprovalWorkflowEngine.processApproval(workflowId, stepId, userId, action)` hides state machine, branching, and notifications.

---

### Subtasks
- [ ] ENT‑DOCS‑002.0.25 (AGENT): Read existing approval workflow API and event bus.
- [ ] ENT‑DOCS‑002.1 (AGENT): Extend schema for branching, templates, escalation rules. **Verification:** `pnpm --filter @workspace/db run push` (requires human approval).
- [ ] ENT‑DOCS‑002.2 (AGENT): Implement `ApprovalWorkflowEngine` with conditional branching. **File:** `approval‑workflow‑engine.ts` **Verification:** Unit tests pass.
- [ ] ENT‑DOCS‑002.3 (AGENT): Implement `WorkflowTemplateService` with version control. **File:** `workflow‑template‑service.ts` **Verification:** Templates work with backward compatibility.
- [ ] ENT‑DOCS‑002.4 (AGENT): Implement `WorkflowTriggerService` for CRM/Projects integration. **File:** `workflow‑triggers.ts` **Verification:** `DealWon` creates workflow.
- [ ] ENT‑DOCS‑002.5 (AGENT): Implement escalation engine. **Verification:** Overdue approvals escalate.
- [ ] ENT‑DOCS‑002.6 (AGENT): Build workflow analytics service and dashboard. **File:** `analytics‑service.ts`, `WorkflowAnalytics.tsx` **Verification:** Dashboard displays KPIs.
- [ ] ENT‑DOCS‑002.7 (AGENT): Run `pnpm run typecheck`.
- [ ] ENT‑DOCS‑002.N (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## [ ] ENT‑DOCS‑003: Virtual Data Room (VDR)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Virtual Data Room (VDR) functionality exists.
**Size:** Large

**Description:** Build a complete VDR module: secure workspaces with root folders, granular per‑user/per‑group access controls, view‑only mode with DRM and watermarking, full activity audit trail, time‑limited access with expiry, and transaction archiving with compliance report generation.

**Depends on:** `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑001`, `documents/DOCUMENTS‑MANAGEMENT.md → DB‑DOCS‑007`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/documents/enterprise/vdr‑service.ts`, `artifacts/api‑server/src/routes/documents/vdr.ts`, `artifacts/apex‑os/src/components/documents/enterprise/VDRCreator.tsx`, `VDRViewer.tsx`

**Definition of Done**
- [ ] **VDR creation wizard**: multi‑step form (name, root folder, ACL, time limits, confirm).
- [ ] **VDR viewer**: restricted document viewer with DRM, dynamic watermark, and access logging.
- [ ] **VDR audit dashboard**: real‑time activity feed, filterable, exportable compliance report.
- [ ] **VDR closure and archiving**: immediate revocation of access; archive generates comprehensive activity report.
- [ ] Unit tests for VDR service; component tests for creator and viewer.
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- vdr
pnpm --filter @workspace/apex‑os test -- VDRCreator.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: VDR is a sub‑context within the Documents bounded context, extending the Document aggregate with a restricted access mode.
- TDD: Write integration test that creates a VDR, adds a user, verifies access, closes the VDR, and verifies access is denied.
- BDD: “As an investment banker, I can create a secure data room, grant time‑limited access to specific buyers, and track every document they view.”

---

### Subtasks
- [ ] ENT‑DOCS‑003.0.25 (AGENT): Read ENT‑DOCS‑001 permission matrix, watermark, DRM services.
- [ ] ENT‑DOCS‑003.1 (AGENT): Define VDR schemas. **File:** `lib/db/src/schema/documents/enterprise/vdr.ts` **Verification:** `pnpm --filter @workspace/db run push` (requires human approval).
- [ ] ENT‑DOCS‑003.2 (AGENT): Implement `VDRService` with access enforcement and audit logging. **File:** `vdr‑service.ts` **Verification:** Unit tests pass.
- [ ] ENT‑DOCS‑003.3 (AGENT): Build `VDRCreator` wizard component. **File:** `VDRCreator.tsx` **Verification:** Component renders.
- [ ] ENT‑DOCS‑003.4 (AGENT): Build `VDRViewer` component with DRM and watermark. **File:** `VDRViewer.tsx` **Verification:** Viewer enforces restrictions.
- [ ] ENT‑DOCS‑003.5 (AGENT): Build VDR audit dashboard. **File:** `VDRAuditDashboard.tsx` **Verification:** Dashboard shows activity.
- [ ] ENT‑DOCS‑003.6 (AGENT): Implement VDR closure and archiving with compliance report. **File:** `vdr‑service.ts` **Verification:** Closure revokes access; report generated.
- [ ] ENT‑DOCS‑003.7 (AGENT): Run `pnpm run typecheck`.
- [ ] ENT‑DOCS‑003.N (HUMAN): Final review – test full VDR lifecycle. **Verification:** Approved.

---

## [ ] ENT‑DOCS‑004: Custom Workflow Builder (Visual Drag‑and‑Drop)
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Workflows are configured via structured forms only. No visual builder exists.
**Size:** Large

**Description:** Build a no‑code, drag‑and‑drop workflow designer for document processes. Users drag steps onto a canvas, connect them to define sequence and branching, configure each step, preview with sample data, and publish as reusable templates.

**Depends on:** `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑002`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/documents/workflows/WorkflowBuilder.tsx`, `StepLibrary.tsx`, `ConnectionValidator.ts`

**Definition of Done**
- [ ] Visual canvas (react‑flow) with drag‑and‑drop from step library sidebar.
- [ ] Step library includes: Upload, Review, Approve, Reject, Sign, Archive, Notify, Conditional Branch, etc.
- [ ] Properties panel for step configuration (participants, deadlines, conditions).
- [ ] Connection validator with real‑time feedback (invalid connections, orphan steps).
- [ ] Preview/Simulation mode with sample data traversal.
- [ ] Publish as template; auto‑save drafts.
- [ ] Component tests for canvas operations and validation.
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- WorkflowBuilder.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The workflow builder is a presentation‑layer tool; it creates workflow definitions (templates) that the domain engine executes.
- TDD: Write component tests simulating drag, connect, and validation.
- BDD: “As a business analyst, I can visually design a document workflow by dragging steps onto a canvas and connecting them, without writing any code.”

---

### Subtasks
- [ ] ENT‑DOCS‑004.0.25 (AGENT): Research react‑flow and drag‑and‑drop canvas patterns.
- [ ] ENT‑DOCS‑004.1 (AGENT): Build visual canvas with react‑flow and step library. **File:** `WorkflowBuilder.tsx`, `StepLibrary.tsx` **Verification:** Canvas renders; steps draggable.
- [ ] ENT‑DOCS‑004.2 (AGENT): Build properties panel for step configuration. **Verification:** Double‑click opens panel.
- [ ] ENT‑DOCS‑004.3 (AGENT): Implement `ConnectionValidator` with type compatibility and orphan detection. **File:** `ConnectionValidator.ts` **Verification:** Invalid connections rejected.
- [ ] ENT‑DOCS‑004.4 (AGENT): Implement undo/redo and keyboard shortcuts.
- [ ] ENT‑DOCS‑004.5 (AGENT): Implement preview/simulation mode.
- [ ] ENT‑DOCS‑004.6 (AGENT): Implement publish/draft save with auto‑save.
- [ ] ENT‑DOCS‑004.7 (AGENT): Run `pnpm run typecheck`.
- [ ] ENT‑DOCS‑004.N (HUMAN): Final review – build a multi‑step workflow and verify it executes. **Verification:** Approved.

---

## [ ] ENT‑DOCS‑005: Document Retention & Archival Policies
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No automated retention or archival policies exist. Documents remain in active storage indefinitely.
**Size:** Large

**Description:** Implement folder‑level retention rules (auto‑delete N days after upload), auto‑archiving (move to archive after idle period), compliance holds (legal preservation), policy inheritance, retention preview, and scheduled background enforcement with logging.

**Depends on:** `documents/DOCUMENTS‑MANAGEMENT.md → API‑DOCS‑014`, `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑001`
**Blocks:** [N/A]
**Related Files:** `artifacts/api‑server/src/services/documents/enterprise/retention‑policy‑service.ts`, `archive‑service.ts`, `compliance‑hold‑service.ts`, `artifacts/api‑server/src/jobs/retention‑enforcer.ts`, `artifacts/apex‑os/src/components/documents/enterprise/RetentionPolicyManager.tsx`

**Definition of Done**
- [ ] Retention rule CRUD per folder with policy inheritance and preview.
- [ ] Auto‑archiving based on idle time with pre‑archive notifications.
- [ ] Compliance holds that prevent deletion/archival; release requires MFA; full audit trail.
- [ ] Scheduled enforcement job (daily) respecting compliance holds; enforcement log.
- [ ] Admin UI for managing policies, holds, and viewing enforcement logs.
- [ ] Unit tests for services; component tests for UI.
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- retention
pnpm --filter @workspace/apex‑os test -- RetentionPolicyManager.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Retention and archival policies are infrastructure policies within the Documents bounded context.
- TDD: Write integration test that creates a retention policy, uploads a file, simulates time passage, and verifies enforcement.
- BDD: “As a compliance officer, I can set retention policies that automatically manage document lifecycle, and place legal holds that prevent deletion during litigation.”

---

### Subtasks
- [ ] ENT‑DOCS‑005.0.25 (AGENT): Read existing API‑DOCS‑014 and storage adapter.
- [ ] ENT‑DOCS‑005.1 (AGENT): Define retention, archive, compliance hold schemas. **File:** `lib/db/src/schema/documents/enterprise/policies.ts` **Verification:** `pnpm --filter @workspace/db run push` (requires human approval).
- [ ] ENT‑DOCS‑005.2 (AGENT): Implement `RetentionPolicyService`. **File:** `retention‑policy‑service.ts` **Verification:** Unit tests for inheritance and preview.
- [ ] ENT‑DOCS‑005.3 (AGENT): Implement `ArchiveService`. **File:** `archive‑service.ts` **Verification:** Idle files identified and archived.
- [ ] ENT‑DOCS‑005.4 (AGENT): Implement `ComplianceHoldService` with MFA and audit. **File:** `compliance‑hold‑service.ts` **Verification:** Holds prevent deletion.
- [ ] ENT‑DOCS‑005.5 (AGENT): Implement `RetentionEnforcerJob` background job. **File:** `retention‑enforcer.ts` **Verification:** Enforcement runs; holds respected.
- [ ] ENT‑DOCS‑005.6 (AGENT): Build `RetentionPolicyManager` admin UI. **File:** `RetentionPolicyManager.tsx` **Verification:** Component tests pass.
- [ ] ENT‑DOCS‑005.7 (AGENT): Run `pnpm run typecheck`.
- [ ] ENT‑DOCS‑005.N (HUMAN): Final review – test full policy enforcement lifecycle. **Verification:** Approved.

---