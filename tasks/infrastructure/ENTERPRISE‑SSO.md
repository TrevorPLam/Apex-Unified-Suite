# tasks/infrastructure/ENTERPRISE‑SSO.md – Enterprise Single Sign‑On (SSO) & SCIM

This file defines the SAML 2.0, OIDC, and SCIM 2.0 capabilities required for enterprise procurement.  
For deals above $25k ARR, SSO is a hard requirement; for the largest enterprises, automated user provisioning via SCIM is mandatory.  
Without these, the platform cannot be sold to any organization with a corporate identity provider (Okta, Azure AD, Google Workspace).

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## SAML 2.0 Service Provider

### [ ] SSO‑001: SAML 2.0 Service Provider Implementation
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No SAML support exists. Corporate identity providers cannot federate with the platform.  
**Size:** Large  

**Description:**  
Implement a SAML 2.0 Service Provider that generates SP metadata (XML), consumes SAML assertions, validates signatures, maps SAML attributes to user fields, and initiates both IdP‑initiated and SP‑initiated login flows. Deep‑link redirect preservation must work in both flows.

**Depends on:** `infrastructure/AUTH.md → AUTH‑008` (auth middleware), `DB‑IDENTITY‑001` (users table)  
**Blocks:** `SSO‑003` (login flows), `SSO‑004` (JIT provisioning), `SSO‑005` (admin UI), enterprise sales

**Related Files:** `artifacts/api‑server/src/services/sso/saml‑service‑provider.ts`, `artifacts/api‑server/src/routes/sso/saml.ts`, `lib/api‑spec/openapi.yaml`

**Definition of Done**
- [ ] `GET /api/v1/sso/saml‑metadata/:organizationId` returns dynamically‑generated SP metadata XML with the correct entity ID, ACS URL, and X.509 certificate.  
- [ ] `POST /api/v1/sso/saml‑acs` (IdP‑initiated) and `GET /api/v1/sso/saml‑login?RelayState=...` (SP‑initiated) implemented.  
- [ ] Assertion Consumer Service (ACS) validates:
  - SAML response signature against the configured IdP certificate.
  - `NotBefore` / `NotOnOrAfter` conditions.

- [ ] Attribute mapping configurable per organization: `{ email: 'NameID' }` or custom attribute; `firstName`, `lastName`, `role` mappings.
- [ ] On successful assertion, issues a JWT (via AUTH‑004) and redirects to the RelayState or dashboard.
- [ ] Unit tests with a pre‑signed SAML response fixture (valid signature, expired condition, wrong issuer).
- [ ] Integration test: simulate IdP‑initiated login → user receives valid JWT.
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- Use `samlify` v2+ or `node‑saml` for SAML operations.  
- Validate `Audience` matches the SP entity ID.  
- Do not accept unsigned assertions in production (`wantAssertionsSigned: true`).  
- IdP certificate must be stored per organization (in `sso_configurations` table) and validated on each login.  
- Deep‑link redirect: `RelayState` must be validated to be a relative path within the application (prevent open redirect).

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- saml‑sp.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: SAML SSO is an integration adapter in the Identity & Access bounded context.  
- TDD: Use a pre‑generated SAML response fixture to test signature validation, condition validation, and attribute mapping.  
- BDD: “As an enterprise user, I can log in through my company’s Okta dashboard without creating a separate password.”

---

### Subtasks
- [ ] SSO‑001.0.25 (AGENT): Read AUTH‑004, AUTH‑008, and DB‑IDENTITY‑001. No action — pause.
- [ ] SSO‑001.0.5 (AGENT): Research `samlify` or `node‑saml` APIs, SAML metadata generation, and `saml2‑js` best practices.
- [ ] SSO‑001.1 (AGENT): Define `sso_configurations` table (organization‑scoped, stores `idpMetadataUrl`, `idpCertificate`, `spPrivateKey`, `attributeMapping`, `enabled`). **File:** `lib/db/src/schema/identity/sso‑configurations.ts` **Verification:** Migration generated; human approval for push.
- [ ] SSO‑001.2 (AGENT): Write unit tests with SAML response fixtures. **File:** `artifacts/api‑server/__tests__/services/sso/saml‑sp.test.ts` **Verification:** All red.
- [ ] SSO‑001.3 (AGENT): Implement SP metadata generation and ACS endpoints. **File:** `artifacts/api‑server/src/services/sso/saml‑service‑provider.ts` **Verification:** Unit tests green.
- [ ] SSO‑001.4 (AGENT): Implement routes for `/saml‑metadata`, `/saml‑login`, `/saml‑acs`. **File:** `artifacts/api‑server/src/routes/sso/saml.ts` **Verification:** Integration test with simulated IdP response.
- [ ] SSO‑001.5 (HUMAN): Final review – verify with Okta or Azure AD test tenant. **Verification:** Approved.

