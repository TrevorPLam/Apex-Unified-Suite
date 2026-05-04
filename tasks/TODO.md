# Task System Enhancement TODO

> Generated from analysis in `00-00-00.md`
> Goal: Transform the master tracker from a good plan into a fully actionable, automatically verifiable one.

---

## P0: ID Standardization & Naming Consistency

### Task P0.1: Add Abbreviation Glossary to Meta Section

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Open `00.TODO-MASTER-TRACKER.json`
2. Locate the `meta` object at line 2
3. Add an `abbreviations` field after `totalParentTasks`:

```json
"abbreviations": {
  "DB-AP": "Database - Accounts Payable",
  "DB-AR": "Database - Accounts Receivable",
  "DB-APPT": "Database - Appointments",
  "DB-FIN": "Database - Finance",
  "DB-IDENTITY": "Database - Identity/Users/Roles",
  "DB-ORG": "Database - Organizations",
  "DB-CRM": "Database - CRM",
  "DB-PROJ": "Database - Projects",
  "API-CRM": "API - CRM Endpoints",
  "API-PROJ": "API - Projects Endpoints",
  "API-FIN": "API - Finance Endpoints",
  "API-APPT": "API - Appointments Endpoints",
  "API-DOCS": "API - Documents Endpoints",
  "API-ASSETS": "API - Assets Endpoints",
  "API-PORTAL": "API - Portal Endpoints",
  "API-SETTINGS": "API - Settings Endpoints",
  "API-DASH": "API - Dashboard Endpoints",
  "API-ANALYTICS": "API - Analytics Endpoints",
  "AUTH": "Authentication",
  "RBAC": "Role-Based Access Control",
  "ADR": "Architecture Decision Record",
  "FK": "Foreign Key",
  "CRUD": "Create, Read, Update, Delete",
  "P0": "Phase 0 - Foundation",
  "P1": "Phase 1 - Authentication",
  "P2": "Phase 2 - Database Schema",
  "P3": "Phase 3 - Core APIs",
  "P4": "Phase 4 - Advanced Features"
}
```

**Verification:**
```bash
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
grep -A 20 '"abbreviations"' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P0.2: Rename ERROR-002-EXT to ERROR-003

**Prerequisites:** Task P0.1 complete (for backup verification)

**Files to Edit:**
- `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`
- `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P0-BEHAVIOR.md` (if ERROR-002-EXT referenced)

**Steps:**
1. Backup the master tracker:
   ```bash
   copy c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json.bak
   ```

2. In `00.TODO-MASTER-TRACKER.json`, find the task at line 134:
   ```json
   {
     "id": "ERROR-002-EXT",
     "phase": "P0",
     "wave": 4,
     "description": "Error Catalog (extended)",
     "dependencies": ["DOMAIN-003"],
     "status": "not_started",
     "nextAction": "ERROR-002-EXT.1 (extract error codes from features)"
   }
   ```

3. Change `"id": "ERROR-002-EXT"` to `"id": "ERROR-003"`

4. Change `"nextAction": "ERROR-002-EXT.1 (extract error codes from features)"` to `"nextAction": "ERROR-003.1 (extract error codes from features)"`

5. Search for any other files referencing `ERROR-002-EXT`:
   ```bash
   grep -r "ERROR-002-EXT" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\
   ```

6. Update any found references to `ERROR-003`

**Verification:**
```bash
# Should return the task
grep -n "ERROR-003" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json

# Should return empty (no old references remain)
grep -r "ERROR-002-EXT" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\

# Validate JSON is still valid
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P0.3: Verify and Document Numbering Gaps

**Prerequisites:** None

**Files to Check:**
- `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`
- `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P3-CRM-CORE.md`

**Steps:**
1. Check for ARCH-002 gap:
   ```bash
   grep -n "ARCH-002" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
   ```
   If empty, ARCH-002 is missing and needs to be documented.

2. Verify CRM numbering gap (004 → 029):
   ```bash
   grep -n "API-CRM-" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json | head -20
   ```
   Should show: 001, 002, 003, 004, then 029, 030, 031, 032

3. Open `TODO-P3-CRM-CORE.md` and verify tasks API-CRM-005 through API-CRM-028 exist there

4. Add a comment/note to master tracker meta section about intentional gaps:
   ```json
   "notes": {
     "numberingGaps": [
       {
         "gap": "ARCH-002",
         "reason": "Reserved for future multi-tenancy ADR",
         "status": "intentional"
       },
       {
         "gap": "API-CRM-005 to API-CRM-028",
         "reason": "Defined in TODO-P3-CRM-CORE.md",
         "status": "intentional"
       }
     ]
   }
   ```

**Verification:**
```bash
# Check notes section exists
grep -A 10 '"notes"' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json

# Verify JSON validity
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

## P1: Dependency Marker Replacement

### Task P1.1: Create Milestone Task MILESTONE-P3-APIS-COMPLETE

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Open `00.TODO-MASTER-TRACKER.json`
2. Find the first task in P3 wave 1 (around line 622, RBAC-001)
3. Insert a new milestone task BEFORE RBAC-001:

```json
{
  "id": "MILESTONE-P3-APIS-COMPLETE",
  "phase": "P3",
  "wave": 0,
  "description": "Milestone: All Phase 3 Core APIs Complete",
  "dependencies": [
    "API-CRM-004",
    "API-CRM-029",
    "API-CRM-030",
    "API-CRM-031",
    "API-CRM-032",
    "API-PROJ-004",
    "API-PROJ-013",
    "API-PROJ-014",
    "API-PROJ-015",
    "API-PROJ-016",
    "API-FIN-004",
    "API-FIN-024",
    "API-FIN-025",
    "API-FIN-026",
    "API-FIN-027"
  ],
  "status": "not_started",
  "type": "milestone",
  "completionCriteria": "All listed API route tasks have status = 'done'"
}
```

**Verification:**
```bash
# Verify milestone task exists
grep -n "MILESTONE-P3-APIS-COMPLETE" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json

# Validate JSON
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P1.2: Replace ALL_PHASE3_APIS Dependencies

**Prerequisites:** Task P1.1 complete

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Search for all occurrences of `ALL_PHASE3_APIS`:
   ```bash
   grep -n "ALL_PHASE3_APIS" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
   ```
   Expected locations:
   - Line ~651: API-SEARCH-001 dependencies
   - Line ~1053: API-ANALYTICS-001 dependencies
   - Line ~1037: API-DASH-001 dependencies

