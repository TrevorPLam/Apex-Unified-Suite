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
**TDD:** Write integration tests first (red), then implement service logic, then refactor. Test coverage includes conversion validation, duplicate prevention, and event emission.  
**BDD:** Covers "Lead conversion to contact/company/deal" scenarios with proper validation.  
**Deep Module:** Encapsulates conversion logic, entity creation, and activity logging behind simple endpoint.  

**Advanced Code Patterns:**  
- Transactional data consistency across multiple entities  
- Idempotent conversion operations to prevent duplicate processing  
- Domain event emission with structured payload data  
- Entity relationship management with proper cascade handling  

**Anti-Patterns:**  
- Non-transactional conversion that could leave data inconsistent  
- Missing duplicate detection leading to data integrity issues  
- Direct entity manipulation without service layer abstraction  
- Incomplete activity logging for audit trails

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
**TDD:** Integration tests drive the implementation of duplicate detection algorithms and merge transaction logic.  
**BDD:** Covers "Duplicate lead detection and merging" scenarios with survivorship rules.  
**Deep Module:** Encapsulates duplicate detection algorithms, merge logic, and reference updates behind simple API.  

**Advanced Code Patterns:**  
- Configurable duplicate detection algorithms (email, phone, fuzzy matching)  
- Transactional merge operations with atomic consistency  
- Survivorship rules for field selection during merge  
- Reference integrity maintenance across related entities  

**Anti-Patterns:**  
- Non-atomic merge operations leading to data inconsistency  
- Hard-coded survivorship rules without configurability  
- Missing reference updates causing orphaned data  
- Incomplete audit logging for merge operations

---

### [ ] API‑CRM‑024: Follow‑Up Tasks API for CRM
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑006.  
**Definition of Done:** CRUD for CRM‑scoped tasks linked to leads/contacts/deals. `GET /crm/tasks?entityType=...&entityId=...`, `POST /crm/tasks`, `PATCH`, `DELETE` (soft). Separate from Project tasks.  
**Integration tests:** create task for lead, list, mark complete, delete.  
**TDD:** Test-driven development ensures task lifecycle management works correctly with CRM entity associations.  
**BDD:** Covers "Task management for CRM entities" scenarios.  
**Deep Module:** Encapsulates task-CRM entity relationships and lifecycle management.  

**Advanced Code Patterns:**  
- Entity-agnostic task association patterns  
- Soft delete with proper reference cleanup  
- Task status state machines with validation  
- Cross-entity task querying and filtering  

**Anti-Patterns:**  
- Mixing CRM tasks with Project tasks without clear separation  
- Missing entity validation allowing orphaned tasks  
- Hard-coded task types without extensibility  
- Incomplete soft delete handling

---

### [ ] API‑CRM‑025: Ownership & Assignment Management API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑009.  
**Definition of Done:** Endpoints to reassign ownership: `PATCH /crm/{entityType}/{id}/assign` – set `assigned_to`, `team_id`, `visibility`. Emits `AssignmentChanged` event and logs history. Also `GET /crm/my‑records` returning entities assigned to current user.  
**Integration tests:** change owner, verify history entry created, my‑records returns correct data.  
**TDD:** Integration tests verify ownership changes and audit trail creation.  
**BDD:** Covers "Ownership assignment and tracking" scenarios.  
**Deep Module:** Encapsulates ownership management, team assignments, and visibility rules.  

**Advanced Code Patterns:**  
- Role-based ownership validation  
- Audit trail generation for ownership changes  
- Team-based access control and visibility  
- Event-driven ownership change notifications  

**Anti-Patterns:**  
- Missing ownership validation allowing unauthorized access  
- Incomplete audit trail for ownership changes  
- Hard-coded team structures without flexibility  
- Missing visibility controls causing data exposure

---

