# TODO-P5-CRM.md – CRM Frontend Integration

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

This part covers CRM Data Integration including leads pipeline, contacts/companies, deals/activities, and advanced CRM features.

---

## CRM Data Integration

### [ ] FRONT‑CRM‑001: CRM Lead Pipeline – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005 (leads API green).  
**Definition of Done:** Lead Kanban view in `CRM.tsx` uses `useLeadList` hook with stage filtering. Columns dynamically built from pipeline stages. Card drag‑and‑drop wired to `useUpdateLead` mutation. All mock data imports removed.  
**Related Files:** `artifacts/apex-os/src/pages/CRM.tsx`, potential extracted lead components.

**DDD:** Frontend Lead aggregate view; stage changes respect domain rules.  
**TDD:** Component test with MSW – verify leads render in correct columns; drag‑and‑drop calls update API; rollback on failure.

**Subtasks:**
- [ ] FRONT‑CRM‑001.1: Create `useLeadList` hook with stage filtering and pagination. (AGENT) – `src/hooks/crm/useLeadList.ts`  
  **verification:** Returns typed lead data; filter by stage works.
- [ ] FRONT‑CRM‑001.2: Replace mock leads in Kanban columns with API data; show loading skeleton during fetch. (AGENT)  
  **verification:** Leads appear in correct stage columns; empty stage shows empty state.
- [ ] FRONT‑CRM‑001.3: Wire drag‑and‑drop to `useUpdateLead` mutation with optimistic update and rollback on failure. (AGENT)  
  **verification:** Drag lead to new column → stage updates immediately; API error → card returns to original column; toast notification shown.

---

### [ ] FRONT‑CRM‑002: CRM Contacts & Companies – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑009 (contacts green), API‑CRM‑013 (companies green).  
**Definition of Done:** Contact and Company tables use `useContactList` and `useCompanyList` hooks. Search, sort, and pagination implemented. Soft‑delete actions wired. Ownership and visibility fields displayed.

**Subtasks:**
- [ ] FRONT‑CRM‑002.1: Create hooks `useContactList`, `useCompanyList`. (AGENT)  
- [ ] FRONT‑CRM‑002.2: Replace mock contact/company data in tables. (AGENT)  
- [ ] FRONT‑CRM‑002.3: Wire table sorting, searching, and pagination. (AGENT)  
- [ ] FRONT‑CRM‑002.4: Display `assigned_to` and `visibility` badges. (AGENT)

---

### [ ] FRONT‑CRM‑003: CRM Deals & Activities – Replace Mock Data
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑017 (deals green), API‑CRM‑021 (activities green).  
**Definition of Done:** Deal pipeline and activity timeline use `useDealList` and `useActivityList` hooks. Deal stage change via dropdown wired to mutation.

**Subtasks:**
- [ ] FRONT‑CRM‑003.1: Create hooks and replace mock data. (AGENT)  
- [ ] FRONT‑CRM‑003.2: Wire deal stage change mutation with optimistic update. (AGENT)

---

### [ ] FRONT‑INT‑CRM: CRM Interactive Features Wiring
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑CRM‑001, FRONT‑CRM‑002, FRONT‑CRM‑003, API‑CRM‑005 (routes exist).  
**Definition of Done:**  
- Drag‑and‑drop lead stage change calls `useUpdateLead` mutation (optimistic update: move card immediately, rollback on failure).  
- Create lead form uses `useCreateLead` mutation, on success invalidates lead list.  
- Deal stage change wired similarly.  
- Activity creation form hooks to `useCreateActivity`.  
- All mutation loading/error states displayed using toast notifications (sonner).  
- **Idempotency Key Reuse:** Frontend must store generated idempotency key in component state and retransmit same key on retry attempts for payment mutations; persists until success.

**Subtasks:**
- [ ] FRONT‑INT‑CRM.1: Wire `useCreateLead`, `useUpdateLead`, `useDeleteLead` to forms and drag‑and‑drop. (AGENT)  
- [ ] FRONT‑INT‑CRM.2: Wire `useCreateDeal`, `useUpdateDeal` mutations. (AGENT)  
- [ ] FRONT‑INT‑CRM.3: Wire `useCreateActivity` to activity creation form. (AGENT)  
- [ ] FRONT‑INT‑CRM.4: Add toast feedback for all mutation outcomes. (AGENT)

---