2. For each occurrence, replace `ALL_PHASE3_APIS` with `MILESTONE-P3-APIS-COMPLETE`

3. Specifically update:
   - `API-SEARCH-001`: Change dependencies from `["DB-SEARCH-001", "AUTH-008", "ALL_PHASE3_APIS"]` to `["DB-SEARCH-001", "AUTH-008", "MILESTONE-P3-APIS-COMPLETE"]`
   - `API-DASH-001`: Change dependencies from `["ALL_PHASE3_APIS"]` to `["MILESTONE-P3-APIS-COMPLETE"]`
   - `API-ANALYTICS-001`: Change dependencies from `["ALL_PHASE3_APIS", "DB-ANALYTICS-001"]` to `["MILESTONE-P3-APIS-COMPLETE", "DB-ANALYTICS-001"]`

**Verification:**
```bash
# Should return empty
grep "ALL_PHASE3_APIS" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json

# Should show 3 occurrences of MILESTONE-P3-APIS-COMPLETE
grep "MILESTONE-P3-APIS-COMPLETE" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json

# Validate JSON
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P1.3: Create MILESTONE-DB-MIGRATE-* Tasks

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find the location after `DB-IDENTITY-006` task (around line 341-348)
2. Insert these 6 milestone tasks:

```json
{
  "id": "MILESTONE-DB-MIGRATE-IDENTITY",
  "phase": "P2",
  "wave": 2,
  "description": "Milestone: Identity Database Migration Complete",
  "dependencies": ["DB-IDENTITY-001", "DB-IDENTITY-002", "DB-IDENTITY-003", "DB-IDENTITY-004", "DB-IDENTITY-005", "DB-IDENTITY-006"],
  "status": "not_started",
  "type": "milestone"
},
{
  "id": "MILESTONE-DB-MIGRATE-CRM",
  "phase": "P2",
  "wave": 3,
  "description": "Milestone: CRM Database Migration Complete",
  "dependencies": ["DB-CRM-001", "DB-CRM-002"],
  "status": "not_started",
  "type": "milestone"
},
{
  "id": "MILESTONE-DB-MIGRATE-APPOINTMENTS",
  "phase": "P2",
  "wave": 3,
  "description": "Milestone: Appointments Database Migration Complete",
  "dependencies": ["DB-APPT-001", "DB-APPT-002", "DB-APPT-003", "DB-APPT-004", "DB-APPT-005", "DB-APPT-006", "DB-APPT-007", "DB-APPT-008", "DB-APPT-009", "DB-APPT-010", "DB-APPT-011", "DB-APPT-012", "DB-APPT-013", "DB-APPT-014"],
  "status": "not_started",
  "type": "milestone"
},
{
  "id": "MILESTONE-DB-MIGRATE-FINANCE",
  "phase": "P2",
  "wave": 4,
  "description": "Milestone: Finance Database Migration Complete",
  "dependencies": ["DB-FIN-001", "DB-FIN-002", "DB-FIN-003", "DB-FIN-004", "DB-FIN-005", "DB-FIN-006", "DB-FIN-007", "DB-FIN-008", "DB-FIN-009", "DB-FIN-010", "DB-FIN-011", "DB-FIN-012", "DB-FIN-013", "DB-FIN-014"],
  "status": "not_started",
  "type": "milestone"
},
{
  "id": "MILESTONE-DB-MIGRATE-AP",
  "phase": "P2",
  "wave": 5,
  "description": "Milestone: Accounts Payable Database Migration Complete",
  "dependencies": ["DB-AP-001", "DB-AP-002", "DB-AP-003", "DB-AP-004"],
  "status": "not_started",
  "type": "milestone"
},
{
  "id": "MILESTONE-DB-MIGRATE-AR",
  "phase": "P2",
  "wave": 6,
  "description": "Milestone: Accounts Receivable Database Migration Complete",
  "dependencies": ["DB-AR-001", "DB-AR-002"],
  "status": "not_started",
  "type": "milestone"
}
```

**Verification:**
```bash
grep "MILESTONE-DB-MIGRATE-" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P1.4: Replace DB-MIGRATE-ALL Dependencies

**Prerequisites:** Task P1.3 complete

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find all service tasks with `DB-MIGRATE-ALL` dependency:
   ```bash
   grep -n "DB-MIGRATE-ALL" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
   ```

2. For each service task, determine the correct domain-specific milestone:
   - `API-CRM-003` (CRM Service) → use `MILESTONE-DB-MIGRATE-CRM`
   - `API-PROJ-003` (Projects Service) → use `MILESTONE-DB-MIGRATE-PROJECTS` (will be created in P2.6)
   - `API-FIN-003` (Finance Service) → use `MILESTONE-DB-MIGRATE-FINANCE`
   - `API-DOCS-003` (Documents Service) → use `MILESTONE-DB-MIGRATE-DOCS` (will be created in P2.6)
   - `API-ASSETS-003` (Assets Service) → use `MILESTONE-DB-MIGRATE-ASSETS` (will be created in P2.6)
   - `API-PORTAL-003` (Portal Service) → use `MILESTONE-DB-MIGRATE-PORTAL` (will be created in P2.6)
   - `API-APPT-003` (Appointments Service) → use `MILESTONE-DB-MIGRATE-APPOINTMENTS`
   - `API-SETTINGS-003` (Settings Service) → use `MILESTONE-DB-MIGRATE-SETTINGS` (will be created in P2.6)

3. Note: Some milestones need to be created in Task P2.6 first. Update the ones that exist now, mark the rest as blocked pending P2.6.

4. For now, update these that have their milestones ready:
   - `API-CRM-003`: Replace `DB-MIGRATE-ALL` with `MILESTONE-DB-MIGRATE-CRM`
   - `API-FIN-003`: Replace `DB-MIGRATE-ALL` with `MILESTONE-DB-MIGRATE-FINANCE`
   - `API-APPT-003`: Replace `DB-MIGRATE-ALL` with `MILESTONE-DB-MIGRATE-APPOINTMENTS`