---

## OIDC Relying Party

### [ ] SSO‑002: OIDC Relying Party Implementation
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No OpenID Connect support. Many modern identity providers (Google Workspace, Okta, Auth0) prefer OIDC over SAML.  
**Size:** Medium  

**Description:**  
Implement an OIDC Relying Party that supports the Authorization Code flow with PKCE, discovers IdP configuration via OpenID Discovery, validates ID tokens (JWT), maps claims, and issues Apex access tokens.

**Depends on:** `SSO‑001` (shared SSO configuration table), `AUTH‑004` (JWT service)  
**Blocks:** `SSO‑003`, `SSO‑004`, `SSO‑005`

**Related Files:** `artifacts/api‑server/src/services/sso/oidc‑relying‑party.ts`, `artifacts/api‑server/src/routes/sso/oidc.ts`

**Definition of Done**
- [ ] Discovery endpoint automatically fetched and cached for each configured IdP.  
- [ ] Authorization URL generated with PKCE `code_verifier` (SHA‑256) and `code_challenge`.  
- [ ] Callback endpoint `GET /api/v1/sso/oidc‑callback` validates:
  - `state` parameter against session‑stored value.
  - ID token signature using IdP’s JWKS.
  - `iss` (issuer) and `aud` (audience) claims.
  - `exp` (expiry) and `iat` (issued‑at).
- [ ] Claims mapping: `sub` → `userId`, `email` → email, `groups` → roles (configurable).  
- [ ] On success, issues Apex JWT and redirects to frontend.  
- [ ] Unit tests with a mock OIDC Provider (e.g., `oidc‑provider` package for test).  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- **Always** use PKCE; never use the implicit flow.  
- ID token must be validated against `nonce` if provided.  
- IdP‑issued `sub` must be stable; store `external_sub` in the user record for future matching.  
- Do not trust `id_token` claims for authorization beyond identity; roles come from internal RBAC or group mapping.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- oidc‑rp.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] SSO‑002.0.25 (AGENT): Read AUTH‑004, SSO‑001’s `sso_configurations` table, and OIDC Discovery spec. No action — pause.
- [ ] SSO‑002.1 (AGENT): Write unit tests with mock OIDC provider. **File:** `artifacts/api‑server/__tests__/services/sso/oidc‑rp.test.ts` **Verification:** All red.
- [ ] SSO‑002.2 (AGENT): Implement OIDC client (authorization URL, PKCE, token exchange, ID token validation). **File:** `artifacts/api‑server/src/services/sso/oidc‑relying‑party.ts` **Verification:** Unit tests green.
- [ ] SSO‑002.3 (AGENT): Implement OIDC routes (`/oidc‑login`, `/oidc‑callback`). **File:** `artifacts/api‑server/src/routes/sso/oidc.ts` **Verification:** Integration test.
- [ ] SSO‑002.4 (HUMAN): Final review with Google Workspace or Okta OIDC test. **Verification:** Approved.

---

## Login Flows & Just‑in‑Time Provisioning

### [ ] SSO‑003: IdP‑Initiated and SP‑Initiated Login Flows with Deep‑Link Preservation
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** Neither SAML nor OIDC login flows are implemented. This task unifies them.  
**Size:** Medium  

**Description:**  
Implement both IdP‑initiated (user starts at IdP portal) and SP‑initiated (user clicks “Login with SSO” on Apex) login flows, ensuring deep‑link redirects (e.g., to a specific project or invoice) are preserved through the authentication handshake.

**Depends on:** `SSO‑001`, `SSO‑002`  
**Blocks:** `SSO‑005` (admin UI)

**Related Files:** `artifacts/api‑server/src/services/sso/sso‑orchestrator.ts`, `artifacts/api‑server/src/routes/sso/index.ts`

**Definition of Done**
- [ ] SP‑initiated: `GET /api/v1/sso/login?provider=saml‑<orgOrgId>` (or `oidc‑<orgOrgId>`) with optional `?redirect=<path>`.
  - For SAML: redirects to IdP with `RelayState` set to the deep‑link path.
  - For OIDC: stores redirect path in session/cookie, includes `state` parameter.