### [ ] API‑CRM‑026: Composite 360° Workspace Endpoints
**Status:** ⏳ Not Started  
**Depends on:** All CRM CRUD APIs.  
**Definition of Done:** Aggregate endpoints:  
- `GET /crm/contacts/{id}/workspace` – includes related deals, activities, documents, tasks, engagements  
- `GET /crm/companies/{id}/workspace` – contacts, deals, revenue summary  
- `GET /crm/deals/{id}/workspace` – contacts, activities, documents, proposals  
**Integration tests:** verify nested data is correct, unauthorized access blocked.  
**TDD:** Integration tests drive the implementation of composite workspace endpoints.  
**BDD:** Covers "360-degree entity workspace view" scenarios.  
**Deep Module:** Encapsulates complex data aggregation and relationship resolution.  

**Advanced Code Patterns:**  
- Efficient data aggregation with minimal queries  
- Relationship graph traversal for workspace assembly  
- Permission-based data filtering in composite views  
- Caching strategies for complex workspace data  

**Anti-Patterns:**  
- N+1 query problems in workspace assembly  
- Missing permission checks causing data leaks  
- Inconsistent data structures across workspace types  
- Over-fetching unnecessary data in composite views

---

### [ ] API‑CRM‑027: Automatic Activity Ingestion Expansion
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑020 (Activity service), all other CRM services.  
**Definition of Done:** Modify LeadService, DealService, etc. to automatically create activity records (via `ActivityService`) for: stage changes, assignment changes, lead conversions, document events, email events, etc. No new endpoints.  
**Unit tests:** verify activities are created when those actions occur (mock ActivityService).  
**Integration tests:** perform an action via API and assert activity appears in list.  
**TDD:** Test-driven approach ensures activity ingestion works automatically for all CRM operations.  
**BDD:** Covers "Automatic activity logging for CRM actions" scenarios.  
**Deep Module:** Encapsulates event-driven activity creation across multiple services.  

**Advanced Code Patterns:**  
- Event-driven architecture for activity creation  
- Service integration with dependency injection  
- Configurable activity types and templates  
- Async activity processing with error handling  

**Anti-Patterns:**  
- Missing activity logging for important business events  
- Synchronous activity creation blocking main operations  
- Hard-coded activity mappings without configurability  
- Inconsistent activity data across different event types

---

### [ ] API‑CRM‑028: Email Mailbox Connection API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑010.  
**Definition of Done:** Endpoints to connect a user's mailbox: `POST /crm/mailbox‑connections`, `DELETE`, `GET` status. OAuth flow for Google/Outlook.  
**Integration tests:** connection creation, listing, deletion.  
**TDD:** Integration tests drive OAuth flow implementation and mailbox connection management.  
**BDD:** Covers "Email mailbox connection for CRM integration" scenarios.  
**Deep Module:** Encapsulates OAuth flows, mailbox authentication, and connection lifecycle.  

**Advanced Code Patterns:**  
- OAuth 2.0 flows for Google/Outlook integration  
- Secure credential storage and refresh token management  
- Connection health monitoring and auto-reconnection  
- Multi-provider mailbox abstraction  

**Anti-Patterns:**  
- Storing credentials in plain text  
- Missing token refresh logic causing connection failures  
- Hard-coded provider implementations without abstraction  
- Incomplete error handling for OAuth flows

---

### [ ] API‑CRM‑029: CRM Email Sync & Inbox API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑011.  
**Definition of Done:** `GET /crm/messages?linkedEntityType=...&linkedEntityId=...` – list messages for a thread or entity. `POST /crm/messages/send` – send reply with linked entity. Sync triggered manually or via webhook; stores messages and links.  
**Integration tests:** send message via API, verify it appears in thread; sync mock.  
**TDD:** Test-driven development ensures email sync and thread management work correctly.  
**BDD:** Covers "CRM email integration and thread management" scenarios.  
**Deep Module:** Encapsulates email synchronization, threading, and CRM entity linking.  

**Advanced Code Patterns:**  
- Email thread detection and management  
- Entity linking with automatic relationship inference  
- Incremental sync with change detection  
- Webhook-based real-time sync integration  

**Anti-Patterns:**  
- Missing thread detection creating duplicate conversations  
- Incomplete entity linking causing orphaned emails  
- Full sync instead of incremental sync inefficiency  
- Missing conflict resolution for concurrent sync

---