**Verification:**
```bash
# Should still show some DB-MIGRATE-ALL (for tasks waiting on P2.6)
grep -n "DB-MIGRATE-ALL" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json

# Verify replaced ones
grep -A 5 "API-CRM-003" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json | grep "MILESTONE-DB-MIGRATE-CRM"
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P1.5: Replace ALL_CRUD_APIS Dependency

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find tasks with `ALL_CRUD_APIS`:
   ```bash
   grep -n "ALL_CRUD_APIS" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
   ```
   Expected: API-SEARCH-001, API-IMPORT-001

2. Create a new milestone task `MILESTONE-CRUD-CORE-COMPLETE`:
   - Insert after `API-CRM-004` and related CRUD tasks
   - Dependencies should include all core CRUD route tasks

3. Replace `ALL_CRUD_APIS` with `MILESTONE-CRUD-CORE-COMPLETE` in affected tasks

**Verification:**
```bash
grep "ALL_CRUD_APIS" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
# Should return empty if all replaced
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

## P2: External Task Stubs

### Task P2.1: Add DB-CRM-001 and DB-CRM-002 Stubs

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find location after `DB-ORG-001` task (around line 287)
2. Insert these two database stubs:

```json
{
  "id": "DB-CRM-001",
  "phase": "P2",
  "wave": 3,
  "description": "CRM Leads Table",
  "dependencies": ["DB-ORG-001", "DB-IDENTITY-001"],
  "status": "not_started",
  "note": "See TODO-P3-CRM-CORE.md for full schema details"
},
{
  "id": "DB-CRM-002",
  "phase": "P2",
  "wave": 3,
  "description": "CRM Contacts Table",
  "dependencies": ["DB-ORG-001", "DB-IDENTITY-001", "DB-CRM-001"],
  "status": "not_started",
  "note": "See TODO-P3-CRM-CORE.md for full schema details"
}
```

3. Update `DB-APPT-004` dependencies to use these actual task IDs instead of undefined ones (verify current state first)

**Verification:**
```bash
grep -n "DB-CRM-00[12]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.2: Add DB-PROJ-001 through DB-PROJ-007 Stubs

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find location after DB-APPT tasks (around line 460)
2. Insert these project database stubs:

```json
{
  "id": "DB-PROJ-001",
  "phase": "P2",
  "wave": 3,
  "description": "Projects Table",
  "dependencies": ["DB-ORG-001", "DB-IDENTITY-001"],
  "status": "not_started",
  "note": "See TODO-P3-PROJECTS-CORE.md for full schema details"
},
{
  "id": "DB-PROJ-002",
  "phase": "P2",
  "wave": 3,
  "description": "Project Tasks Table",
  "dependencies": ["DB-PROJ-001", "DB-IDENTITY-001"],
  "status": "not_started",
  "note": "See TODO-P3-PROJECTS-CORE.md for full schema details"
},
{
  "id": "DB-PROJ-003",
  "phase": "P2",
  "wave": 3,
  "description": "Project Members Table",
  "dependencies": ["DB-PROJ-001", "DB-IDENTITY-001"],
  "status": "not_started",
  "note": "See TODO-P3-PROJECTS-CORE.md for full schema details"
},
{
  "id": "DB-PROJ-004",
  "phase": "P2",
  "wave": 3,
  "description": "Project Status History Table",
  "dependencies": ["DB-PROJ-001"],
  "status": "not_started",
  "note": "See TODO-P3-PROJECTS-CORE.md for full schema details"
},
{
  "id": "DB-PROJ-005",
  "phase": "P2",
  "wave": 3,
  "description": "Project Boards Table",
  "dependencies": ["DB-PROJ-001"],
  "status": "not_started",
  "note": "See TODO-P3-PROJECTS-CORE.md for full schema details"
},
{
  "id": "DB-PROJ-006",
  "phase": "P2",
  "wave": 3,
  "description": "Project Time Entries Table",
  "dependencies": ["DB-PROJ-002", "DB-IDENTITY-001"],
  "status": "not_started",
  "note": "See TODO-P3-PROJECTS-CORE.md for full schema details"
},
{
  "id": "DB-PROJ-007",
  "phase": "P2",
  "wave": 3,
  "description": "Project Templates Table",
  "dependencies": ["DB-PROJ-001", "DB-IDENTITY-001"],
  "status": "not_started",
  "note": "See TODO-P3-PROJECTS-CORE.md for full schema details"
}
```

3. Create milestone task `MILESTONE-DB-MIGRATE-PROJECTS`:

```json
{
  "id": "MILESTONE-DB-MIGRATE-PROJECTS",
  "phase": "P2",
  "wave": 3,
  "description": "Milestone: Projects Database Migration Complete",
  "dependencies": ["DB-PROJ-001", "DB-PROJ-002", "DB-PROJ-003", "DB-PROJ-004", "DB-PROJ-005", "DB-PROJ-006", "DB-PROJ-007"],
  "status": "not_started",
  "type": "milestone"
}
```

**Verification:**
```bash
grep -c "DB-PROJ-00[1-7]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
# Should return 7
grep "MILESTONE-DB-MIGRATE-PROJECTS" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.3: Add API-CRM-005 through API-CRM-028 Stubs

**Prerequisites:** Tasks P2.1 complete (DB-CRM-* must exist)

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find location after `API-CRM-004` (around line 690)
2. Insert stubs for CRM-005 to CRM-028 (24 tasks)

Create a pattern for each:
```json
{
  "id": "API-CRM-005",
  "phase": "P3",
  "wave": 3,
  "description": "CRM Contacts OpenAPI",
  "dependencies": ["DB-CRM-002", "DOMAIN-003"],
  "status": "not_started",
  "note": "See TODO-P3-CRM-CORE.md for full details"
},
{
  "id": "API-CRM-006",
  "phase": "P3",
  "wave": 3,
  "description": "CRM Contacts Tests",
  "dependencies": ["API-CRM-005", "TEST-INFRA-001"],
  "status": "not_started",
  "note": "See TODO-P3-CRM-CORE.md for full details"
},
...
```

Use grep to extract actual task names from `TODO-P3-CRM-CORE.md`:
```bash
grep -E "^##?\s+(API-CRM-[0-9]+|Task)" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P3-CRM-CORE.md
```

