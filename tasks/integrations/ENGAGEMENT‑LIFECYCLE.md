# tasks/integrations/ENGAGEMENT‑LIFECYCLE.md – Engagement Lifecycle

This file defines the engagement entity and workspace that formalize the lifecycle from proposal through project delivery and billing.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Engagement Model

### [ ] ENGAGE‑001: Engagement CRUD & Status Machine
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Proposal, project, and billing stages are linked only indirectly.

**Description:** Add an engagement entity with status transitions that coordinate proposal, agreement, project kickoff, and billing readiness.

**Depends on:** CRM, Projects, and Finance APIs
**Blocks:** `ENGAGE‑002`, `ENGAGE‑003`

### [ ] ENGAGE‑002: Bulk Engagement Creation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** High-volume engagement creation is manual.

**Description:** Support batch creation from CSV import or selected deals with shared defaults and validation.

**Depends on:** `integrations/ENGAGEMENT‑LIFECYCLE.md → ENGAGE‑001`
**Blocks:** [N/A]

### [ ] ENGAGE‑003: Engagement Workspace UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No unified workspace exists for engagement status.

**Description:** Build an engagement workspace that surfaces linked deals, projects, invoices, client portal status, and next actions.

**Depends on:** `integrations/ENGAGEMENT‑LIFECYCLE.md → ENGAGE‑001`, `projects/PROJECTS‑CORE.md → FRONT‑PROJ‑006`
**Blocks:** [N/A]

## Subtasks
- [ ] ENGAGE‑001.1 (AGENT): Define lifecycle states and transition rules.
- [ ] ENGAGE‑001.2 (AGENT): Identify the persistence and linking model across domains.
- [ ] ENGAGE‑002.1 (AGENT): Define batch import inputs and validation strategy.
- [ ] ENGAGE‑003.1 (AGENT): Design the engagement workspace and linked-record views.