### [ ] API‑CRM‑030: CRM Email Template Library API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑012.  
**Definition of Done:** CRUD for CRM templates. `GET /crm/templates?category=...`, `POST`, `PATCH`, `DELETE`. Preview rendering with sample data.  
**Integration tests:** create, list, update, delete; preview returns rendered text.  
**TDD:** Test-driven approach ensures template management and rendering work correctly.  
**BDD:** Covers "Email template library management" scenarios.  
**Deep Module:** Encapsulates template storage, rendering, and category management.  

**Advanced Code Patterns:**  
- Template inheritance and composition  
- Secure template rendering with sandboxing  
- Variable validation and type checking  
- Template versioning and rollback capabilities  

**Anti-Patterns:**  
- Insecure template rendering allowing code injection  
- Missing variable validation causing rendering errors  
- Hard-coded template structure without flexibility  
- Incomplete template management lifecycle

---

### [ ] API‑CRM‑031: Engagement Aggregate API
**Status:** ⏳ Not Started  
**Depends on:** DB‑CRM‑013.  
**Definition of Done:** CRUD for proposals, contracts, renewals. Status transitions: draft → sent → accepted/rejected/expired. Link to documents and deals. Emits events `EngagementCreated`, `EngagementStatusChanged`.  
**Integration tests:** create proposal, send, accept, reject; verify links.  
**TDD:** Integration tests drive engagement lifecycle management and document linking.  
**BDD:** Covers "Engagement and proposal lifecycle management" scenarios.  
**Deep Module:** Encapsulates engagement state machines, document relationships, and business rules.  

**Advanced Code Patterns:**  
- State machine pattern for engagement lifecycle  
- Document relationship management with version tracking  
- Event-driven status change notifications  
- Configurable approval workflows  

**Anti-Patterns:**  
- Missing state validation allowing invalid transitions  
- Incomplete document linking causing broken references  
- Hard-coded workflows without business rule flexibility  
- Missing audit trail for engagement changes

---

### [ ] API‑CRM‑032: Proposal Generation from Deal
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑031, API‑DOCS‑... (document generation).  
**Definition of Done:** `POST /crm/deals/{dealId}/generate‑proposal` – creates a proposal engagement, optionally generates a document from template, and initiates e‑sign. Returns the engagement ID.  
**Integration tests:** generate proposal, verify engagement and document created.  
**TDD:** Test-driven development ensures proposal generation workflow works end-to-end.  
**BDD:** Covers "Automated proposal generation from deals" scenarios.  
**Deep Module:** Encapsulates document generation, template application, and engagement creation.  

**Advanced Code Patterns:**  
- Template-based document generation  
- Async document processing with status tracking  
- Integration with e-signature workflows  
- Deal-to-proposal data mapping and transformation  

**Anti-Patterns:**  
- Synchronous document generation blocking operations  
- Missing template validation causing generation errors  
- Incomplete data mapping from deals to proposals  
- Missing error handling for generation failures

---

### [ ] API‑CRM‑033: Renewal Lifecycle API
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑031.  
**Definition of Done:** Endpoints to manage renewal records: `GET /crm/renewals` (filter by upcoming), `POST /crm/engagements/{id}/renew`, etc. Automatic reminders and status updates.  
**Integration tests:** create renewal, set reminder, confirm renewal.  
**TDD:** Integration tests drive renewal lifecycle management and automation.  
**BDD:** Covers "Renewal lifecycle management and automation" scenarios.  
**Deep Module:** Encapsulates renewal tracking, reminder systems, and automated workflows.  

**Advanced Code Patterns:**  
- Automated reminder scheduling and delivery  
- Renewal forecasting and probability tracking  
- Configurable renewal workflows and business rules  
- Integration with notification systems  

**Anti-Patterns:**  
- Missing reminder logic causing renewal delays  
- Hard-coded renewal periods without flexibility  
- Incomplete renewal tracking and forecasting  
- Missing notification integration for renewal alerts

---