- [ ] IdP‑initiated: ACS or callback processes the response, extracts redirect path from `RelayState` or session, issues JWT, redirects to frontend with deep‑link appended.
- [ ] Deep‑link validation: only relative paths allowed; externally‑supplied redirects are rejected.
- [ ] Frontend `LoginPage` includes SSO button and organization‑selector if multiple domains are configured.
- [ ] Integration test: SP‑initiated login with redirect → user lands on the correct page.
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- sso‑flows.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] SSO‑003.1 (AGENT): Implement SSO orchestrator that routes to SAML or OIDC based on configuration. **File:** `artifacts/api‑server/src/services/sso/sso‑orchestrator.ts`
- [ ] SSO‑003.2 (AGENT): Add `redirect` handling with path validation. **Verification:** Unit tests.
- [ ] SSO‑003.3 (AGENT): Build frontend `LoginPage` with SSO button and organization selector. **File:** `artifacts/apex‑os/src/pages/Login.tsx`
- [ ] SSO‑003.4 (AGENT): Write integration test for deep‑link preservation. **Verification:** Green.
- [ ] SSO‑003.5 (HUMAN): Final review and sign‑off.

---

### [ ] SSO‑004: Just‑in‑Time (JIT) User Provisioning
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** Users must be created manually before they can log in via SSO. This defeats the purpose of SSO for large teams.  
**Size:** Medium  

**Description:**  
On successful SAML assertion or OIDC token (first login), automatically create a user record in Apex with the identity provider’s attributes (`sub`, email, name) and assign a default role per the organization’s configuration. If the user already exists (matched by `external_sub` or email), update their attributes instead.

**Depends on:** `SSO‑001`, `SSO‑002`, `DB‑IDENTITY‑001`, `RBAC‑001`  
**Blocks:** Enterprise usage

**Related Files:** `artifacts/api‑server/src/services/sso/jit‑provisioner.ts`

**Definition of Done**
- [ ] JIT provisioning service creates a user with `status: active`, `password_hash: null` (SSO‑only), and stores `external_sub` and `identity_provider` columns.  
- [ ] Default role assignment: configurable per organization (`default_role_on_jit`, defaults to `user`).  
- [ ] Idempotent: if user already exists, update name and other mapped attributes; do not create duplicate.  
- [ ] `UserProvisionedViaSSO` domain event emitted.  
- [ ] Unit tests: new user creation, existing user update, role assignment.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- jit‑provisioner.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] SSO‑004.1 (AGENT): Add `external_sub` and `identity_provider` columns to `users` table. **File:** `lib/db/src/schema/users.ts` **Verification:** Migration (human approval).
- [ ] SSO‑004.2 (AGENT): Implement `JitProvisioner` service. **File:** `artifacts/api‑server/src/services/sso/jit‑provisioner.ts` **Verification:** Unit tests.
- [ ] SSO‑004.3 (AGENT): Integrate JIT call into SAML ACS and OIDC callback handlers. **Verification:** Integration tests.
- [ ] SSO‑004.4 (HUMAN): Final review – test with a new user from Okta test tenant.

---

## Admin Configuration UI

### [ ] SSO‑005: Admin SSO Configuration UI
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No admin interface exists to configure SAML or OIDC. Every SSO setup requires manual database edits and route registration.  
**Size:** Medium  

**Description:**  
Build an admin settings page at `/settings/sso` where organization admins can upload SAML metadata XML (or enter it manually), configure OIDC endpoints, map attributes, upload X.509 certificates, test the connection, and enable/disable SSO for their organization. Also supports domain claim verification to associate an email domain with an organization.

**Depends on:** `SSO‑003` (login flows working), `FRONT‑AUTH‑002`, `API‑SETTINGS‑004`  
**Blocks:** Self‑service SSO for enterprise customers

**Related Files:** `artifacts/apex‑os/src/pages/settings/SSOSettings.tsx`

