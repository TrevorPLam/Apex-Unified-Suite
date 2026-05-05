# tasks/integrations/INTEGRATION‑SALESFORCE.md – Salesforce Integration

This file captures the deferred Salesforce integration backlog so it has an explicit owner and sequence in the task tree.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Deferred Integration

### [ ] SF‑001: Salesforce OAuth & Object Mapping
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No Salesforce integration planning has been expanded beyond this deferred owner file.

**Description:** Define OAuth flow, connected-app requirements, and mappings between Apex CRM entities and Salesforce objects.

**Depends on:** `infrastructure/AUTH.md → AUTH‑008`
**Blocks:** `SF‑002`

### [ ] SF‑002: Bidirectional Sync
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** No sync engine exists.

**Description:** Plan push/pull sync, conflict resolution, schedule cadence, and auditability for Salesforce object synchronization.

**Depends on:** `integrations/INTEGRATION‑SALESFORCE.md → SF‑001`
**Blocks:** [N/A]

## Subtasks
- [ ] SF‑001.1 (AGENT): Document OAuth scopes, object mappings, and webhook/polling options.
- [ ] SF‑002.1 (AGENT): Define sync direction rules, conflict policy, and retry strategy.