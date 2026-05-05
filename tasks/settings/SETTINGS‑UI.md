# tasks/settings/SETTINGS‑UI.md – Settings & Administration UI

This file owns the missing admin settings interface for organization settings, role management, API keys, and security policy controls.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Settings Surface

### [ ] FRONT‑SETTINGS‑001: Organization Settings Page
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Backend settings capabilities have no admin UI.

**Description:** Build the main settings page with tabs for general org settings, branding, integrations, and billing.

**Depends on:** `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑004`, `infrastructure/SUBSCRIPTION‑BILLING.md → FRONT‑SUB‑001`
**Blocks:** `FRONT‑SETTINGS‑002`, `FRONT‑SETTINGS‑003`, `FRONT‑SETTINGS‑004`

### [ ] FRONT‑SETTINGS‑002: User & Role Management
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** User management is not accessible in-product.

**Description:** Add user list, invitation management, role assignment, deactivate/reactivate controls, and permission previews.

**Depends on:** `settings/SETTINGS‑UI.md → FRONT‑SETTINGS‑001`, `admin/ADMIN‑INVITATIONS.md → API‑ADMIN‑002`, `infrastructure/RBAC.md → RBAC‑001`
**Blocks:** [N/A]

### [ ] FRONT‑SETTINGS‑003: API Key Management UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** API keys cannot be created or managed from the UI.

**Description:** Provide create, scope, reveal-once, revoke, and last-used views for API keys.

**Depends on:** `settings/SETTINGS‑UI.md → FRONT‑SETTINGS‑001`, `infrastructure/AUTH.md → AUTH‑009‑API‑KEY`
**Blocks:** [N/A]

### [ ] FRONT‑SETTINGS‑004: Security Settings UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟡 Medium
**Current State:** Security policy controls are not editable through the UI.

**Description:** Add UI for SSO config, session policy, password policy, and IP allowlist controls.

**Depends on:** `settings/SETTINGS‑UI.md → FRONT‑SETTINGS‑001`, `infrastructure/ENTERPRISE‑SSO.md → SSO‑005`
**Blocks:** [N/A]

## Subtasks
- [ ] FRONT‑SETTINGS‑001.1 (AGENT): Design the tab structure and section ownership.
- [ ] FRONT‑SETTINGS‑002.1 (AGENT): Wire invitations, roles, and user status controls.
- [ ] FRONT‑SETTINGS‑003.1 (AGENT): Design secure API key reveal/revoke interactions.
- [ ] FRONT‑SETTINGS‑004.1 (AGENT): Define form states for SSO, session, and allowlist management.