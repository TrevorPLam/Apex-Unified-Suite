# tasks/foundation/ONBOARDING.md – Self‑Service Organization Registration & Setup

This file defines the self‑service onboarding flow: organization registration, a guided setup wizard, and the welcome email.  
Without these, the only way to create an organization is via a seed script, which is unacceptable for any real‑world customer.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## Task [ ] ONBOARD‑001: Organization Registration Page

**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No self‑service registration exists. The `organizations` table (DB‑ORG‑001) and authentication services (AUTH‑003, AUTH‑004, AUTH‑005) are defined but have no user‑facing entry point.  
**Size:** Medium  

**Description:**  
Create a public registration form that collects the organization name, a unique slug (URL‑safe identifier), the admin user’s email and password. On submission, the system must atomically create the organization and the admin user, seed default roles for the organization, and return an authenticated session.

**Depends on:**  
- `infrastructure/DATABASE.md → DB‑ORG‑001` (organizations table)  
- `infrastructure/AUTH.md → AUTH‑003` (password hashing)  
- `infrastructure/AUTH.md → AUTH‑004` (JWT service)  
- `infrastructure/AUTH.md → AUTH‑005` (AuthService)  
- `infrastructure/AUTH.md → DB‑IDENTITY‑005` (seed roles)  

**Blocks:** `ONBOARD‑002`, `FRONT‑ONBOARD‑001`

**Related Files:**  
`lib/api‑spec/openapi.yaml`, `artifacts/api‑server/src/routes/onboarding.ts`, `artifacts/api‑server/src/services/onboarding/onboarding‑service.ts`, `artifacts/apex‑os/src/pages/Register.tsx`

**Definition of Done**
- [ ] OpenAPI spec added: `POST /api/v1/onboarding/register` with `RegisterOrganizationRequestBody` schema (company name, slug, admin email, password).  
- [ ] `OnboardingService.register(dto)` implemented:  
  - Validates slug format (`/^[a-z0-9-]+$/`), checks uniqueness.  
  - Creates an organization in a transaction.  
  - Hashes the admin password using `AUTH‑003`.  
  - Creates the admin user with `status: active`.  
  - Seeds default roles (`admin`, `manager`, `user`) and assigns `admin` role to the new user.  
  - Returns `Result<{ organization, user, accessToken }, DomainError>`.  
- [ ] Route handler `POST /onboarding/register` validates the request body using generated Zod schema, calls `OnboardingService`, and returns the access token in a standard envelope.  
- [ ] `DuplicateSlug` returns 409; `WeakPassword` returns 400.  
- [ ] Integration tests pass (green).  
- [ ] Frontend page at `/register` renders the form (see `FRONT‑ONBOARD‑001`).  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- Slug must be unique globally; check against `organizations.slug` inside a transaction.  
- Password strength must be validated server‑side (minimum 8 characters, at least one letter and one number).  
- The admin user must be fully usable immediately after registration (no email verification in V1).  
- The onboarding route must **not** be protected by `requireAuth`.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- onboarding.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Onboarding bridges Identity & Access and Multi‑tenancy contexts. It is a saga orchestrating multiple aggregates.
- TDD: Write integration tests first: successful registration → 201, duplicate slug → 409, weak password → 400.
- BDD: “As a new user, I can register my company and immediately log in.”

---

### Subtasks

