# tasks/integrations/CRM‑TO‑PROJECTS‑SYNC.md – CRM to Projects Automation

This file covers the automation path from won deal to delivery kickoff, including project creation, invoice seeding, and manual override flows.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Sales-to-Delivery Automation

### [ ] INT‑CRMPROJ‑001: Deal-to-Project Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Won deals do not create delivery work.

**Description:** Subscribe to the deal-won event and create a project from a template, carrying over linked contacts and scoped delivery metadata.

**Depends on:** `crm/CRM‑DEALS.md → API‑CRM‑017`, `projects/PROJECTS‑TEMPLATES.md → API‑PROJ‑017`, `infrastructure/EVENT‑BUS.md → EVENT‑001`
**Blocks:** `INT‑CRMPROJ‑002`, `FRONT‑CRMPROJ‑001`
**Related Files:** `artifacts/api‑server/src/subscribers/crm/deal‑won‑subscriber.ts`

### [ ] INT‑CRMPROJ‑002: Deal-to-Invoice Automation
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Revenue handoff is manual.

**Description:** Create a draft invoice from won-deal value and line items, linking it to the generated project and customer record.

**Depends on:** `integrations/CRM‑TO‑PROJECTS‑SYNC.md → INT‑CRMPROJ‑001`, `finance/FINANCE‑INVOICES‑PAYMENTS.md → API‑FIN‑005`
**Blocks:** [N/A]

### [ ] FRONT‑CRMPROJ‑001: Manual Create Project Flow
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Users cannot manually trigger the handoff with preview.

**Description:** Add a deal workspace action that previews project creation, template choice, and downstream invoice consequences before confirming.

**Depends on:** `integrations/CRM‑TO‑PROJECTS‑SYNC.md → INT‑CRMPROJ‑001`, `crm/CRM‑DEALS.md → FRONT‑CRM‑014`
**Blocks:** [N/A]
**Related Files:** `artifacts/apex‑os/src/components/crm/DealWorkspace.tsx`

## Subtasks
- [ ] INT‑CRMPROJ‑001.1 (AGENT): Define the deal-won event payload and project instantiation mapping.
- [ ] INT‑CRMPROJ‑001.2 (AGENT): Add idempotency rules for duplicate event delivery.
- [ ] INT‑CRMPROJ‑002.1 (AGENT): Define invoice line-item mapping from won deals.
- [ ] FRONT‑CRMPROJ‑001.1 (AGENT): Design the preview and confirmation modal.