**Definition of Done**
- [ ] Tabbed interface: SAML | OIDC | SCIM (if enabled).  
- [ ] SAML tab: upload IdP metadata XML (parsed and validated by the backend), custom attribute mapping fields, enable/disable toggle, “Test Connection” button (opens a popup that performs SP‑initiated login and reports success/failure).  
- [ ] OIDC tab: Client ID, Client Secret (masked), Discovery URL, redirect URI (read‑only), “Test Connection” button.  
- [ ] Domain claim: admin can enter a domain, a DNS TXT verification challenge is generated, and the backend verifies ownership before associating the domain with the organization (for IdP‑initiated routing).  
- [ ] All API calls protected by `adminAuthMiddleware`.  
- [ ] Component tests with MSW.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- SSOSettings.test.tsx
pnpm run typecheck
```

---

### Subtasks
- [ ] SSO‑005.0.25 (AGENT): Read API‑SETTINGS‑004 and the SSO backend routes. No action — pause.
- [ ] SSO‑005.1 (AGENT): Build `SSOSettings` page with tabs, form fields, and test‑connection button. **File:** `artifacts/apex‑os/src/pages/settings/SSOSettings.tsx`
- [ ] SSO‑005.2 (AGENT): Backend endpoint for domain claim verification. **File:** `artifacts/api‑server/src/routes/sso/admin.ts`
- [ ] SSO‑005.3 (AGENT): Write integration/component tests. **Verification:** All green.
- [ ] SSO‑005.4 (HUMAN): Final review – test with Okta and Azure AD metadata upload.

---

## SCIM 2.0 Provisioning

### [ ] SSO‑006: SCIM 2.0 Provisioning Endpoint
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No automated user lifecycle management. Large enterprises using Okta or Azure AD need SCIM to provision/deprovision users.  
**Size:** Large  

**Description:**  
Implement a SCIM 2.0 `/api/v1/scim/v2` endpoint that supports `Users` and `Groups` resources, following RFC 7643/7644. Supports Bearer token authentication (a static API key per organization, generated in admin settings). Automatically creates/updates/deactivates users based on SCIM operations, and maps group pushes to Apex roles.

**Depends on:** `SSO‑004` (JIT provisioning), `DB‑IDENTITY‑001`, `RBAC‑001`  
**Blocks:** Enterprise provisioning, SCIM certification with identity providers

**Related Files:** `artifacts/api‑server/src/routes/sso/scim.ts`, `artifacts/api‑server/src/services/sso/scim‑service.ts`

**Definition of Done**
- [ ] `GET /api/v1/scim/v2/ServiceProviderConfig` – returns static SCIM server configuration.  
- [ ] `GET /api/v1/scim/v2/ResourceTypes` – lists supported resource types (`Users`, `Groups`).  
- [ ] `GET /api/v1/scim/v2/Schemas` – returns schema for `User` and `Group`.  
- [ ] `GET /api/v1/scim/v2/Users?filter=...` – SCIM‑compliant user listing with filtering by `userName`, `email`, `externalId`.  
- [ ] `POST /Users` – create user (provision).  
- [ ] `PATCH /Users/{id}` – update user attributes, including `active` flag for deactivation.  
- [ ] `DELETE /Users/{id}` – soft‑deactivate the user (sets `status: suspended`; permanent deletion is manual).  
- [ ] `GET /api/v1/scim/v2/Groups` – list groups → Apex roles.  
- [ ] `PATCH /Groups/{id}` – add/remove members; result syncs to `user_roles` table.  
- [ ] Bearer token authentication using a per‑organization SCIM API key.  
- [ ] Idempotent: duplicate `POST` (same `externalId`) returns existing user.  
- [ ] All responses follow SCIM envelope `{ schemas, id, ... }`.  
- [ ] Integration tests with SCIM client library or hand‑crafted payloads.  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- Use `scim2‑parse‑filter` or similar for SCIM filter parsing.  
- SCIM endpoints must return `Content‑Type: application/scim+json`.  
- The SCIM API key must have a strict scope (only SCIM operations); it is not a full admin key.  
- Never allow SCIM to delete a user record entirely; deactivation only (`active: false`).

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- scim.test.ts
pnpm run typecheck
```

---

### Subtasks
- [ ] SSO‑006.0.25 (AGENT): Read RFC 7643, RFC 7644, and the SCIM‑specific requirements of Okta and Azure AD. No action — pause.
- [ ] SSO‑006.1 (AGENT): Define SCIM API key column on `organizations` table, and secure key generation endpoint. **File:** `lib/db/src/schema/organizations.ts` **Verification:** Migration.
- [ ] SSO‑006.2 (AGENT): Implement `SCIMService` with user/group CRUD. **File:** `artifacts/api‑server/src/services/sso/scim‑service.ts` **Verification:** Unit tests.
- [ ] SSO‑006.3 (AGENT): Implement SCIM routes with SCIM‑specific auth middleware. **File:** `artifacts/api‑server/src/routes/sso/scim.ts` **Verification:** Integration tests with SCIM client.
- [ ] SSO‑006.4 (HUMAN): Manual acceptance test with Okta SCIM provisioning. **Verification:** User created in Okta → appears in Apex; deactivated in Okta → user suspended in Apex.

---

## Manual Acceptance Test Checklist

Before marking the SSO/SCIM module as production‑ready, perform manual tests with three identity providers:

- **Okta** (SAML + OIDC + SCIM)  
- **Azure AD / Microsoft Entra ID** (SAML + OIDC + SCIM)  
- **Google Workspace** (OIDC only, SAML not required but tested if available)

Each provider must pass:
- [ ] SP‑initiated login with and without deep‑link redirect.  
- [ ] IdP‑initiated login from the provider’s dashboard.  
- [ ] JIT provisioning for a first‑time user.  
- [ ] Attribute mapping (name, email) correctly applied.  
- [ ] SCIM: create user, update user, deactivate user, group push to role mapping.  
- [ ] SCIM: de‑provisioned user cannot log in.  
- [ ] Admin UI: metadata upload, test connection, domain claim verification.

---