- [ ] ONBOARD‑001.0.25 (AGENT): Read DB‑ORG‑001, AUTH‑003, AUTH‑004, AUTH‑005, and the current `organizations` schema. No action — pause.
- [ ] ONBOARD‑001.0.5 (AGENT): Research slug uniqueness constraint handling in PostgreSQL, and transactional user creation patterns with Drizzle.
- [ ] ONBOARD‑001.1 (AGENT): Add `POST /api/v1/onboarding/register` to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen && pnpm typecheck`.
- [ ] ONBOARD‑001.2 (AGENT): Write integration tests (red phase). **File:** `artifacts/api‑server/__tests__/api/onboarding.test.ts` **Verification:** All tests fail.
- [ ] ONBOARD‑001.3 (AGENT): Implement `OnboardingService.register()` with transaction, slug uniqueness, role seeding, and event emission. **File:** `artifacts/api‑server/src/services/onboarding/onboarding‑service.ts` **Verification:** Unit tests pass.
- [ ] ONBOARD‑001.4 (AGENT): Create route handler for `POST /onboarding/register` with Zod validation. **File:** `artifacts/api‑server/src/routes/onboarding.ts` **Verification:** Integration tests green.
- [ ] ONBOARD‑001.5 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Task [ ] ONBOARD‑002: Setup Wizard (Post‑Registration)

**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** After registration, there is no guided setup to configure the organization profile, timezone, currency, or invite team members.  
**Size:** Medium  

**Description:**  
After successful registration, the admin is taken to a multi‑step setup wizard that collects company profile details (logo, industry, size), default currency and timezone, and optionally invites team members. The wizard can be skipped and returned to later from Settings.

**Depends on:** `ONBOARD‑001`, `infrastructure/SETTINGS‑AUDIT.md → API‑SETTINGS‑004` (system settings API)  
**Blocks:** User productivity

**Related Files:**  
`artifacts/api‑server/src/routes/onboarding.ts` (extended), `artifacts/apex‑os/src/pages/SetupWizard.tsx`

**Definition of Done**
- [ ] `PATCH /api/v1/onboarding/wizard` endpoint accepts company profile, currency, timezone, and optional team member invitations.  
- [ ] The service updates the `organizations.settings` JSONB field with the collected data.  
- [ ] If team member emails are provided, it sends an invitation email using the email service (invitation link point to the invitation acceptance flow that will be part of ADMIN‑INVITATIONS).  
- [ ] Frontend wizard component with progress indicator, skip option, and inline validation.  
- [ ] Integration tests verify settings are persisted and invitations are sent.  
- [ ] `pnpm run typecheck` passes.

**Rules to Follow**
- The wizard must be accessible only to the organization admin.  
- All fields except company name are optional; the admin can skip the wizard entirely.  
- Invitation emails must be idempotent (duplicate invocations do not send duplicate emails).  
- The currency field must be an ISO 4217 code; timezone must be an IANA identifier.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- wizard.test.ts
pnpm --filter @workspace/apex‑os test -- SetupWizard.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: The setup wizard is a configuration workflow that updates the Organization aggregate’s settings value object.
- BDD: “As a newly registered admin, I can provide my company details and invite my team, or skip and do it later.”

---

### Subtasks

- [ ] ONBOARD‑002.0.25 (AGENT): Read API‑SETTINGS‑004 and the organizations schema. No action — pause.
- [ ] ONBOARD‑002.1 (AGENT): Add `PATCH /onboarding/wizard` to OpenAPI spec. **File:** `lib/api‑spec/openapi.yaml` **Verification:** `pnpm codegen && pnpm typecheck`.
- [ ] ONBOARD‑002.2 (AGENT): Write integration tests (red). **File:** `artifacts/api‑server/__tests__/api/wizard.test.ts` **Verification:** All red.
- [ ] ONBOARD‑002.3 (AGENT): Extend `OnboardingService` with `completeWizard()` method that updates organization settings, sends invitations, and returns updated profile. **File:** `artifacts/api‑server/src/services/onboarding/onboarding‑service.ts` **Verification:** Unit tests pass.
- [ ] ONBOARD‑002.4 (AGENT): Create route handler. **File:** `artifacts/api‑server/src/routes/onboarding.ts` **Verification:** Integration tests green.
- [ ] ONBOARD‑002.5 (AGENT): Build frontend `SetupWizard` component. **File:** `artifacts/apex‑os/src/pages/SetupWizard.tsx` **Verification:** Component tests with MSW.
- [ ] ONBOARD‑002.6 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Task [ ] ONBOARD‑003: Welcome Email & Getting Started Resources

**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟡 Medium  
**Current State:** No automated welcome email is sent after registration.  
**Size:** Small  

**Description:**  
Trigger a welcome email immediately after successful organization registration. The email includes the admin’s name, the organization slug, a link to the login page, a getting‑started guide, and contact information for support.

**Depends on:** `ONBOARD‑001`, `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001`, `EMAIL‑TEMPLATES‑001`  
**Blocks:** None

**Related Files:**  
`artifacts/api‑server/src/services/onboarding/onboarding‑service.ts`, `artifacts/api‑server/src/lib/email/templates/welcome.ts`

**Definition of Done**
- [ ] `WelcomeEmailTemplate` created with Handlebars variables: `adminName`, `organizationName`, `loginUrl`, `supportEmail`.  
- [ ] `OnboardingService.register()` calls `emailService.sendTemplate('welcome', adminEmail, variables)` after successful registration.  
- [ ] Email sending is fire‑and‑forget; failure does not roll back the registration but logs a warning.  
- [ ] Integration test verifies that the mock email provider receives the welcome email with the correct template and variables.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑server test -- welcome‑email.test.ts
pnpm run typecheck
```