### [ ] API‑CRM‑034: Rules‑Based Lead/Deal Scoring (No ML)
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005, API‑CRM‑017  
**Why updated:** ActiveCampaign provides a no‑code scoring interface that is a primary CRM feature; it doesn't require machine learning. The original plan placed it entirely in P10 AI.  
**Definition of Done:**
- `POST /api/v1/crm/scoring-rules` – create a scoring rule (e.g., "Add 10 points when contact opens an email", "Subtract 5 points when email bounces").  
- `GET /api/v1/crm/scoring-rules` – list rules.  
- `PATCH /api/v1/crm/scoring-rules/{ruleId}` – update rule.  
- `DELETE /api/v1/crm/scoring-rules/{ruleId}` – soft delete.  
- Scoring engine evaluates rules synchronously on relevant events (email opened, page visited, form submitted) and updates the `score` field on the lead/contact/deal.  
- Score history is stored in a `score_log` table (with timestamp, rule that fired, and value).  
- UI: a table‑based rule builder where non‑technical users can add conditions and assign point values.  
**BDD:** "As a sales manager, I can set up scoring rules so that leads who visit the pricing page get an extra 20 points."  
**TDD:** Unit test verifying that when an email open event arrives, the scoring engine increments the score by the configured value.  
**Deep Module:** Encapsulates scoring rule evaluation, score calculation, and history tracking.  

**Advanced Code Patterns:**  
- Event-driven scoring evaluation with real-time updates  
- Configurable rule conditions with flexible field matching  
- Score history tracking with audit trail capabilities  
- Batch scoring recalculation for rule changes  

**Anti-Patterns:**  
- Synchronous scoring evaluation blocking main operations  
- Missing score history causing audit trail gaps  
- Hard-coded scoring logic without rule flexibility  
- Incomplete event handling for scoring triggers

---

### [ ] API‑CRM‑035: Deal Automation Triggers on Field‑Change Events
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑017, AUTO‑CRM‑001  
**Why updated:** ActiveCampaign's deal automations can fire on owner change, pipeline stage change, value change, or expected close date change. Currently, only stage‑based automations are described.  
**Definition of Done:**
- Extend `AUTO‑CRM‑001` rules engine to accept triggers for: `deal.owner_changed`, `deal.value_changed`, `deal.expected_close_date_changed`, `deal.stage_changed`.  
- When a deal is updated via `PATCH`, the service publishes specific domain events (`DealOwnerChanged`, `DealValueChanged`, etc.).  
- Automation rules listen to these events and create tasks, send emails, or update fields.  
**BDD:** "When a deal's owner is changed, automatically reassign all linked follow‑up tasks to the new owner."  
**TDD:** Integration test verifying that deal field changes trigger appropriate automation rules.  
**Deep Module:** Encapsulates deal event emission and automation trigger handling.  

**Advanced Code Patterns:**  
- Domain event emission for deal field changes  
- Event-driven automation rule evaluation  
- Transactional consistency between deal updates and event emission  
- Configurable automation triggers with field-specific logic  

**Anti-Patterns:**  
- Missing event emission for deal field changes  
- Inconsistent automation trigger handling across field types  
- Synchronous automation processing blocking deal updates  
- Incomplete audit trail for automation triggers

---

### [ ] API‑CRM‑050: CRM Domain Events Verification
**Status:** ⏳ Not Started  
**Depends on:** All CRM services, DB‑SETTINGS‑002.  
**Definition of Done:** Verify the following events are emitted and appear in audit log via integration test: `LeadCreated`, `LeadStageChanged`, `LeadConverted`, `DuplicateMerged`, `DealCreated`, `DealStageChanged`, `EngagementCreated`, `EngagementStatusChanged`, `RenewalDue`.  
**Subtasks:** write integration tests that perform the actions and then query audit logs for corresponding entries.  
**TDD:** Integration tests verify domain events are properly emitted and recorded.  
**BDD:** Covers "Domain event verification and audit trail validation" scenarios.  
**Deep Module:** Encapsulates event verification and audit log querying.  

**Advanced Code Patterns:**  
- Event-driven architecture verification  
- Audit log querying and filtering  
- Cross-service event consistency validation  
- Event payload structure verification  

**Anti-Patterns:**  
- Missing event emission breaking audit trails  
- Inconsistent event structures across services  
- Missing event verification in testing  
- Incomplete audit log coverage for business events

---
