# tasks/admin/ADMIN‑INVITATIONS.md – Admin Invitations & User Provisioning

This file defines the invitation-based user provisioning flow that replaces manual seeding for most organization onboarding and admin operations.

> **Follow all rules in `../CROSS‑CUTTING‑RULES.md`.**

---

## Invitation Flow

### [ ] DB‑ADMIN‑001: Invitations Table
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No invitation persistence exists.

**Description:** Create the invitations table with token hash, expiry, inviter, assigned role, and status tracking.

**Depends on:** `infrastructure/DATABASE.md → DB‑ORG‑001`, `infrastructure/AUTH.md → DB‑IDENTITY‑001`, `DB‑IDENTITY‑002`
**Blocks:** `API‑ADMIN‑001`

### [ ] API‑ADMIN‑001: Invitation Endpoints
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** There is no invite lifecycle API.

**Description:** Add send, accept, resend, revoke, and validation endpoints with magic-link acceptance and rate limiting.

**Depends on:** `admin/ADMIN‑INVITATIONS.md → DB‑ADMIN‑001`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`
**Blocks:** `API‑ADMIN‑002`, `FRONT‑ADMIN‑001`

### [ ] API‑ADMIN‑002: Invitation Service & Tests
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** No service or tests exist for invite flows.

**Description:** Implement invitation token handling, duplicate protection, expiry enforcement, and integration tests.

**Depends on:** `admin/ADMIN‑INVITATIONS.md → API‑ADMIN‑001`
**Blocks:** `FRONT‑ADMIN‑001`, `settings/SETTINGS‑UI.md → FRONT‑SETTINGS‑002`

### [ ] FRONT‑ADMIN‑001: Invite Users UI
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Admins cannot invite users in the product.

**Description:** Build an invitation management screen with multi-email entry, role assignment, resend/revoke actions, and pending invitation status.

**Depends on:** `admin/ADMIN‑INVITATIONS.md → API‑ADMIN‑002`
**Blocks:** [N/A]

## Subtasks
- [ ] DB‑ADMIN‑001.1 (AGENT): Define invitation schema, indices, and token storage rules.
- [ ] API‑ADMIN‑001.1 (AGENT): Add invitation routes and accept-invite contract.
- [ ] API‑ADMIN‑002.1 (AGENT): Add service tests for expiry, replay, and duplicate invites.
- [ ] FRONT‑ADMIN‑001.1 (AGENT): Design the invitation table, multi-add input, and role picker.