### [ ] FRONT‑CRM‑004: Lead Conversion UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑022 (lead conversion API).  
**Definition of Done:** "Convert to Contact" / "Convert to Deal" button on lead detail fires a wizard modal: selects target type, optionally creates new entity, confirms conversion. Success: lead marked converted, new entity created, activity logged. Failure: error message displayed.  
**Related Files:** `artifacts/apex-os/src/components/crm/LeadConversionWizard.tsx`

**Subtasks:**
- [ ] FRONT‑CRM‑004.1: Create `LeadConversionWizard` component with step‑by‑step flow. (AGENT)  
- [ ] FRONT‑CRM‑004.2: Wire to `useConvertLead` mutation; handle duplicate conversion error. (AGENT)  
- [ ] FRONT‑CRM‑004.3: Add component test with MSW. (AGENT)

---

### [ ] FRONT‑CRM‑005: Duplicate Detection & Merge UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑023 (duplicate detection & merge API).  
**Definition of Done:** Duplicate candidates shown as a collapsible panel on lead/contact/company list pages. Preview merge: side‑by‑side comparison of fields with survivorship selection. Execute merge: secondary record soft‑deleted, references updated. Confirmation dialog with undo note (merge cannot be undone, but can be reviewed).  
**Related Files:** `artifacts/apex-os/src/components/crm/DuplicatePanel.tsx`, `MergePreview.tsx`

**Subtasks:**
- [ ] FRONT‑CRM‑005.1: Implement duplicate panel and merge preview UI. (AGENT)  
- [ ] FRONT‑CRM‑005.2: Wire to `useMergeRecords` mutation. (AGENT)  
- [ ] FRONT‑CRM‑005.3: Component test with MSW. (AGENT)

---

### [ ] FRONT‑CRM‑006: Follow‑Up Task Management UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑024 (CRM follow‑up tasks API).  
**Definition of Done:** "Tasks" tab on lead/contact/deal detail shows list of CRM follow‑up tasks with due dates, assignees, and completion checkboxes. Create task form with entity pre‑linked. Mark complete, edit, delete.

**Subtasks:**
- [ ] FRONT‑CRM‑006.1: Implement CRM task list and create/edit forms. (AGENT)  
- [ ] FRONT‑CRM‑006.2: Wire to `useCRMTaskList`, `useCreateCRMTask`, `useUpdateCRMTask` hooks. (AGENT)  
- [ ] FRONT‑CRM‑006.3: Component test. (AGENT)

---

### [ ] FRONT‑CRM‑007: Email Mailbox Connection UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑028 (mailbox connection API).  
**Definition of Done:** Settings area (or CRM settings) where user connects Google/Outlook mailbox via OAuth. Displays connection status (active, error, sync cursor, last sync). Disconnect button.

**Subtasks:**
- [ ] FRONT‑CRM‑007.1: Implement mailbox connection management UI. (AGENT)  
- [ ] FRONT‑CRM‑007.2: Wire OAuth flow and connection status hooks. (AGENT)

---

### [ ] FRONT‑CRM‑008: CRM Email Inbox UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑029 (CRM email sync & inbox API).  
**Definition of Done:** Unified inbox view showing all synced email threads. Clicking a thread shows messages. Compose/reply form links to CRM records (lead, contact, deal). Sent messages logged as activities.

**Subtasks:**
- [ ] FRONT‑CRM‑008.1: Implement inbox thread list and message detail views. (AGENT)  
- [ ] FRONT‑CRM‑008.2: Wire compose/reply with linked entity. (AGENT)

---

### [ ] FRONT‑CRM‑009: CRM Email Template Management UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑030 (CRM email template library API).  
**Definition of Done:** Template editor with variable insertion (`{{contact.first_name}}`). Category filter (intro, follow‑up, proposal, contract). Preview with sample data.

**Subtasks:**
- [ ] FRONT‑CRM‑009.1: Implement template list, editor, and preview. (AGENT)  
- [ ] FRONT‑CRM‑009.2: Wire CRUD hooks. (AGENT)

---

### [ ] FRONT‑CRM‑010: Engagement Management UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑031 (engagement aggregate API).  
**Definition of Done:** Engagements tab shows proposals, contracts, and renewals with status indicators. Create engagement from contact/deal. Status transitions via button (Send, Accept, Reject).

**Subtasks:**
- [ ] FRONT‑CRM‑010.1: Build engagement list and detail views. (AGENT)  
- [ ] FRONT‑CRM‑010.2: Wire mutations for status transitions. (AGENT)

