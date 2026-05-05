# tasks/crm/CUSTOM‑FIELDS.md – CRM Custom Fields

This file covers user-defined CRM fields, value storage, validation rules, and the admin UI for field management.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Extensible CRM Data

### [ ] DB‑CRM‑010: Custom Field Definitions Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** CRM entities support only fixed fields.

**Description:** Add schema support for per-organization custom field definitions, field types, ordering, required flags, and target entities.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`
**Blocks:** `DB‑CRM‑011`, `API‑CRM‑028`

### [ ] DB‑CRM‑011: Custom Field Values Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** There is no storage model for custom field values.

**Description:** Add value storage for lead, contact, company, and deal custom fields with searchable indexing strategy.

**Depends on:** `crm/CUSTOM‑FIELDS.md → DB‑CRM‑010`
**Blocks:** `API‑CRM‑028`

### [ ] API‑CRM‑028: Custom Fields CRUD & Value API
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No endpoints exist for managing custom fields.

**Description:** Implement definition CRUD and inline value retrieval/update for supported CRM entities.

**Depends on:** `crm/CUSTOM‑FIELDS.md → DB‑CRM‑010`, `DB‑CRM‑011`
**Blocks:** `API‑CRM‑029`, `FRONT‑CRM‑010`

### [ ] API‑CRM‑029: Custom Field Validation Rules
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No validation engine exists for custom values.

**Description:** Enforce type constraints, required fields, dropdown options, and entity compatibility for custom field values.

**Depends on:** `crm/CUSTOM‑FIELDS.md → API‑CRM‑028`
**Blocks:** `FRONT‑CRM‑010`

### [ ] FRONT‑CRM‑010: Custom Field Builder & Dynamic Forms
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Admins cannot create or edit CRM custom fields.

**Description:** Build the custom field builder UI and render dynamic form controls on CRM create/edit surfaces.

**Depends on:** `crm/CUSTOM‑FIELDS.md → API‑CRM‑028`, `API‑CRM‑029`
**Blocks:** [N/A]

## Subtasks
- [ ] DB‑CRM‑010.1 (AGENT): Define field metadata and entity targeting rules.
- [ ] DB‑CRM‑011.1 (AGENT): Choose value storage and indexing strategy.
- [ ] API‑CRM‑028.1 (AGENT): Add field-definition and value endpoints to OpenAPI.
- [ ] API‑CRM‑029.1 (AGENT): Define validation rules per field type.
- [ ] FRONT‑CRM‑010.1 (AGENT): Design the field builder and dynamic form rendering states.