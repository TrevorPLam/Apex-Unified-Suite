# TODO-P3-CRM-DEPTH.md – Phase 3: CRM Depth Features

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers the CRM context depth features – advanced functionality from the CRM Delta and ActiveCampaign research. All tasks follow the established patterns: contract‑first, test‑first, service‑as‑deep‑module, Either error handling, and domain event emission.

---

## CRM – Depth (Delta + ActiveCampaign research)

### [ ] API‑CRM‑022: Lead Conversion API
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005 (leads green), DB‑CRM‑007 (lead_conversions).  
**Definition of Done:** `POST /crm/leads/{leadId}/convert` – accepts target type (`contact`/`company`/`deal`) and target ID or create‑new payload. Transactionally:
- Marks the lead as converted (`converted_at`, etc.)
- Creates the target entity if not already existing (e.g., new contact)
- Inserts a `LeadConverted` activity
- Emits `LeadConverted` domain event
- Prevents duplicate conversion (idempotent)  
Returns 200 with converted entity link.  
**Integration tests:** successful conversion, duplicate lead conversion rejected, invalid target type, lead not found.

### Subtasks:
- [ ] API‑CRM‑022.1: Add conversion endpoint to OpenAPI spec. (AGENT)  
- [ ] API‑CRM‑022.2: Write integration tests (red). (AGENT)  
- [ ] API‑CRM‑022.3: Extend LeadService with `convertLead` method. (AGENT)  
- [ ] API‑CRM‑022.4: Create route, run tests to green. (AGENT)

---

### [ ] API‑CRM‑023: Duplicate Detection & Merge API
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005, DB‑CRM‑008.  
**Definition of Done:**  
- `GET /crm/leads/duplicates` – returns list of potential duplicate pairs based on email/phone matching.  
- `POST /crm/leads/merge` – accepts primary and secondary IDs, applies survivorship rules, updates all references, soft‑deletes secondary, logs merge event.  
Similarly for contacts and companies.  
**Integration tests:** detect duplicates, merge leads successfully, verify secondary is deleted, merge history recorded.

---

### [ ] API‑CRM‑024: Follow‑Up Tasks API for CRM
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑006.  
**Definition of Done:** CRUD for CRM‑scoped tasks linked to leads/contacts/deals. `GET /crm/tasks?entityType=...&entityId=...`, `POST /crm/tasks`, `PATCH`, `DELETE` (soft). Separate from Project tasks.  
**Integration tests:** create task for lead, list, mark complete, delete.

---

### [ ] API‑CRM‑025: Ownership & Assignment Management API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑009.  
**Definition of Done:** Endpoints to reassign ownership: `PATCH /crm/{entityType}/{id}/assign` – set `assigned_to`, `team_id`, `visibility`. Emits `AssignmentChanged` event and logs history. Also `GET /crm/my‑records` returning entities assigned to current user.  
**Integration tests:** change owner, verify history entry created, my‑records returns correct data.

---

### [ ] API‑CRM‑026: Composite 360° Workspace Endpoints
**Status:** ⏳ Not Started  
**Depends on:** All CRM CRUD APIs.  
**Definition of Done:** Aggregate endpoints:  
- `GET /crm/contacts/{id}/workspace` – includes related deals, activities, documents, tasks, engagements  
- `GET /crm/companies/{id}/workspace` – contacts, deals, revenue summary  
- `GET /crm/deals/{id}/workspace` – contacts, activities, documents, proposals  
**Integration tests:** verify nested data is correct, unauthorized access blocked.

---

### [ ] API‑CRM‑027: Automatic Activity Ingestion Expansion
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑020 (Activity service), all other CRM services.  
**Definition of Done:** Modify LeadService, DealService, etc. to automatically create activity records (via `ActivityService`) for: stage changes, assignment changes, lead conversions, document events, email events, etc. No new endpoints.  
**Unit tests:** verify activities are created when those actions occur (mock ActivityService).  
**Integration tests:** perform an action via API and assert activity appears in list.

---

### [ ] API‑CRM‑028: Email Mailbox Connection API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑010.  
**Definition of Done:** Endpoints to connect a user's mailbox: `POST /crm/mailbox‑connections`, `DELETE`, `GET` status. OAuth flow for Google/Outlook.  
**Integration tests:** connection creation, listing, deletion.

---

### [ ] API‑CRM‑029: CRM Email Sync & Inbox API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑011.  
**Definition of Done:** `GET /crm/messages?linkedEntityType=...&linkedEntityId=...` – list messages for a thread or entity. `POST /crm/messages/send` – send reply with linked entity. Sync triggered manually or via webhook; stores messages and links.  
**Integration tests:** send message via API, verify it appears in thread; sync mock.

---

### [ ] API‑CRM‑030: CRM Email Template Library API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑012.  
**Definition of Done:** CRUD for CRM templates. `GET /crm/templates?category=...`, `POST`, `PATCH`, `DELETE`. Preview rendering with sample data.  
**Integration tests:** create, list, update, delete; preview returns rendered text.

---

### [ ] API‑CRM‑031: Engagement Aggregate API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑013.  
**Definition of Done:** CRUD for proposals, contracts, renewals. Status transitions: draft → sent → accepted/rejected/expired. Link to documents and deals. Emits events `EngagementCreated`, `EngagementStatusChanged`.  
**Integration tests:** create proposal, send, accept, reject; verify links.

---

### [ ] API‑CRM‑032: Proposal Generation from Deal
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑031, API‑DOCS‑... (document generation).  
**Definition of Done:** `POST /crm/deals/{dealId}/generate‑proposal` – creates a proposal engagement, optionally generates a document from template, and initiates e‑sign. Returns the engagement ID.  
**Integration tests:** generate proposal, verify engagement and document created.

---

### [ ] API‑CRM‑033: Renewal Lifecycle API
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑031.  
**Definition of Done:** Endpoints to manage renewal records: `GET /crm/renewals` (filter by upcoming), `POST /crm/engagements/{id}/renew`, etc. Automatic reminders and status updates.  
**Integration tests:** create renewal, set reminder, confirm renewal.

---

### [ ] API‑CRM‑050: CRM Domain Events Verification
**Status:** ⏳ Not Started  
**Depends on:** All CRM services, DB‑SETTINGS‑002.  
**Definition of Done:** Verify the following events are emitted and appear in audit log via integration test: `LeadCreated`, `LeadStageChanged`, `LeadConverted`, `DuplicateMerged`, `DealCreated`, `DealStageChanged`, `EngagementCreated`, `EngagementStatusChanged`, `RenewalDue`.  
**Subtasks:** write integration tests that perform the actions and then query audit logs for corresponding entries.

---