---

### [ ] FRONT‑CRM‑011: Renewal Lifecycle UI
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑033 (renewal lifecycle API).  
**Definition of Done:** Renewal dashboard showing upcoming renewals with countdown indicators. Action buttons: mark as renewed, extend, or cancel. Filter by status and date range.

**Subtasks:**
- [ ] FRONT‑CRM‑011.1: Implement renewal dashboard and action flows. (AGENT)  
- [ ] FRONT‑CRM‑011.2: Wire to renewal hooks. (AGENT)

---

### [ ] FRONT‑CRM‑012: Contact 360 Workspace
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑026 (360° workspace endpoints).  
**Definition of Done:** Full‑page contact detail with tabs: Overview (profile, ownership), Activity Timeline (chronological feed), Deals (linked deals with stage), Documents (linked documents), Tasks (follow‑up tasks). Quick actions: email, schedule meeting, add task, convert from lead.

**Subtasks:**
- [ ] FRONT‑CRM‑012.1: Implement Contact 360 page with tabbed layout. (AGENT)  
- [ ] FRONT‑CRM‑012.2: Wire each tab to corresponding aggregate API. (AGENT)

---

### [ ] FRONT‑CRM‑013: Company 360 Workspace
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑026.  
**Definition of Done:** Company workspace showing linked contacts (sortable), open deals, revenue summary, engagement history, document summary, and ownership. Quick actions: add contact, create deal, schedule meeting.

**Subtasks:**
- [ ] FRONT‑CRM‑013.1: Implement Company 360 page. (AGENT)  
- [ ] FRONT‑CRM‑013.2: Wire to company workspace API. (AGENT)

---

### [ ] FRONT‑CRM‑014: Deal Workspace
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑026.  
**Definition of Done:** Deal workspace with pipeline stage, linked contacts, next steps, documents, proposal/engagement actions, forecast metadata (expected close, probability, amount). Stage progression bar with current stage highlighted.

**Subtasks:**
- [ ] FRONT‑CRM‑014.1: Implement Deal workspace page. (AGENT)  
- [ ] FRONT‑CRM‑014.2: Wire to deal workspace API. (AGENT)

---

## Cross-References

### Dependencies on Other Files
- **TODO-P5-INFRA.md**: CRM components depend on FRONT‑INFRA‑001 error boundaries and FRONT‑INFRA‑002 loading skeletons
- **TODO-P5-AUTH.md**: CRM pages depend on FRONT‑AUTH‑002 protected routes
- **TODO-P5-DASHBOARD.md**: Dashboard CRM metrics depend on CRM API integration
- **TODO-P5-DOCUMENTS.md**: CRM document links depend on Documents integration

### Related Master Tracker Tasks
- **API‑CRM‑005**: Leads API must be green before FRONT‑CRM‑001
- **API‑CRM‑009/013**: Contacts/Companies APIs must be green before FRONT‑CRM‑002
- **API‑CRM‑017/021**: Deals/Activities APIs must be green before FRONT‑CRM‑003

---

## Verification Commands

### CRM Integration Verification
```bash
# Core CRM verification
npm test -- useLeadList.test.ts
npm test -- useContactList.test.ts
npm test -- useCompanyList.test.ts
npm test -- useDealList.test.ts
npm test -- useActivityList.test.ts

# Interactive features verification
npm test -- crm-interactive.test.tsx

# Advanced features verification
npm test -- lead-conversion.test.tsx
npm test -- duplicate-detection.test.tsx
npm test -- crm-tasks.test.tsx

# Workspace verification
npm test -- contact-360.test.tsx
npm test -- company-360.test.tsx
npm test -- deal-workspace.test.tsx

# Manual verification
# Navigate to CRM page, verify all data loads from API
# Test drag-and-drop lead stage changes
# Test create/edit/delete operations
# Test advanced features (conversion, duplicates, etc.)
```

---

## Completion Criteria

### CRM Frontend Integration Complete When:
1. All CRM data (leads, contacts, companies, deals, activities) loads from APIs
2. Interactive features work with optimistic updates and rollback on failure
3. Advanced CRM features (conversion, duplicates, email, tasks) are functional
4. 360° workspaces provide comprehensive entity views
5. All mock data imports are removed from CRM components
6. Component tests pass with MSW mocks
7. Manual testing confirms complete CRM functionality
8. Error handling provides clear feedback and recovery paths

**Estimated Timeline:** 8-10 days with parallel execution
