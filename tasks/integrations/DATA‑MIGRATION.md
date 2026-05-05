# tasks/integrations/DATA‑MIGRATION.md – Data Migration Utilities

This file covers competitor CSV templates, mapping workflows, and the migration UI needed for onboarding data from other platforms.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Migration Backlog

### [ ] MIGRATE‑001: Competitor CSV Templates
**Status:** ⏳ Not Started
**Actor:** MIXED
**Priority:** 🟡 Medium
**Current State:** No standardized import templates exist.

**Description:** Define documented CSV templates and field mappings for major competitor exports across CRM, appointments, finance, and assets.

**Depends on:** Existing import pipelines
**Blocks:** `MIGRATE‑002`, `FRONT‑MIGRATE‑001`

### [ ] MIGRATE‑002: Field Mapping Wizard Backend
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No migration-specific mapping backend exists.

**Description:** Add backend support for mapping suggestions, preview rows, and batch import orchestration using existing import pipelines.

**Depends on:** `integrations/DATA‑MIGRATION.md → MIGRATE‑001`
**Blocks:** `FRONT‑MIGRATE‑001`

### [ ] FRONT‑MIGRATE‑001: Migration Wizard UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Users cannot self-serve migrations.

**Description:** Build a step-by-step migration wizard with platform selection, upload, field mapping preview, and progress feedback.

**Depends on:** `integrations/DATA‑MIGRATION.md → MIGRATE‑002`
**Blocks:** [N/A]

## Subtasks
- [ ] MIGRATE‑001.1 (AGENT): Document source-platform templates and column mappings.
- [ ] MIGRATE‑002.1 (AGENT): Define backend preview and mapping suggestion contract.
- [ ] FRONT‑MIGRATE‑001.1 (AGENT): Design the migration wizard flow and error handling.