3. Verify dependencies match the pattern:
   - OpenAPI tasks depend on DB table + DOMAIN-003
   - Test tasks depend on OpenAPI task + TEST-INFRA-001
   - Service tasks depend on MILESTONE-DB-MIGRATE-CRM + ERROR-002 + ARCH-001
   - Route tasks depend on Service + AUTH-008 + RBAC-001

**Verification:**
```bash
grep -c "API-CRM-0[0-9][0-9]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
# Should be 32 total (001-032, plus any in 033+ range)
grep "API-CRM-014" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
# Verify middle of range exists
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.4: Add API-PROJ-005 through API-PROJ-012 Stubs

**Prerequisites:** Tasks P2.2 complete (DB-PROJ-* and MILESTONE-DB-MIGRATE-PROJECTS must exist)

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find location after `API-PROJ-004` (around line 756)
2. Insert stubs following the pattern from `TODO-P3-PROJECTS-CORE.md`

Use grep to get task details:
```bash
grep -E "^##?\s+(API-PROJ-[0-9]+|Task)" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P3-PROJECTS-CORE.md
```

3. Follow the standard dependency pattern:
   - OpenAPI: DB table + DOMAIN-003
   - Tests: OpenAPI + TEST-INFRA-001
   - Service: MILESTONE-DB-MIGRATE-PROJECTS + ERROR-002 + ARCH-001
   - Routes: Service + AUTH-008 + RBAC-001

**Verification:**
```bash
grep -c "API-PROJ-0[0-9][0-9]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.5: Add API-FIN-005 through API-FIN-023 Stubs

**Prerequisites:** P2 DB tasks for Finance exist

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find location after `API-FIN-004` (around line 820)
2. Extract task list from `TODO-P3-FINANCE-CORE.md`:
   ```bash
   grep -E "^##?\s+(API-FIN-[0-9]+|Task)" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P3-FINANCE-CORE.md
   ```

3. Insert 19 stubs (005-023) with appropriate dependencies

**Verification:**
```bash
grep -c "API-FIN-0[0-9][0-9]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.6: Add Missing Database Stubs (P4 Domains)

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Add stubs after existing DB tasks (after DB-AR-002 around line 620):

```json
{
  "id": "DB-SEARCH-001",
  "phase": "P3",
  "wave": 2,
  "description": "Search Index Tables",
  "dependencies": ["DB-ORG-001"],
  "status": "not_started",
  "note": "Cross-module search infrastructure"
},
{
  "id": "DB-NOTIF-001",
  "phase": "P3",
  "wave": 2,
  "description": "Notifications Table",
  "dependencies": ["DB-ORG-001", "DB-IDENTITY-001"],
  "status": "not_started",
  "note": "In-app notification storage"
},
{
  "id": "DB-ANALYTICS-001",
  "phase": "P4",
  "wave": 7,
  "description": "Analytics Reports Table",
  "dependencies": ["DB-ORG-001"],
  "status": "not_started",
  "note": "See TODO-P4-ANALYTICS.md"
},
{
  "id": "DB-SETTINGS-001",
  "phase": "P4",
  "wave": 8,
  "description": "Organization Settings Table",
  "dependencies": ["DB-ORG-001"],
  "status": "not_started",
  "note": "See TODO-P4-SETTINGS.md"
},
{
  "id": "DB-SETTINGS-002",
  "phase": "P4",
  "wave": 8,
  "description": "User Preferences Table",
  "dependencies": ["DB-IDENTITY-001"],
  "status": "not_started",
  "note": "See TODO-P4-SETTINGS.md"
},
{
  "id": "DB-ASSETS-001",
  "phase": "P4",
  "wave": 3,
  "description": "Assets Table",
  "dependencies": ["DB-ORG-001", "DOC-STORAGE-001"],
  "status": "not_started",
  "note": "See TODO-P4-ASSETS.md"
},
{
  "id": "DB-PORTAL-001",
  "phase": "P4",
  "wave": 4,
  "description": "Portal Clients Table",
  "dependencies": ["DB-AR-001"],
  "status": "not_started",
  "note": "See TODO-P4-PORTAL.md"
},
{
  "id": "DB-PORTAL-002",
  "phase": "P4",
  "wave": 4,
  "description": "Portal Magic Links Table",
  "dependencies": ["DB-PORTAL-001"],
  "status": "not_started",
  "note": "See TODO-P4-PORTAL.md"
},
{
  "id": "DB-DOCS-001",
  "phase": "P4",
  "wave": 2,
  "description": "Documents Table",
  "dependencies": ["DB-ORG-001"],
  "status": "not_started",
  "note": "See TODO-P4-DOCUMENTS.md"
},
{
  "id": "DB-DOCS-002",
  "phase": "P4",
  "wave": 2,
  "description": "Document Versions Table",
  "dependencies": ["DB-DOCS-001"],
  "status": "not_started",
  "note": "See TODO-P4-DOCUMENTS.md"
}
```

2. Add corresponding milestone tasks:
   - MILESTONE-DB-MIGRATE-DOCS
   - MILESTONE-DB-MIGRATE-ASSETS
   - MILESTONE-DB-MIGRATE-PORTAL
   - MILESTONE-DB-MIGRATE-SETTINGS

**Verification:**
```bash
for id in DB-SEARCH-001 DB-NOTIF-001 DB-ANALYTICS-001 DB-SETTINGS-001 DB-SETTINGS-002 DB-ASSETS-001 DB-PORTAL-001 DB-PORTAL-002 DB-DOCS-001 DB-DOCS-002; do
  grep "$id" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
done
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.7: Update API-DOCS-001 Dependencies

**Prerequisites:** Task P2.6 complete (DB-DOCS-002 must exist)

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find `API-DOCS-001` (around line 889)
2. Verify its dependencies include `DB-DOCS-002` and `DOC-STORAGE-001`
3. If `DB-DOCS-001` was added in P2.6, add it as dependency too

Current state:
```json
{
  "id": "API-DOCS-001",
  "phase": "P4",
  "wave": 2,
  "description": "Documents OpenAPI",
  "dependencies": ["DB-DOCS-002", "DOC-STORAGE-001"],
  ...
}
```

If DB-DOCS-001 was added, update to:
```json
"dependencies": ["DB-DOCS-001", "DB-DOCS-002", "DOC-STORAGE-001"]
```