---

### Subtasks

- [ ] ONBOARD‑003.0.25 (AGENT): Read EMAIL‑SERVICE‑001 and EMAIL‑TEMPLATES‑001. No action — pause.
- [ ] ONBOARD‑003.1 (AGENT): Create the `welcome` email template with Zod variable validation. **File:** `artifacts/api‑server/src/lib/email/templates/welcome.ts` **Verification:** Unit tests for template rendering.
- [ ] ONBOARD‑003.2 (AGENT): Wire email dispatch in `OnboardingService.register()`. **File:** `artifacts/api‑server/src/services/onboarding/onboarding‑service.ts` **Verification:** Integration test with mock email provider.
- [ ] ONBOARD‑003.3 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Task [ ] FRONT‑ONBOARD‑001: Onboarding UI (Registration + Wizard)

**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🔴 Critical  
**Current State:** No onboarding pages exist.  
**Size:** Large  

**Description:**  
Build the frontend onboarding experience:
- `/register`: public registration form with company name, slug (with availability check), admin email, and password fields.
- `/setup‑wizard`: multi‑step wizard (profile, team invite, confirmation) accessible only after login.
- All forms use React Hook Form with Zod validation, call the corresponding API endpoints, and provide user‑friendly error messages.

**Depends on:** `ONBOARD‑001`, `ONBOARD‑002`, `infrastructure/AUTH.md → FRONT‑AUTH‑002` (AuthContext)  
**Blocks:** None

**Related Files:**  
`artifacts/apex‑os/src/pages/Register.tsx`, `SetupWizard.tsx`, `artifacts/apex‑os/src/hooks/onboarding/useRegisterOrganization.ts`, `useSetupWizard.ts`

**Definition of Done**
- [ ] Registration page renders form, calls `POST /onboarding/register`, stores returned JWT via AuthContext, and redirects to setup wizard.  
- [ ] Setup wizard renders three steps (Profile, Invite, Confirmation) with progress bar; skip button advances or exits.  
- [ ] Slug field includes a debounced availability check (`GET /api/v1/onboarding/check‑slug?slug=…`).  
- [ ] All API errors are displayed inline (field‑level for validation, toast for generic errors).  
- [ ] Component tests cover happy path and duplicate slug error.  
- [ ] `pnpm run typecheck` passes.

**DDD / TDD / BDD / Deep Module notes**
- TDD: MSW hooks simulate successful registration and settings save.

**Verification**
```bash
pnpm --filter @workspace/apex‑os test -- Register.test.tsx SetupWizard.test.tsx
pnpm run typecheck
```

---

### Subtasks

- [ ] FRONT‑ONBOARD‑001.1 (AGENT): Create `useRegisterOrganization` and `useSetupWizard` hooks. **File:** `artifacts/apex‑os/src/hooks/onboarding/` **Verification:** `pnpm typecheck`.
- [ ] FRONT‑ONBOARD‑001.2 (AGENT): Build `Register` page with React Hook Form. **File:** `artifacts/apex‑os/src/pages/Register.tsx` **Verification:** Component tests.
- [ ] FRONT‑ONBOARD‑001.3 (AGENT): Build `SetupWizard` component. **File:** `artifacts/apex‑os/src/pages/SetupWizard.tsx` **Verification:** Component tests.
- [ ] FRONT‑ONBOARD‑001.4 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---