**Verification:**
```bash
grep -A 5 "API-DOCS-001" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.8: Add API-ASSETS-005 through API-ASSETS-019 Stubs

**Prerequisites:** Task P2.6 complete (MILESTONE-DB-MIGRATE-ASSETS must exist)

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Extract task list from `TODO-P4-ASSETS.md`:
   ```bash
   grep -E "^##?\s+(API-ASSETS-[0-9]+|Task)" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P4-ASSETS.md
   ```

2. Insert 15 stubs (005-019) after API-ASSETS-004

**Verification:**
```bash
grep -c "API-ASSETS-0[0-9][0-9]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.9: Add API-DOCS-005 through API-DOCS-034 Stubs

**Prerequisites:** Task P2.6 complete (MILESTONE-DB-MIGRATE-DOCS must exist)

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Extract task list from `TODO-P4-DOCUMENTS.md`:
   ```bash
   grep -E "^##?\s+(API-DOCS-[0-9]+|Task)" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P4-DOCUMENTS.md | head -40
   ```

2. Insert 30 stubs (005-034) after API-DOCS-004

**Verification:**
```bash
grep -c "API-DOCS-0[0-9][0-9]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P2.10: Add API-PORTAL-005 through API-PORTAL-011 Stubs

**Prerequisites:** Task P2.6 complete (MILESTONE-DB-MIGRATE-PORTAL must exist)

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Extract task list from `TODO-P4-PORTAL.md`:
   ```bash
   grep -E "^##?\s+(API-PORTAL-[0-9]+|Task)" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P4-PORTAL.md
   ```

2. Insert 7 stubs (005-011) after API-PORTAL-004

**Verification:**
```bash
grep -c "API-PORTAL-0[0-9][0-9]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

## P3: nextAction Field Policy

### Task P3.1: Decide and Document nextAction Policy

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Add `nextActionPolicy` to meta section:

```json
"nextActionPolicy": {
  "chosenOption": "A",
  "description": "Every task MUST have nextAction field",
  "rationale": "Ensures every task has immediate next step for execution",
  "rules": [
    "nextAction must be in format 'TASK-ID.step (description)'",
    "For parent tasks, nextAction points to first subtask",
    "For leaf tasks, nextAction describes immediate action",
    "Update nextAction when completing each step"
  ]
}
```

Alternative for Option C:
```json
"nextActionPolicy": {
  "chosenOption": "C",
  "description": "nextAction field removed from master tracker",
  "rationale": "Granular actions maintained in subtask files only",
  "rules": [
    "Master tracker tracks high-level progress only",
    "Detailed next actions in TODO-P*.md files",
    "Subtask files use granular checklist format"
  ]
}
```

**Verification:**
```bash
grep -A 10 '"nextActionPolicy"' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P3.2: Implement Option A - Add nextAction to All Tasks

**Prerequisites:** Task P3.1 with Option A selected

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Find all tasks without `nextAction` field:
   ```bash
   # This is harder to grep - need to check each task object
   # Count tasks vs count nextAction occurrences
   grep -c '"id":' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
   grep -c '"nextAction":' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
   ```

2. For each task missing `nextAction`, add one following the format:
   - Pattern: `"nextAction": "TASK-ID.1 (description of first step)"`

3. Example additions:
   - DB-APPT-001: `"nextAction": "DB-APPT-001.1 (write appointments schema test)"`
   - DB-APPT-002: `"nextAction": "DB-APPT-002.1 (write availability windows test)"`
   - Continue for all DB-APPT, DB-FIN, DB-AP, DB-AR, API-* tasks

**Verification:**
```bash
# Count should now match
grep -c '"id":' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
grep -c '"nextAction":' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
# If milestone tasks don't need nextAction, their count difference should equal milestone count
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P3.3: Implement Option C - Remove nextAction Fields

**Prerequisites:** Task P3.1 with Option C selected

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Create backup:
   ```bash
   copy c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER-with-nextaction.json
   ```

2. Remove all `nextAction` lines from the JSON:
   - Use sed, jq, or manual edit to remove `"nextAction": "...",` lines
   - Ensure no trailing commas remain

3. Verify subtask files have granular actions:
   ```bash
   head -50 c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P1-AUTH-SERVICES.md
   ```
   Should show detailed checklist items

**Verification:**
```bash
# Should return 0
grep -c '"nextAction":' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

## P4: Critical Path Validation

### Task P4.1: Create Dependency Validation Script

**Prerequisites:** P1, P2 complete (all tasks and dependencies should exist)

**File to Create:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\validate-tasks.js`

**Steps:**
1. Create the validation script:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, '..', 'tasks', '00.TODO-MASTER-TRACKER.json');

function loadTasks() {
  const data = fs.readFileSync(TASKS_FILE, 'utf8');
  return JSON.parse(data);
}

function validateTasks(data) {
  const errors = [];
  const warnings = [];
  const taskIds = new Set();
  const dependencyGraph = new Map();
  
  // Collect all task IDs
  for (const task of data.tasks) {
    if (taskIds.has(task.id)) {
      errors.push(`Duplicate task ID: ${task.id}`);
    }
    taskIds.add(task.id);
    dependencyGraph.set(task.id, task.dependencies || []);
  }
  
  // Validate dependencies
  for (const task of data.tasks) {
    for (const dep of task.dependencies || []) {
      if (!taskIds.has(dep)) {
        errors.push(`Task ${task.id} has unresolved dependency: ${dep}`);
      }
    }
  }
  
  // Detect circular dependencies
  const visited = new Set();
  const recursionStack = new Set();
  
  function hasCycle(node, path = []) {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
      return true;
    }
    if (visited.has(node)) return false;
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    for (const dep of dependencyGraph.get(node) || []) {
      if (taskIds.has(dep)) {
        hasCycle(dep, [...path]);
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  for (const taskId of taskIds) {
    hasCycle(taskId);
  }
  
  // Find orphaned tasks (no deps, nothing depends on them)
  const referenced = new Set();
  for (const [id, deps] of dependencyGraph) {
    for (const dep of deps) {
      referenced.add(dep);
    }
  }
  
  for (const task of data.tasks) {
    const hasDeps = task.dependencies && task.dependencies.length > 0;
    const isReferenced = referenced.has(task.id);
    
    if (!hasDeps && !isReferenced && task.id !== 'DEP-001' && task.id !== 'TOOLING-001') {
      warnings.push(`Orphaned task (no deps, not referenced): ${task.id}`);
    }
  }
  
  return { errors, warnings, taskCount: taskIds.size };
}

function main() {
  try {
    const data = loadTasks();
    const { errors, warnings, taskCount } = validateTasks(data);
    
    console.log(`Validated ${taskCount} tasks\n`);
    
    if (errors.length > 0) {
      console.log('ERRORS:');
      errors.forEach(e => console.log(`  ❌ ${e}`));
    }
    
    if (warnings.length > 0) {
      console.log('\nWARNINGS:');
      warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All validations passed!');
    }
    
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error('Failed to validate:', err.message);
    process.exit(1);
  }
}

main();
```

2. Make executable:
   ```bash
   chmod +x c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\validate-tasks.js
   ```

3. Add to package.json scripts (if there's a scripts package.json):
   ```json
   "validate-tasks": "node scripts/validate-tasks.js"
   ```

**Verification:**
```bash
node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\validate-tasks.js
# Should show task count and any errors
```

---

### Task P4.2: Run Validation and Fix Issues

**Prerequisites:** Task P4.1 complete

**Steps:**
1. Run the validation script:
   ```bash
   node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\validate-tasks.js
   ```

2. For each error, fix in `00.TODO-MASTER-TRACKER.json`:
   - Unresolved dependency → Add stub task or fix dependency ID
   - Duplicate ID → Rename one of the tasks
   - Circular dependency → Break the cycle by removing one dependency edge

3. Re-run until no errors

4. Review warnings (orphaned tasks) - some may be intentional milestones

**Verification:**
```bash
node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\validate-tasks.js
# Should output: ✅ All validations passed!
```

---

### Task P4.3: Document Critical Path

**Prerequisites:** Task P4.2 complete (no validation errors)

**File to Create:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\CRITICAL-PATH.md`

**Steps:**
1. Create critical path documentation:

```markdown
# Critical Path Analysis

Generated from 00.TODO-MASTER-TRACKER.json

## End-to-End Trace Examples

### Path to Dashboard API (API-DASH-001)

```
API-DASH-001
├── MILESTONE-P3-APIS-COMPLETE
│   ├── API-CRM-004 (CRM Routes)
│   │   ├── API-CRM-003 (CRM Service)
│   │   │   ├── MILESTONE-DB-MIGRATE-CRM
│   │   │   │   ├── DB-CRM-001
│   │   │   │   │   ├── DB-ORG-001
│   │   │   │   │   │   └── ARCH-001 (Multi-Tenancy)
│   │   │   │   │   │       ├── DOMAIN-002 (Bounded Contexts)
│   │   │   │   │   │       │   ├── DOMAIN-001 (Domain Glossary)
│   │   │   │   │   │       │   │   └── DEP-001 (Dependencies)
│   │   │   │   │   │       │   └── DEP-001
│   │   │   │   │   │       └── TOOLING-004 (Zod compatibility)
│   │   │   │   │   └── DB-IDENTITY-001
│   │   │   │   │       └── DB-ORG-001
│   │   │   └── ... (continues)
```

### Key Milestones

| Milestone | Prerequisites | Blocks |
|-----------|--------------|--------|
| MILESTONE-DB-MIGRATE-IDENTITY | DB-IDENTITY-001 to 006 | RBAC-001, AUTH-007, AUTH-008 |
| MILESTONE-P3-APIS-COMPLETE | All P3 API routes | API-DASH-001, API-ANALYTICS-001 |

## Parallel Work Streams

### Stream A: Identity & Auth (P1-P2)
Can start immediately after P0 foundation

### Stream B: CRM Development (P2-P3)
Can start after DB-CRM-* tables defined

### Stream C: Finance Development (P2-P3)
Can start after DB-AP, DB-AR, DB-FIN-* tables defined

## Longest Dependency Chain

TODO: Calculate using validation script
```

2. Add a script enhancement to calculate longest path:

```javascript
// Add to validate-tasks.js
function findLongestPath(startId, dependencyGraph, visited = new Set()) {
  const deps = dependencyGraph.get(startId) || [];
  if (deps.length === 0 || visited.has(startId)) return [startId];
  
  visited.add(startId);
  let longest = [startId];
  
  for (const dep of deps) {
    const path = findLongestPath(dep, dependencyGraph, new Set(visited));
    if (path.length + 1 > longest.length) {
      longest = [startId, ...path];
    }
  }
  
  return longest;
}
```

**Verification:**
```bash
ls -la c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\CRITICAL-PATH.md
head -50 c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\CRITICAL-PATH.md
```

---

## P5: Task Granularity Review

### Task P5.1: Identify Oversized Tasks

**Prerequisites:** Task P4.2 complete

**File to Read:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Create analysis script `scripts/analyze-task-size.js`:

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('tasks/00.TODO-MASTER-TRACKER.json'));

const oversizedThresholds = {
  'ADR': 3,  // ADR tasks should be small
  'Milestone': 10, // Milestones can be larger
  'Service': 5,
  'default': 5
};

const suspects = data.tasks.filter(t => {
  const desc = t.description.toLowerCase();
  let threshold = oversizedThresholds.default;
  
  if (desc.includes('adr')) threshold = oversizedThresholds.ADR;
  else if (t.type === 'milestone') threshold = oversizedThresholds.Milestone;
  else if (desc.includes('service')) threshold = oversizedThresholds.Service;
  
  // Heuristic: long description suggests complexity
  const complexity = t.description.length / 20 + (t.dependencies?.length || 0);
  
  return complexity > threshold;
}).map(t => ({
  id: t.id,
  description: t.description,
  complexity: (t.description.length / 20 + (t.dependencies?.length || 0)).toFixed(1)
}));

console.log('Potentially oversized tasks:');
suspects.forEach(s => console.log(`  ${s.id} (complexity: ${s.complexity}): ${s.description}`));
```

2. Run the script:
   ```bash
   node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\analyze-task-size.js
   ```

3. Document findings in oversized tasks section of CRITICAL-PATH.md

**Verification:**
```bash
node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\analyze-task-size.js
# Review output for tasks exceeding threshold
```

---

### Task P5.2: Break Down ARCH-001 (Multi-Tenancy Strategy)

**Prerequisites:** Task P5.1 complete

**Files to Edit:**
- `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`
- `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\TODO-P0-ARCHITECTURE.md` (or create new file)

**Steps:**
1. In master tracker, change ARCH-001 to a parent task:

```json
{
  "id": "ARCH-001",
  "phase": "P0",
  "wave": 3,
  "description": "Multi-Tenancy Strategy (Parent)",
  "dependencies": ["DOMAIN-002", "TOOLING-004"],
  "status": "not_started",
  "type": "parent",
  "childTasks": ["ARCH-001.1", "ARCH-001.2", "ARCH-001.3", "ARCH-001.4"],
  "note": "See TODO-P0-ARCH-MULTITENANCY.md for child task details"
}
```

2. Add child tasks to master tracker:

```json
{
  "id": "ARCH-001.1",
  "phase": "P0",
  "wave": 3,
  "description": "Multi-Tenancy Research - Evaluate strategies (shared schema, separate schema, separate DB)",
  "dependencies": ["DOMAIN-002"],
  "status": "not_started",
  "parent": "ARCH-001",
  "nextAction": "ARCH-001.1.1 (document 3 strategy options)"
},
{
  "id": "ARCH-001.2",
  "phase": "P0",
  "wave": 3,
  "description": "Multi-Tenancy Decision - Write ADR with chosen strategy",
  "dependencies": ["ARCH-001.1"],
  "status": "not_started",
  "parent": "ARCH-001"
},
{
  "id": "ARCH-001.3",
  "phase": "P0",
  "wave": 3,
  "description": "Multi-Tenancy Schema Design - Tenant isolation in DB schema",
  "dependencies": ["ARCH-001.2"],
  "status": "not_started",
  "parent": "ARCH-001"
},
{
  "id": "ARCH-001.4",
  "phase": "P0",
  "wave": 3,
  "description": "Multi-Tenancy Implementation Guide - Developer guidelines",
  "dependencies": ["ARCH-001.2"],
  "status": "not_started",
  "parent": "ARCH-001"
}
```

3. Update dependent tasks to use ARCH-001.3 or ARCH-001.4 as appropriate

**Verification:**
```bash
# Verify parent task exists
grep -A 10 '"id": "ARCH-001"' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json | grep "parent"

# Verify child tasks exist
grep -c "ARCH-001\.[1-4]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
# Should return 4

npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P5.3: Break Down API-ANALYTICS-001 (Reports Engine)

**Prerequisites:** Task P5.2 complete

**Files to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Change API-ANALYTICS-001 to parent task:

```json
{
  "id": "API-ANALYTICS-001",
  "phase": "P4",
  "wave": 7,
  "description": "Reports Engine (Parent)",
  "dependencies": ["MILESTONE-P3-APIS-COMPLETE", "DB-ANALYTICS-001"],
  "status": "not_started",
  "type": "parent",
  "childTasks": ["API-ANALYTICS-001.1", "API-ANALYTICS-001.2", "API-ANALYTICS-001.3", "API-ANALYTICS-001.4"],
  "note": "Reports engine broken into sub-components"
}
```

2. Add child tasks:

```json
{
  "id": "API-ANALYTICS-001.1",
  "phase": "P4",
  "wave": 7,
  "description": "Reports Engine - Schema Design",
  "dependencies": ["DB-ANALYTICS-001"],
  "status": "not_started",
  "parent": "API-ANALYTICS-001"
},
{
  "id": "API-ANALYTICS-001.2",
  "phase": "P4",
  "wave": 7,
  "description": "Reports Engine - Query Builder",
  "dependencies": ["API-ANALYTICS-001.1"],
  "status": "not_started",
  "parent": "API-ANALYTICS-001"
},
{
  "id": "API-ANALYTICS-001.3",
  "phase": "P4",
  "wave": 7,
  "description": "Reports Engine - Export Functionality",
  "dependencies": ["API-ANALYTICS-001.2"],
  "status": "not_started",
  "parent": "API-ANALYTICS-001"
},
{
  "id": "API-ANALYTICS-001.4",
  "phase": "P4",
  "wave": 7,
  "description": "Reports Engine - Caching Layer",
  "dependencies": ["API-ANALYTICS-001.2"],
  "status": "not_started",
  "parent": "API-ANALYTICS-001"
}
```

3. Update API-ANALYTICS-002 dependency to use API-ANALYTICS-001.3 (or appropriate child)

**Verification:**
```bash
grep -c "API-ANALYTICS-001\.[1-4]" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

## P6: Status Tracking Enhancement

### Task P6.1: Document Status Workflow

**Prerequisites:** None

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Add status workflow to meta section:

```json
"statusWorkflow": {
  "validStatuses": ["not_started", "in_progress", "blocked", "in_review", "done"],
  "transitions": {
    "not_started": ["in_progress", "blocked"],
    "in_progress": ["blocked", "in_review", "done"],
    "blocked": ["in_progress"],
    "in_review": ["in_progress", "done"],
    "done": []
  },
  "definitions": {
    "not_started": "Task defined but work not begun",
    "in_progress": "Active development underway",
    "blocked": "Cannot proceed due to dependency or issue",
    "in_review": "Work complete, awaiting review/approval",
    "done": "Task completed and verified"
  },
  "blockedRequirements": {
    "blockedReasonRequired": true,
    "unblockedBy": "manual_review"
  }
}
```

**Verification:**
```bash
grep -A 20 '"statusWorkflow"' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

### Task P6.2: Add Status Metadata Fields

**Prerequisites:** Task P6.1 complete

**File to Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json`

**Steps:**
1. Create script to add metadata fields to all tasks:

```javascript
// scripts/add-status-metadata.js
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('tasks/00.TODO-MASTER-TRACKER.json'));

for (const task of data.tasks) {
  if (!task.statusUpdatedAt) {
    task.statusUpdatedAt = null; // Will be set when status changes
  }
  if (!task.assignedTo) {
    task.assignedTo = null;
  }
  if (!task.blockedReason) {
    task.blockedReason = null;
  }
}

fs.writeFileSync('tasks/00.TODO-MASTER-TRACKER.json', JSON.stringify(data, null, 2));
console.log('Added status metadata fields to all tasks');
```

2. Run the script:
   ```bash
   node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\add-status-metadata.js
   ```

**Verification:**
```bash
grep -c '"statusUpdatedAt"' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
grep -c '"assignedTo"' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
grep -c '"blockedReason"' c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
# All counts should match task count
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
```

---

## P7: Automation Support

### Task P7.1: Add Pre-Commit Hook

**Prerequisites:** Task P4.1 complete (validation script works)

**File to Create/Edit:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\.git\hooks\pre-commit`

**Steps:**
1. Create pre-commit hook:

```bash
#!/bin/sh
# Pre-commit hook for task validation

echo "Running task validation..."

node scripts/validate-tasks.js
if [ $? -ne 0 ]; then
    echo "❌ Task validation failed. Commit aborted."
    echo "Fix the errors above before committing."
    exit 1
fi

echo "✅ Task validation passed."
exit 0
```

2. Make it executable:
   ```bash
   chmod +x c:\Users\Trevor\Desktop\Apex-Unified-Suite\.git\hooks\pre-commit
   ```

3. Test the hook:
   ```bash
   # Make a test change that would break validation (e.g., add invalid dependency)
   # Try to commit - should be blocked
   ```

**Verification:**
```bash
ls -la c:\Users\Trevor\Desktop\Apex-Unified-Suite\.git\hooks\pre-commit
# Should be executable
# Make a test commit to verify hook runs
```

---

### Task P7.2: Create Dependency Graph Visualization

**Prerequisites:** Task P4.1 complete

**File to Create:** `c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\generate-graph.js`

**Steps:**
1. Create graph generation script:

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('tasks/00.TODO-MASTER-TRACKER.json'));

// Generate DOT format for Graphviz
let dot = 'digraph Tasks {\n';
dot += '  rankdir=TB;\n';
dot += '  node [shape=box];\n\n';

// Group by phase
const phases = {};
for (const task of data.tasks) {
  if (!phases[task.phase]) phases[task.phase] = [];
  phases[task.phase].push(task);
}

// Add subgraphs for each phase
for (const [phase, tasks] of Object.entries(phases)) {
  dot += `  subgraph cluster_${phase} {\n`;
  dot += `    label="${phase}";\n`;
  dot += `    style=filled;\n`;
  dot += `    color=lightgrey;\n`;
  
  for (const task of tasks) {
    const color = task.type === 'milestone' ? 'gold' : 'white';
    dot += `    "${task.id}" [label="${task.id}\n${task.description.substring(0, 20)}...", fillcolor=${color}];\n`;
  }
  dot += '  }\n\n';
}

// Add edges
for (const task of data.tasks) {
  for (const dep of task.dependencies || []) {
    dot += `  "${dep}" -> "${task.id}";\n`;
  }
}

dot += '}';

fs.writeFileSync('tasks/dependency-graph.dot', dot);
console.log('Generated tasks/dependency-graph.dot');
console.log('To visualize: dot -Tpng tasks/dependency-graph.dot -o tasks/dependency-graph.png');
```

2. Add to package.json:
   ```json
   "generate-graph": "node scripts/generate-graph.js"
   ```

3. Run the generator:
   ```bash
   node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\generate-graph.js
   ```

**Verification:**
```bash
ls -la c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\dependency-graph.dot
head -30 c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\dependency-graph.dot
```

---

## Final Verification

### Final Check: Complete System Validation

**Prerequisites:** All P0-P7 tasks complete

**Steps:**
1. Run all validation commands:
   ```bash
   # JSON validity
   npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
   
   # Dependency validation
   node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\validate-tasks.js
   
   # Check no abstract markers remain
   grep -E "(ALL_PHASE|ALL_CRUD|DB-MIGRATE-ALL)" c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json
   # Should return only references in comments/notes if any
   
   # Check all tasks have required fields
   node -e "
   const data = JSON.parse(require('fs').readFileSync('tasks/00.TODO-MASTER-TRACKER.json'));
   const missing = data.tasks.filter(t => !t.id || !t.phase || !t.wave || !t.description || !t.status);
   console.log('Tasks missing required fields:', missing.length);
   if (missing.length > 0) console.log(missing.map(t => t.id));
   "
   ```

2. Count total tasks:
   ```bash
   node -e "
   const data = JSON.parse(require('fs').readFileSync('tasks/00.TODO-MASTER-TRACKER.json'));
   console.log('Total tasks:', data.tasks.length);
   console.log('Milestones:', data.tasks.filter(t => t.type === 'milestone').length);
   console.log('Parent tasks:', data.tasks.filter(t => t.type === 'parent').length);
   console.log('Regular tasks:', data.tasks.filter(t => !t.type || t.type === 'task').length);
   "
   ```

3. Generate final report:
   ```bash
   node c:\Users\Trevor\Desktop\Apex-Unified-Suite\scripts\validate-tasks.js > tasks/VALIDATION-REPORT.txt
   ```

**Success Criteria:**
- JSON is valid
- Zero dependency errors
- All abstract markers replaced
- All tasks have required fields (id, phase, wave, description, status)
- Validation report generated

---

## Appendix: Quick Reference Commands

```bash
# Validate JSON syntax
npx jsonlint c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json

# Check for duplicate IDs
node -e "const data = JSON.parse(require('fs').readFileSync('tasks/00.TODO-MASTER-TRACKER.json')); const ids = data.tasks.map(t => t.id); const dupes = ids.filter((item, index) => ids.indexOf(item) !== index); console.log('Duplicates:', dupes);"

# Count tasks by phase
node -e "const data = JSON.parse(require('fs').readFileSync('tasks/00.TODO-MASTER-TRACKER.json')); const byPhase = {}; data.tasks.forEach(t => { byPhase[t.phase] = (byPhase[t.phase] || 0) + 1; }); console.log(byPhase);"

# Find tasks without dependencies (potential orphans)
node -e "const data = JSON.parse(require('fs').readFileSync('tasks/00.TODO-MASTER-TRACKER.json')); const rootTasks = data.tasks.filter(t => !t.dependencies || t.dependencies.length === 0); console.log('Root tasks:', rootTasks.map(t => t.id));"

# Backup before major changes
copy c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER.json c:\Users\Trevor\Desktop\Apex-Unified-Suite\tasks\00.TODO-MASTER-TRACKER-YYYY-MM-DD.json
```

