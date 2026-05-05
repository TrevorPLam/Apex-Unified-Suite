Here is the final, polished synthesis of both gap‑analysis documents. It merges all findings, resolves inconsistencies, and presents a complete, enterprise‑ready roadmap—no content has been cut.

---

# APEX OS — MASTER GAP INVENTORY & TASK SPECIFICATION (FINAL)

*Based on six rounds of iterative stress‑testing across all seven inspiration platforms, 2026‑2028 compliance mandates, and modern SaaS operational standards.*

**Total new task files to create:** 31  
**Total existing task files to update:** 31  
**Total new individual tasks:** approximately 150+  

This document supersedes all earlier drafts and consolidates every gap identified through the final six‑round analysis. It is the single source of truth for rebuilding the task backlog.

---

## Part 1: Executive Summary

The existing task inventory covers domain models thoroughly, but three categories of gaps remained:

1. **Enterprise procurement gates** – SSO, SCIM, accessibility, email deliverability, DR, incident response, vendor risk, DORA, EU Data Act. Without these, enterprise and EU financial customers cannot purchase.
2. **Missing platform features** – Analytics, Dashboard, Settings UI, onboarding, custom fields, recurring appointments, task dependencies, Karbon‑style email triage, depreciation, deal‑to‑project conversion, engagement lifecycle, shared inbox, metered billing, three‑way matching, PWA.
3. **Operational resilience & compliance completeness** – Feature flags (with rollout/kill switches), subscription billing, GDPR/CCRA/California Delete Act rights, dead letter queues, circuit breakers, OpenTelemetry tracing, data migration utilities, developer portal, API deprecation lifecycle, PostgreSQL RLS across all tenant tables, cyber insurance readiness, PCI DSS scoping, and eIDAS 2.0 signature levels.

The final plan is organized in four tiers, ensuring that every regulatory, commercial, and technical gate is addressed before revenue launch.

---

## Part 2: Master File Inventory

### 2.1 Existing Task Files to Update

| # | File Path | Tasks to Add / Enrich |
|---|-----------|-----------------|
| 1 | `tasks/crm/CRM-LEADS.md` | DB-CRM-001.1 (lead_score), API-CRM-031 (scoring rules), API-CRM-032 (score engine), FRONT-INT-CRM.4 (owner dropdown) |
| 2 | `tasks/finance/FINANCE-MULTI-ENTITY.md` → rename to `FINANCE-ADVANCED.md` | API-AR-001–004 (customer CRUD) |
| 3 | `tasks/finance/FINANCE-INVOICES-PAYMENTS.md` | API-FIN-023 (PDF generation), FRONT-FIN-009 (PDF download) |
| 4 | `tasks/projects/PROJECTS-CORE.md` | DB-PROJ-008 (task dependencies), API-PROJ-022 (dependency CRUD), API-PROJ-023 (circular ref detector) |
| 5 | `tasks/projects/PROJECTS-BOARD-PLANNER.md` | API-PROJ-021 (recurring work plans API), FRONT-PROJ-010 (Gantt view) |
| 6 | `tasks/documents/DOCUMENTS-SHARING.md` | API-DOCS-012 (version comparison), API-DOCS-015 (e‑sign template CRUD), API-ESIGN-005 (eIDAS SES/AES/QES) |
| 7 | `tasks/portal/PORTAL-ACCESS.md` | DB-PORTAL-006 (client tasks), API-PORTAL-005 (client task endpoints), FRONT-PORTAL-002 (client task UI) |
| 8 | `tasks/infrastructure/DEVOPS.md` | JOB-INFRA-001.6 (DLQ storage), JOB-INFRA-001.7 (DLQ dashboard & replay) |
| 9 | `tasks/infrastructure/SECURITY.md` | WS-DLQ-001 (webhook DLQ), SEC-006 (WAF/DDoS ADR), SEC-007 (tenant isolation test suite), SEC-008 (incident response plan), SEC-009 (vendor risk management), SEC-010 (cyber insurance readiness), SEC-011 (tiered rate limiting), SEC-012 (circuit breaker integration) |
| 10 | `tasks/infrastructure/EMAIL-STORAGE.md` | EMAIL-TRACK-001 (tracking pixel + webhook), EMAIL-TRACK-002 (engagement dashboard), EMAIL-INGEST-004 (shared inbox), EMAIL-INGEST-005 (delegated triage) |
| 11 | `tasks/infrastructure/SETTINGS-AUDIT.md` | API-PREF-001 (user prefs API), FRONT-PREF-001 (prefs panel), FRONT-AUDIT-001 (audit log viewer) |
| 12 | `tasks/infrastructure/NOTIFICATIONS.md` | FRONT-NOTIF-001 (notification bell component) |
| 13 | `tasks/foundation/ARCHITECTURE.md` | ARCH-008 (data residency ADR), ARCH-009 (OpenTelemetry ADR), ARCH-010 (encryption strategy ADR), ARCH-011 (multi‑environment deployment ADR), ARCH-012 (NIST SSDF alignment ADR), ARCH-013 (EU Cyber Resilience Act ADR), ARCH-014 (engagement lifecycle scoping ADR), ARCH-015 (data sovereignty vs residency ADR), ARCH-016 (ISO 27001 alignment note) |
| 14 | `tasks/appointments/APPOINTMENTS-EVENT-TYPES.md` | Verify completeness of API-APPT-020 ownership subtasks |
| 15 | `tasks/crm/CRM-DEALS.md` | API-CRM-033 (deal scoring engine) |
| 16 | `tasks/finance/FINANCE-BILLS-APPROVALS.md` | API-AP-009 (three‑way matching engine) |
| 17 | `tasks/infrastructure/DATABASE.md` | DB-RLS-FIN-001 expanded to all tenant tables |
| 18 | `tasks/foundation/TOOLING.md` | TOOLING‑005 (directory scaffolding for all required paths) |
| 19 | `tasks/infrastructure/SUBSCRIPTION-BILLING.md` | API-SUB-004 (metered billing) |
| 20 | `tasks/integrations/INTEGRATION-STRIPE.md` | PCI‑DSS-001 (scope definition & SAQ evidence) |
| 21 | `tasks/infrastructure/OBSERVABILITY.md` | OBS‑007 (performance testing & SLI/SLO definition) |

### 2.2 New Task Files to Create

| # | File Path | Tier | Rationale |
|---|-----------|------|-----------|
| 1 | `tasks/infrastructure/ENTERPRISE-SSO.md` | 0 | Enterprise procurement gate — Okta/Azure/Google SSO mandatory |
| 2 | `tasks/infrastructure/ACCESSIBILITY.md` | 0 | WCAG 2.1 AA legal mandate; DOJ deadlines 2026‑2027 |
| 3 | `tasks/infrastructure/EMAIL-DELIVERABILITY.md` | 0 | Gmail/Yahoo/Microsoft now reject unauthenticated email |
| 4 | `tasks/infrastructure/DISASTER-RECOVERY.md` | 0 | SOC 2 Type II Availability criterion requires documented DR |
| 5 | `tasks/foundation/ONBOARDING.md` | 0 | No self-service tenant provisioning exists |
| 6 | `tasks/infrastructure/FEATURE-FLAGS.md` | 0 | CROSS‑CUTTING‑RULES §9 mandate; plan gating |
| 7 | `tasks/infrastructure/GDPR-COMPLIANCE.md` | 0 | Legal requirement for EU customers; data export + erasure |
| 8 | `tasks/infrastructure/SUBSCRIPTION-BILLING.md` | 0 | Platform monetization — Stripe Billing subscriptions |
| 9 | `tasks/infrastructure/DORA-COMPLIANCE.md` | 0 | Digital Operational Resilience Act for EU financial services |
| 10 | `tasks/infrastructure/INCIDENT-RESPONSE.md` | 0 | SOC 2 CC7.3/7.4, GDPR 72‑hour, DORA/NIS2 incident reporting |
| 11 | `tasks/infrastructure/VENDOR-RISK-MANAGEMENT.md` | 0 | SOC 2 and DORA third‑party ICT oversight |
| 12 | `tasks/infrastructure/EU-DATA-ACT.md` | 0 | Provider switching obligations, comprehensive org‑level export |
| 13 | `tasks/infrastructure/OBSERVABILITY.md` | 1 | OpenTelemetry distributed tracing across all services |
| 14 | `tasks/infrastructure/I18N-L10N.md` | 1 | CROSS‑CUTTING‑RULES §10 mandate; i18next + RTL support |
| 15 | `tasks/security/PENETRATION-TESTING.md` | 1 | SOC 2 de facto requirement; SAST/DAST in CI |
| 16 | `tasks/integrations/EMAIL-INGESTION.md` | 1 | Karbon Triage — email-to-task pipeline |
| 17 | `tasks/integrations/CRM-TO-PROJECTS-SYNC.md` | 1 | Deal won → project created; core unification |
| 18 | `tasks/appointments/RECURRING-APPOINTMENTS.md` | 1 | Calendly series scheduling; RRULE engine |
| 19 | `tasks/infrastructure/RESILIENCE.md` | 1 | Circuit breaker for all external API calls, graceful degradation |
| 20 | `tasks/infrastructure/MOBILE-PWA.md` | 2 | Mobile‑responsive design, PWA manifest, offline support |
| 21 | `tasks/appointments/APPOINTMENTS-API.md` | 2 | Restore 16 lost API‑layer tasks from refactor |
| 22 | `tasks/analytics/ANALYTICS-CORE.md` | 2 | Complete analytics module (backend + frontend) |
| 23 | `tasks/dashboard/DASHBOARD-WIDGETS.md` | 2 | Cross-module KPI dashboard |
| 24 | `tasks/settings/SETTINGS-UI.md` | 2 | Admin settings, role management, API key UI |
| 25 | `tasks/admin/ADMIN-INVITATIONS.md` | 2 | User invitation flow (no direct DB seeding) |
| 26 | `tasks/crm/CUSTOM-FIELDS.md` | 2 | User-defined fields on CRM entities |
| 27 | `tasks/assets/DEPRECIATION.md` | 2 | Asset Tiger core feature — depreciation schedules |
| 28 | `tasks/integrations/ENGAGEMENT-LIFECYCLE.md` | 2 | Karbon‑style engagement lifecycle (proposal → project → billing) |
| 29 | `tasks/infrastructure/DEVELOPER-PORTAL.md` | 3 | External developer portal, SDK generation, sandbox |
| 30 | `tasks/integrations/DATA-MIGRATION.md` | 3 | Competitor CSV import templates |
| 31 | `tasks/integrations/INTEGRATION-SALESFORCE.md` | 3 | Bidirectional Salesforce CRM sync (deferred) |

---

## Part 3: Detailed Task Specifications

### 3.1 Tier 0 — Enterprise Procurement Gates

#### FILE: `tasks/infrastructure/ENTERPRISE-SSO.md`
**Priority:** CRITICAL — Enterprise customers cannot purchase without SSO. For deals above $25k ARR, SCIM is a hard requirement.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| SSO-001 | SAML 2.0 Service Provider — metadata generation, assertion consumption service, attribute mapping (email, name, role) | AUTH-008 (auth middleware) | All enterprise deployments |
| SSO-002 | OIDC Relying Party — discovery endpoint, PKCE flow, claims mapping (sub→userId, groups→roles) | AUTH-008 | Enterprise deployments |
| SSO-003 | IdP-initiated and SP-initiated login flows with deep-link redirect preservation | SSO-001, SSO-002 | — |
| SSO-004 | Just-in-Time user provisioning — create user record from SSO assertion on first login, assign default role per organization | DB-IDENTITY-001 | — |
| SSO-005 | Admin SSO configuration UI — upload SAML metadata XML, configure OIDC endpoints, test connection button, domain claim verification | FRONT-SETTINGS-001 | — |
| SSO-006 | SCIM 2.0 provisioning endpoint — automated user lifecycle (create/update/deactivate) from identity provider, group push to role mapping | SSO-004 | — |

**Verification:** Manual acceptance test with Okta, Azure AD, and Google Workspace as IdPs.

---

#### FILE: `tasks/infrastructure/ACCESSIBILITY.md`
**Priority:** CRITICAL — DOJ Title II enforces WCAG 2.1 AA; private‑sector ADA Title III enforcement is threat‑based. Fines reach $75K for first violation, $150K for repeat.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| A11Y-001 | Accessibility audit of all existing UI components — run axe-core or Lighthouse on every page, generate violation report | All frontend pages exist | — |
| A11Y-002 | Keyboard navigation and focus management — logical tab order, visible focus indicators (WCAG 2.5.5 minimum 2px solid outline with 3:1 contrast), skip-to-content link, focus trapping in modals/drawers | A11Y-001 | — |
| A11Y-003 | Screen-reader support — ARIA labels on all interactive elements, landmark regions (banner, main, navigation, complementary), live regions for async updates (toast notifications, booking confirmation) | A11Y-001 | — |
| A11Y-004 | Color contrast audit — all text meets 4.5:1 ratio for normal text, 3:1 for large text; form error states use icons in addition to color | A11Y-001 | — |
| A11Y-005 | Accessible form patterns — error messages programmatically associated with inputs via aria-describedby, required fields marked with aria-required, input types declared (email, tel, date) | A11Y-001 | — |
| A11Y-006 | Accessibility CI enforcement — integrate eslint-plugin-jsx-a11y into lint pipeline; fail CI on critical violations | TOOLING-002 | — |

**Verification:** `pnpm lint` must pass a11y rules; manual screen-reader test (VoiceOver + NVDA) on all public-facing flows.

---

#### FILE: `tasks/infrastructure/EMAIL-DELIVERABILITY.md`
**Priority:** CRITICAL — Gmail, Yahoo, and Microsoft reject or spam-folder unauthenticated email. Non‑compliant messages are rejected at SMTP level.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| EMAIL-DNS-001 | SPF record — publish TXT record on sending domain authorizing SMTP provider IPs; validate with dig/mxtoolbox | Domain access | All transactional emails |
| EMAIL-DNS-002 | DKIM key generation — generate 2048‑bit RSA key pair, publish public key as CNAME/DNS record, configure SMTP provider to sign outbound mail with private key | EMAIL-DNS-001 | — |
| EMAIL-DNS-003 | DMARC policy deployment — publish DMARC DNS record at `p=none` with aggregate reporting (rua); monitor for 2 weeks, graduate to `p=quarantine`, then `p=reject` | EMAIL-DNS-002 | — |
| EMAIL-DNS-004 | BIMI record — publish brand logo for verified sender display in inbox (requires VMC certificate; optional but enhances trust) | EMAIL-DNS-003 | — |
| EMAIL-DNS-005 | MTA-STS and TLS-RPT — enforce TLS for SMTP connections; receive failure reports for troubleshooting | EMAIL-DNS-001 | — |
| EMAIL-MON-001 | Deliverability dashboard — bounce rate (<2% target), spam complaint rate (<0.10% per Google/Yahoo), delivery rate, DMARC aggregate report parsing | EMAIL-DNS-003 | — |

**Verification:** Send test email to mail-tester.com; score ≥ 9/10. Monitor DMARC aggregate reports for 2 weeks before enforcement.

---

#### FILE: `tasks/infrastructure/DISASTER-RECOVERY.md`
**Priority:** CRITICAL — SOC 2 Type II Availability criterion requires documented and tested DR procedures.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| DR-001 | Define RPO/RTO targets — recommend RPO ≤ 1 hour (continuous WAL archiving), RTO ≤ 4 hours (automated restore) | DB-ORG-001 | — |
| DR-002 | Automated PostgreSQL backups — configure pgBackRest or WAL-G for continuous WAL archiving to R2; full backup daily, incremental every 4 hours | R2 storage adapter (DOC-STORAGE-001) | — |
| DR-003 | Backup retention policy — daily 30 days, weekly 90 days, monthly 12 months; encrypted at rest with KMS-managed keys | DR-002 | — |
| DR-004 | Point-in-time recovery procedure — documented runbook for restoring to any timestamp within retention window; automated via script | DR-002 | — |
| DR-005 | Quarterly restore drill — automated job provisions clean instance, restores latest backup, runs smoke tests, captures evidence for auditor | DR-004 | — |
| DR-006 | Redis persistence — configure AOF (fsync every 1s) + RDB snapshot every 6 hours; backup to R2 | JOB-INFRA-001 (Redis available) | — |
| DR-007 | R2 object storage cross-region replication — replicate document storage bucket to secondary region for geographic redundancy | DOC-STORAGE-001 | — |

**Verification:** Run `pnpm dr:drill` — automated restore test that validates schema integrity.

---

#### FILE: `tasks/foundation/ONBOARDING.md`
**Priority:** CRITICAL — No self-service signup exists. The only way to create an organization is via seed script.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| ONBOARD-001 | Organization Registration page — public signup form (company name, slug, admin email, password); creates org + admin user + seeds default roles in one transaction | DB-ORG-001, AUTH-003, AUTH-004 | — |
| ONBOARD-002 | Setup Wizard — post-registration guided flow: company profile (logo, industry, size), default currency/timezone, invite team members, configure first integration (optional) | ONBOARD-001 | — |
| ONBOARD-003 | Welcome email — triggered on registration, includes getting-started guide link, support contact, first-login deep link | EMAIL-SERVICE-001, EMAIL-TEMPLATES-001 | — |
| FRONT-ONBOARD-001 | Onboarding UI — multi-step wizard component with progress indicator, skip option, inline validation | ONBOARD-001 | — |

**Verification:** Register a new organization end-to-end; verify admin can log in immediately.

---

#### FILE: `tasks/infrastructure/FEATURE-FLAGS.md`
**Priority:** CRITICAL — CROSS‑CUTTING‑RULES §9 mandates feature flags. No plan enforcement exists.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| DB-FLAG-001 | Feature Flags table — `id`, `organization_id` (FK), `flag_key` (text), `enabled` (boolean), `plan_requirement` (enum: free/pro/enterprise), `updated_at` | DB-ORG-001 | — |
| API-FLAG-001 | Feature flag evaluation middleware — `requireFeature(flagKey)` Express middleware factory; queries DB and caches per-org with 5-min TTL; returns 402/403 if flag disabled | DB-FLAG-001, AUTH-008 | All gated features |
| API-FLAG-002 | Feature flag admin endpoints — `GET/PATCH /api/v1/admin/feature-flags/{flagKey}` (admin only); audit logged | DB-FLAG-001 | — |
| API-FLAG-003 | Plan entitlement seed — define which flags are enabled per plan tier at org creation; update on plan change | DB-FLAG-001, DB-IDENTITY-005 | — |
| API-FLAG-004 | Percentage rollout support — flags support 1%, 5%, 25%, 50%, 100% rollout with user‑segment hashing | API-FLAG-001 | — |
| API-FLAG-005 | Kill switch pattern — flags configurable as default‑on emergency kill switches; instant disable bypassing cache | API-FLAG-001 | — |
| FRONT-FLAG-001 | Plan-aware UI gating — `useFeatureFlag(flagKey)` hook; locked features show upgrade prompt with plan comparison link; plan badge in header | API-FLAG-001 | — |

**Verification:** Create a `free` plan org — premium features show upgrade prompt. Upgrade to `pro` — features unlock without page refresh.

---

#### FILE: `tasks/infrastructure/GDPR-COMPLIANCE.md`
**Priority:** CRITICAL — GDPR applies to any org with EU contacts. Right to erasure and data portability are fundamental.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| API-GDPR-001 | Data Export endpoint — `POST /api/v1/gdpr/export` (admin + contact self-service); aggregates all PII per contact across all modules into JSON/CSV; returns download link | All domain CRUD APIs | — |
| API-GDPR-002 | Right to Erasure endpoint — `POST /api/v1/gdpr/erase`; two-phase: immediate soft-delete + 30‑day grace period then hard-delete all PII; preserves anonymized transaction records | API-GDPR-001 | — |
| API-GDPR-003 | Consent management — `GET/PATCH /api/v1/gdpr/consent`; track marketing consent, cookie consent, data processing consent per contact with timestamp and IP | DB-CRM-002 (contacts) | — |
| FRONT-GDPR-001 | Privacy Center UI — preference page where contacts can view data, download export, request erasure, and manage consent; accessible via token-authenticated link in email footer | API-GDPR-001, API-GDPR-002 | — |
| DB-GDPR-001 | Data processing audit log — `gdpr_requests` table tracking all export and erasure requests with status, timestamps, and admin reviewer | DB-ORG-001 | — |
| GDPR‑006 | DPIA template — create Data Protection Impact Assessment aligned with new EDPB standardized template (2026) | GDPR-001–005 | — |
| GDPR‑007 | CCPA/CPRA risk assessment workflow — automated risk assessment before processing that constitutes “selling” or “sharing” personal information under CCPA | GDPR-002 | — |
| GDPR‑008 | California Delete Act — DROP platform integration; process deletion requests every 45 days; annual registration | GDPR-002 | — |
| GDPR‑009 | EU Data Act provider switching — comprehensive org‑level data export in machine‑readable format; switching assistance documentation; 30‑day transition support | GDPR-001, EU-DATA-ACT | — |

**Verification:** Create test contact with data across CRM, appointments, and invoices. Export → verify complete JSON. Erase → verify PII removed after grace period.

---

#### FILE: `tasks/infrastructure/SUBSCRIPTION-BILLING.md`
**Priority:** CRITICAL — No mechanism for charging customers for the platform itself.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| API-SUB-001 | Stripe subscription integration — create Stripe Product/Price objects for each plan tier; `POST /api/v1/billing/subscribe` creates Stripe Checkout session; webhook handler for `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated` | STRIPE_SECRET_KEY | — |
| API-SUB-002 | Plan management — `GET /api/v1/billing/plans`, `GET /api/v1/billing/current`, `POST /api/v1/billing/change-plan` | API-SUB-001 | — |
| API-SUB-003 | Subscription webhook handler — sync `plan_type` and feature flags; payment failure email + banner | API-SUB-001, FEATURE-FLAGS | — |
| API-SUB-004 | Metered billing — report usage records to Stripe Metered Billing API; support per‑seat, per‑document, per‑appointment pricing; idempotent meter events | API-SUB-001 | — |
| FRONT-SUB-001 | Billing settings page — current plan display with feature comparison, upgrade/downgrade buttons, invoice history with PDF download, payment method management (Stripe Customer Portal or embedded) | API-SUB-002 | FRONT-SETTINGS-001 |

**Verification:** Subscribe a test org via Stripe test mode. Verify plan_type updates in DB. Verify feature flags enable accordingly.

---

#### FILE: `tasks/infrastructure/DORA-COMPLIANCE.md` (NEW)
**Priority:** CRITICAL — applicable to any SaaS serving EU financial entities. DORA fully enforceable since Jan 17, 2025.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| DORA‑001 | ICT Risk Management Framework — define risk register, ICT asset inventory, business impact analysis per Articles 5‑16 | DB-ORG-001 | — |
| DORA‑002 | Incident Classification & Reporting — align incident categories with DORA; define regulatory reporting templates; integrate with SOC 2 incident response | IR-001 | — |
| DORA‑003 | Digital Operational Resilience Testing — conduct annual resilience testing of critical ICT systems; document test results for auditors | DORA-001, DORA-002 | — |
| DORA‑004 | Third‑Party ICT Provider Oversight — establish vendor risk tiering, annual reviews, and contractual termination authority over non‑compliant providers | VRM-001 | — |
| DORA‑005 | ICT Audit Logging — ensure `audit_logs` table meets DORA immutability and retention requirements; extend log coverage for all ICT events | DB-ORG-001, AUDIT-LOGS | — |

**Verification:** Produce evidence package for a simulated DORA audit, including risk register, incident reports, resilience test results, and vendor review documentation.

---

#### FILE: `tasks/infrastructure/INCIDENT-RESPONSE.md` (NEW)
**Priority:** CRITICAL — required by SOC 2 CC7.3/7.4, GDPR, DORA, NIS2.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| IR‑001 | Incident Response Plan — define incident classification (P1‑P4), response roles (incident commander, communications lead), detection sources, and escalation matrix | — | — |
| IR‑002 | Breach Notification Templates — GDPR 72‑hour notification template, DORA incident classification template, NIS2 reporting workflow | IR‑001 | — |
| IR‑003 | Annual Tabletop Exercise — schedule and document annual tabletop exercise simulating a critical incident; retain evidence for auditors | IR‑001 | — |
| IR‑004 | Incident Response Integration — wire incident detection alerts from Sentry, threat detection (SEC‑005), and manual channels into the response plan | IR‑001, OBS-001 | — |

**Verification:** Execute a tabletop exercise. Produce incident log and after‑action review.

---

#### FILE: `tasks/infrastructure/VENDOR-RISK-MANAGEMENT.md` (NEW)
**Priority:** CRITICAL — SOC 2 and DORA third‑party oversight.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| VRM‑001 | Vendor Inventory & Risk Tiering — categorize all third‑party providers (Stripe, Plaid, AWS/Cloudflare, SendGrid, etc.) by data access and criticality | — | — |
| VRM‑002 | Annual Vendor Reviews — conduct annual security reviews of critical vendors; collect SOC 2/ISO 27001 reports; document findings | VRM‑001 | — |
| VRM‑003 | DORA Third‑Party Oversight — ensure contracts with ICT providers include termination authority, resilience requirements, and audit rights per DORA Articles 28‑31 | VRM‑001 | — |
| VRM‑004 | Vendor Risk Dashboard — admin‑facing dashboard showing vendor compliance status, review dates, and outstanding findings | VRM‑002, VRM‑003 | — |

**Verification:** Produce a vendor risk register and completed annual review for a critical vendor.

---

#### FILE: `tasks/infrastructure/EU-DATA-ACT.md` (NEW)
**Priority:** CRITICAL — provider switching obligations (effective Sept 2025, enforcement by Sept 2027).

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| EU‑DATA‑001 | Comprehensive Org‑Level Export — provide API and UI to export all organization data (CRM, projects, finance, documents, etc.) in machine‑readable format | All domain CRUD APIs | — |
| EU‑DATA‑002 | Switching Assistance Documentation — publish documentation guiding customers through data migration to another provider; meet 30‑day transition obligation | EU‑DATA‑001 | — |
| EU‑DATA‑003 | Contract Transparency — ensure customer contracts disclose data portability rights, switching procedures, and any technical limitations | — | — |

**Verification:** Perform a full org export and verify completeness against a reference tenant.

---

### 3.2 Tier 1 — Essential Before Enterprise Sale

#### FILE: `tasks/infrastructure/OBSERVABILITY.md`
**Priority:** HIGH — Sentry covers error tracking but no distributed tracing exists.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| OBS-001 | OpenTelemetry SDK initialization — install @opentelemetry/sdk-node, @opentelemetry/auto-instrumentations-node; initialize before any application code; configure OTLP exporter to send traces to collector | MON-003 (structured logging) | — |
| OBS-002 | Express auto-instrumentation — automatic span creation for all HTTP requests with route, method, status code; request ID propagation via W3C Trace Context headers | OBS-001 | — |
| OBS-003 | Database query instrumentation — automatic spans for PostgreSQL queries via @opentelemetry/instrumentation-pg; capture query text (sanitized), duration, row count | OBS-001 | — |
| OBS-004 | Custom spans for business operations — manually instrument: Stripe API calls, Plaid API calls, calendar sync operations, email sends, BullMQ job processing | OBS-001 | — |
| OBS-005 | Frontend RUM integration — @opentelemetry/sdk-trace-web with fetch/XHR auto-instrumentation; user timing marks for key interactions (booking flow, payment, document upload) | OBS-001 | — |
| OBS-006 | SLI/SLO dashboard — define Service Level Indicators (latency p95, error rate, throughput) per endpoint; create Grafana dashboard or similar with SLO burn rate alerts | OBS-002, OBS-003 | — |
| OBS-007 | Performance Testing & SLI/SLO — define p95 latency targets per endpoint category (API <500ms, search <1s, real‑time <200ms); load test simulations with concurrent tenants; performance regression detection in CI | OBS-006 | — |
| OBS-SUB-001 | ADR-009 update — document OpenTelemetry strategy; decision to use OTLP exporter with vendor-neutral collector for multi-cloud portability | ARCH-009 ADR | — |

**Verification:** Generate load; verify spans appear in tracing backend with full waterfall from HTTP → service → DB → external API.

---

#### FILE: `tasks/infrastructure/I18N-L10N.md`
**Priority:** HIGH — CROSS‑CUTTING‑RULES §10 mandates: all user-facing strings must be extracted; RTL support required.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| I18N-001 | Install and configure i18next/react-i18next — namespace-based translation files under `locales/`; language detection (browser preference → localStorage override → URL param); fallback chain to `en` | All frontend pages | — |
| I18N-002 | Extract all user-facing strings — scan all `.tsx` files for hardcoded English strings; create `en.json` base translation file organized by module | I18N-001 | — |
| I18N-003 | Date/time/number formatting — use `Intl.DateTimeFormat`, `Intl.NumberFormat` per detected locale; replace all non‑locale‑aware formatting | I18N-001 | — |
| I18N-004 | RTL layout verification — test with Arabic (`ar`) locale; verify flex direction flips, text alignment mirrors, icons don't rotate meaninglessly | I18N-001 | — |
| I18N-005 | Translation management — document workflow for adding new strings; CI check that all i18n keys exist in all supported locale files (en, es, fr, de, ar initially) | I18N-002 | — |

**Verification:** Switch locale to Arabic; verify layout flips to RTL, dates format correctly.

---

#### FILE: `tasks/security/PENETRATION-TESTING.md`
**Priority:** HIGH — SOC 2 auditors treat penetration testing as a de facto necessity.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| PENTEST-001 | SAST integration — integrate Semgrep (or SonarQube) into CI pipeline; scan on every PR; fail on high/critical severity findings; baseline existing code with triaged false positives | CI-001 | — |
| PENTEST-002 | DAST scanning — configure OWASP ZAP in staging environment; weekly automated scan of all API endpoints; generate report for audit evidence | SEC-001, SEC-002 | — |
| PENTEST-003 | Annual third-party penetration test — define scope document; engage certified firm; remediate findings within SLA (critical: 48h, high: 1 week, medium: 30 days); retain report for auditor | PENTEST-001, PENTEST-002 | — |
| PENTEST-004 | Vulnerability disclosure program — publish security.txt at `/.well-known/security.txt`; establish `security@` email alias; define bug bounty or responsible disclosure policy | — | — |
| PENTEST-005 | Dependency vulnerability scanning — `pnpm audit` in CI; automated PR creation (Dependabot/Renovate) for critical CVE patches; SLA: critical patches merged within 24h | DEP-001 | — |

**Verification:** Run `pnpm pentest:check` — combines SAST + dependency audit; must pass in CI.

---

#### FILE: `tasks/integrations/EMAIL-INGESTION.md`
**Priority:** HIGH — Karbon's Triage paradigm: converting emails to tasks is the central work management paradigm.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| EMAIL-INGEST-001 | Inbound email adapter interface — `EmailIngestionPort` with `fetchEmails()`, `parseEmail(raw)`; IMAP implementation or mailgun/sendgrid webhook parser | EMAIL-SERVICE-001 | — |
| EMAIL-INGEST-002 | Email-to-task converter — subscriber on `EmailReceived` domain event; lookup sender by email → find/create contact; create CRM activity; optionally create CRM task linked to contact with email body as description | DB-CRM-005, DB-CRM-006 | — |
| EMAIL-INGEST-003 | Email attachment extraction — parse MIME attachments; upload to document storage via `StorageAdapter`; link to CRM activity | DOC-STORAGE-001 | — |
| EMAIL-INGEST-004 | Shared Inbox Management — configure team‑shared email inboxes with assignment rules; manage alongside personal inbox | EMAIL-INGEST-001 | — |
| EMAIL-INGEST-005 | Triage Delegation — temporarily/permanently delegate triage to trusted colleagues with full audit trail and permission controls | EMAIL-INGEST-002 | — |
| FRONT-EMAIL-TRIAGE-001 | Triage View UI — dedicated inbox page showing unprocessed emails; quick actions: assign to project, convert to task, reply, archive; split-pane with email preview and task creation form | FRONT-CRM-001 | — |

**Verification:** Send test email to configured inbox; verify CRM activity created; convert to task via Triage UI.

---

#### FILE: `tasks/integrations/CRM-TO-PROJECTS-SYNC.md`
**Priority:** HIGH — Core unification between sales and delivery. Deal won → project created.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| INT-CRMPROJ-001 | Deal-to-Project automation — subscriber on `Deal.Won` domain event; instantiate default project template; copy linked contacts as project client; pre-populate tasks from deal line items | CRM deals API, Projects template API, EVENT-001 | — |
| INT-CRMPROJ-002 | Deal-to-Invoice automation — subscriber on `Deal.Won`; create draft invoice from deal amount and line items; link to created project | INT-CRMPROJ-001, Finance invoice API | — |
| FRONT-CRMPROJ-001 | Deal Workspace "Create Project" button — manual trigger with template selection; preview modal showing what will be created; navigate to new project on confirmation | FRONT-CRM-014, FRONT-PROJ-006 | — |

**Verification:** Mark deal as won; verify project created with tasks matching deal line items; verify contacts linked.

---

#### FILE: `tasks/appointments/RECURRING-APPOINTMENTS.md`
**Priority:** HIGH — Calendly supports recurring meeting series. Explicitly marked "out of scope" with no deferred task.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| DB-APPT-015 | Recurring Appointment Series table — `id`, `event_type_id`, `rrule` (iCal RRULE string), `start_date`, `end_after` (date or count), `generated_instances_count`, `allow_overrides` (boolean) | DB-APPT-009 | — |
| API-APPT-021 | Recurring series CRUD — create series with RRULE validation; generate single-instance overrides; delete series with option to cancel all future instances | DB-APPT-015, EVENT-001 | — |
| API-APPT-022 | Instance generation engine — on series creation, generate instances up to rolling 90-day window; daily cron regenerates as window advances; idempotent (no duplicates) | API-APPT-021 | — |
| FRONT-APPT-015 | Recurring event type configuration — RRULE builder UI (weekly on Mon/Wed/Fri, monthly on 15th, etc.); preview calendar showing next 10 instances; override individual instance dates | API-APPT-021 | — |

**Verification:** Create weekly recurring appointment for 12 weeks; verify 12 instances generated; cancel series; verify all future instances removed.

---

#### FILE: `tasks/infrastructure/RESILIENCE.md` (NEW)
**Priority:** HIGH — circuit breaker for all external API calls, graceful degradation.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| RESILIENCE‑001 | Circuit Breaker Implementation — wrap all external API calls (Stripe, Plaid, Google, Microsoft, Zoom, Xero, QuickBooks, SendGrid, R2) with Opossum circuit breakers; configure thresholds and fallback strategies | All integration points | — |
| RESILIENCE‑002 | Graceful Degradation Patterns — define degraded mode behaviors (e.g., queuing payments when Stripe is down, serving stale cache when CRM is unreachable); implement across all bounded contexts | RESILIENCE‑001 | — |
| RESILIENCE‑003 | Failure Metrics & Dashboards — expose circuit breaker state, failure rates, and recovery events via Prometheus metrics and Grafana dashboard | RESILIENCE‑001, OBS-006 | — |

**Verification:** Kill Stripe connectivity; verify circuit opens, fallback activates, and dashboard reflects state.

---

### 3.3 Tier 2 — Completes Core Product

#### FILE: `tasks/appointments/APPOINTMENTS-API.md`
**Priority:** HIGH — The refactor stripped all API‑layer tasks from Appointments. This file restores all 16 missing API tasks, enriched with round‑robin selection.

| Task ID | Endpoint Group | Depends On |
|---------|---------------|-----------|
| API-APPT-001 | Appointments core — OpenAPI spec (GET/POST/PATCH/DELETE /appointments) | DB-APPT-001 |
| API-APPT-002 | Appointments core — Integration tests (red) | API-APPT-001 |
| API-APPT-003 | Appointments core — AppointmentService + AppointmentRepository | DB-APPT-001, EVENT-001 |
| API-APPT-004 | Appointments core — Routes & green tests | API-APPT-003 |
| API-APPT-005 | Availability Windows — CRUD API | DB-APPT-002 |
| API-APPT-006 | Calendar Connections — link/unlink/sync-status API | DB-APPT-005 |
| API-APPT-007 | Meeting Integrations — API (auto-create Zoom/Teams/Meet) | DB-APPT-006 |
| API-APPT-008 | Appointment Payments — API (payment status, refund) | DB-APPT-007 |
| API-APPT-009 | Event Types — CRUD API; enriched with round‑robin distribution method selection (optimize for availability, equal distribution, priority) and pooled availability computation | DB-APPT-009 |
| API-APPT-010 | Routing Forms — CRUD API | DB-APPT-011 |
| API-APPT-011 | Waitlist — join/view/manage API | DB-APPT-012 |
| API-APPT-012 | No-Show Log — mark/view API | DB-APPT-013 |
| API-APPT-013 | Availability Rules — per-user config API | DB-APPT-002 |
| API-APPT-014 | Meeting Polls — create/vote/close API | DB-APPT-008 |
| API-APPT-015 | Booking Rules — CRUD API | DB-APPT-003 |
| API-APPT-016 | Collective Exclusions — CRUD API | DB-APPT-014 |

**Verification:** Each task's integration tests must pass before the next task begins.

---

#### FILE: `tasks/analytics/ANALYTICS-CORE.md`
**Priority:** HIGH — Analytics and Dashboard pages are mock shells only.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| DB-ANALYTICS-001 | Analytics Reports Metadata table | DB-ORG-001 | — |
| DB-ANALYTICS-002 | Analytics Snapshots table (cached results) | DB-ANALYTICS-001 | — |
| API-ANALYTICS-001 | Analytics OpenAPI spec | DB-ANALYTICS-001 | — |
| API-ANALYTICS-002 | Integration tests (red) | API-ANALYTICS-001 | — |
| API-ANALYTICS-003 | Analytics Service — compute pipeline conversion rates, invoice aging AR, project health, asset utilization %, appointment booking trends; cache results | All domain APIs, DB-ANALYTICS-002 | — |
| API-ANALYTICS-004 | Routes & green tests | API-ANALYTICS-003 | — |
| FRONT-ANALYTICS-001 | Analytics page — replace mock data; build dynamic charts with Recharts (pipeline funnel, revenue line chart, project burn-down, appointment booking volume); filters for date range, module, team member | API-ANALYTICS-004 | — |

**Verification:** Generate test data across CRM/Finance/Projects; run sales pipeline report; verify conversion rates match expected.

---

#### FILE: `tasks/dashboard/DASHBOARD-WIDGETS.md`
**Priority:** HIGH — Dashboard page is mock-only.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| API-DASH-001 | Composite Dashboard endpoint — `GET /api/v1/dashboard` returns aggregated KPIs | All domain APIs | — |
| API-DASH-002 | Dashboard Service — parallel aggregation from all bounded contexts via Promise.all; cache per org | API-DASH-001 | — |
| FRONT-DASH-001 | Dashboard page — grid of widget cards (summary KPI, recent activity feed, pipeline chart mini, overdue invoice list, upcoming appointments list); WebSocket updates optional | API-DASH-002, WS-INFRA-001 | — |

**Verification:** Login as admin; verify dashboard shows real data from all modules.

---

#### FILE: `tasks/settings/SETTINGS-UI.md`
**Priority:** HIGH — System settings API exists but no admin settings UI.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| FRONT-SETTINGS-001 | Organization Settings page — tabs: General, Branding, Integrations, Billing | API-SETTINGS-004, SUBSCRIPTION-BILLING | — |
| FRONT-SETTINGS-002 | User & Role Management — admin-only user list, invite button, role assignment dropdown with permission preview, deactivate/reactivate, audit log per user | API-ADMIN-INVITATIONS, RBAC-001 | — |
| FRONT-SETTINGS-003 | API Key Management — generate new key with scope selection, copy-once display, list with last-used timestamp, revoke action | AUTH-009-API-KEY | — |
| FRONT-SETTINGS-004 | Security settings page — SSO configuration upload (SAML metadata XML), session timeout policy, password policy, IP allowlist | SSO-005 | — |

**Verification:** Update organization name; verify header and portal reflect change immediately.

---

#### FILE: `tasks/admin/ADMIN-INVITATIONS.md`
**Priority:** HIGH — The only way to create users is via seed script.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| DB-ADMIN-001 | Invitations table — `id`, `organization_id`, `email`, `invited_by` (FK), `role_id` (FK), `token_hash` (SHA‑256), `expires_at`, `status` | DB-ORG-001, DB-IDENTITY-001, DB-IDENTITY-002 | — |
| API-ADMIN-001 | Invitation endpoints — `POST /api/v1/admin/invitations` (admin, rate limited); sends email with magic link; `GET /api/v1/accept-invite?token=` validates; `POST /api/v1/accept-invite` creates user with role assignment | DB-ADMIN-001, EMAIL-SERVICE-001 | — |
| API-ADMIN-002 | Integration tests & service | API-ADMIN-001 | — |
| FRONT-ADMIN-001 | Invite Users UI — multi-add email input, role dropdown; pending invitations list with resend/revoke actions; acceptance status tracking | API-ADMIN-002 | — |

**Verification:** Invite test user; click magic link; complete registration; verify assigned role.

---

#### FILE: `tasks/crm/CUSTOM-FIELDS.md`
**Priority:** MEDIUM — ActiveCampaign supports custom objects and fields. No equivalent exists.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| DB-CRM-010 | Custom Field Definitions table | DB-ORG-001 | — |
| DB-CRM-011 | Custom Field Values table (EAV) | DB-CRM-010 | — |
| API-CRM-028 | Custom Fields CRUD — manage definitions; set values; values returned inline on entity GET | DB-CRM-010, DB-CRM-011 | — |
| API-CRM-029 | Custom fields validation — field_type constraints, required, dropdown options | API-CRM-028 | — |
| FRONT-CRM-010 | Custom Field Builder — admin settings page: drag-to-reorder, add new field modal; dynamic form fields on lead/contact/deal create/edit pages | API-CRM-028 | — |

**Verification:** Create custom dropdown "Industry" on contacts. Add value to a contact. Verify appears in detail and is searchable.

---

#### FILE: `tasks/assets/DEPRECIATION.md`
**Priority:** MEDIUM — Asset Tiger's core feature.

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| DB-ASSETS-004 | Depreciation Schedules table | DB-ASSETS-001 | — |
| DB-ASSETS-005 | Depreciation Entries table (append-only) | DB-ASSETS-004 | — |
| API-ASSETS-013 | Depreciation engine — `POST /assets/{assetId}/depreciation/calculate`; monthly background job; retroactive catch-up | DB-ASSETS-004, DB-ASSETS-005 | — |
| API-ASSETS-014 | Depreciation API — schedule & entries; update method triggers recalculation | API-ASSETS-013 | — |
| FRONT-ASSETS-002 | Depreciation report — table, chart (area), book value vs original cost | API-ASSETS-014 | — |

**Verification:** Add asset $10K cost, 5‑year life, straight-line. Verify monthly = $166.67; after 12 months accumulated = $2,000.

---

#### FILE: `tasks/infrastructure/MOBILE-PWA.md` (NEW)

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| MOBILE‑001 | Responsive Design Audit — ensure all pages render correctly 320px–1920px; touch‑friendly targets (44px) | All frontend pages | — |
| MOBILE‑002 | PWA Manifest & Service Worker — installable PWA with offline shell; background sync for pending actions | MOBILE‑001 | — |
| MOBILE‑003 | Barcode Scanning Integration — camera‑based barcode scanning for Assets module (Asset Tiger parity) | MOBILE‑001 | — |

---

#### FILE: `tasks/integrations/ENGAGEMENT-LIFECYCLE.md` (NEW)

| Task ID | Description | Depends On | Blocks |
|---------|-------------|-----------|--------|
| ENGAGE‑001 | Engagement CRUD & Status Machine — formal engagement entity linking proposal, agreement, project, and billing phases | CRM, Projects, Finance APIs | — |
| ENGAGE‑002 | Bulk Engagement Creation — batch‑create engagements for up to 50 clients from CSV or deal selection | ENGAGE‑001 | — |
| ENGAGE‑003 | Engagement Workspace UI — dashboard showing engagement progress, linked deals, projects, invoices, and client portal status | ENGAGE‑001, FRONT-PROJ-006 | — |

**Verification:** Create an engagement, link a won deal, verify project and invoice are associated automatically.

---

### 3.4 Tier 3 — Polish, Migration & Infrastructure

#### FILE: `tasks/integrations/DATA-MIGRATION.md`

| Task ID | Description |
|---------|-------------|
| MIGRATE-001 | Competitor CSV templates — define templates for ActiveCampaign, HubSpot, Calendly, Bill.com, Asset Tiger; document column mappings |
| MIGRATE-002 | Field mapping wizard — upload CSV, auto-detect format, preview mapped fields, user overrides, batch import via existing pipeline (API-IMPORT-001) |
| FRONT-MIGRATE-001 | Migration wizard UI — step‑by‑step: select platform → upload CSV → review mapping → preview 5 rows → execute import with progress bar |

---

#### FILE: `tasks/infrastructure/DEVELOPER-PORTAL.md` (NEW)

| Task ID | Description |
|---------|-------------|
| DEV‑PORTAL‑001 | API Reference & Interactive Docs — serve interactive API documentation with authentication, testing, and SDK generation |
| DEV‑PORTAL‑002 | Sandbox Environment — tenant‑scoped sandbox for external developers to test integrations |
| DEV‑PORTAL‑003 | API Changelog & Deprecation Notices — public changelog; proactive notifications for API consumers |

---

#### FILE: `tasks/integrations/INTEGRATION-SALESFORCE.md` (NEW – deferred)

| Task ID | Description |
|---------|-------------|
| SF‑001 | Salesforce OAuth & Object Mapping — authenticate, map Apex leads/contacts/deals to Salesforce objects |
| SF‑002 | Bidirectional Sync — push/pull with conflict resolution; scheduled background job |

---

### 3.5 Additions to Existing Files (detailed)

*(All tasks listed in the master file inventory above are included here with full detail for the final spec.)*

#### `tasks/crm/CRM-LEADS.md`
| Task ID | Description |
|---------|-------------|
| DB-CRM-001.1 | Add `lead_score` column (integer, nullable) to leads table; index on `(organization_id, lead_score DESC)` |
| API-CRM-031 | Lead Scoring Rules CRUD — `GET/POST/PATCH/DELETE /crm/lead-scoring-rules`; rule: `{ condition, points }` |
| API-CRM-032 | Score computation engine — subscriber on `EmailOpened`, `SiteVisited`, etc.; apply matching rules; update `lead_score` atomically; emit `LeadScoreChanged` |
| FRONT-INT-CRM.4 | Owner assignment dropdown on lead/contact/deal detail panels; optimistic update |

#### `tasks/finance/FINANCE-ADVANCED.md` (renamed from FINANCE-MULTI-ENTITY.md)
| Task ID | Description |
|---------|-------------|
| API-AR-001 | Customers — Expand OpenAPI Spec |
| API-AR-002 | Customers — Integration Tests (Red) |
| API-AR-003 | Customers — Service & Repository (credit limit, payment term defaults) |
| API-AR-004 | Customers — Routes & Green Tests |

#### `tasks/finance/FINANCE-INVOICES-PAYMENTS.md`
| Task ID | Description |
|---------|-------------|
| API-FIN-023 | Invoice PDF Generation — `POST /api/v1/invoices/{invoiceId}/pdf`; branded PDF using PDFKit/Puppeteer; cache in R2; return signed URL |
| FRONT-FIN-009 | PDF download button on invoice detail page; preview before download |

#### `tasks/projects/PROJECTS-CORE.md`
| Task ID | Description |
|---------|-------------|
| DB-PROJ-008 | Task Dependencies — add `depends_on`, `dependency_type` (FS, SS, FF, SF), `lag_days` to tasks table |
| API-PROJ-022 | Task Dependency CRUD — create/update/delete; circular reference detection via DFS; cascade delete |
| API-PROJ-023 | Dependency-constrained scheduling — validate feasible due dates; warn on conflict |

#### `tasks/projects/PROJECTS-BOARD-PLANNER.md`
| Task ID | Description |
|---------|-------------|
| API-PROJ-021 | Recurring Work Plans API — CRUD and manual trigger generation |
| FRONT-PROJ-010 | Gantt Timeline View — render tasks with dependency arrows; drag to adjust; highlight critical path |

#### `tasks/documents/DOCUMENTS-SHARING.md`
| Task ID | Description |
|---------|-------------|
| API-DOCS-012 | Document Version Comparison — `GET .../versions/compare?v1=&v2=` returns diff |
| API-DOCS-015 | E-Signature Template CRUD — reusable across multiple signature requests |
| API-ESIGN‑005 | eIDAS signature levels — support SES, AES, QES; QTSP integration for QES |

#### `tasks/portal/PORTAL-ACCESS.md`
| Task ID | Description |
|---------|-------------|
| DB-PORTAL-006 | Portal Client Tasks — junction table with status, client notes, assigned_at |
| API-PORTAL-005 | Client Task endpoints — `GET /portal/me/tasks`, `PATCH ...`; firm assigns tasks |
| FRONT-PORTAL-002 | Client Task View — status badges, due dates, action buttons |

#### `tasks/infrastructure/DEVOPS.md`
| Subtask | Description |
|---------|-------------|
| JOB-INFRA-001.6 | Dead Letter Queue — BullMQ failed queue after 5 retries, 30-day TTL, metadata |
| JOB-INFRA-001.7 | DLQ dashboard and replay — Bull Board panel, retry/dismiss buttons |

#### `tasks/infrastructure/SECURITY.md`
| Task ID | Description |
|---------|-------------|
| WS-DLQ-001 | Webhook Dead Letter Queue — store failed webhook payloads after 5 retries; dashboard replay; alert if failure rate >5% |
| SEC-006 | WAF/DDoS Protection ADR — Cloudflare/AWS Shield at infrastructure level |
| SEC-007 | Tenant Isolation Automated Test Suite — cross-tenant access attempts, missing org_id filter, API tampering; run in CI; must all pass |
| SEC-008 | Incident Response Plan & Breach Notification (cross‑ref to INCIDENT-RESPONSE.md) |
| SEC-009 | Vendor Risk Management Program (cross‑ref to VENDOR-RISK-MANAGEMENT.md) |
| SEC-010 | Cyber Insurance Readiness — document MFA, patching cadence (7 days), evidence for applications |
| SEC-011 | Tiered Rate Limiting — per‑plan (Free: 10 rpm, Pro: 30, Enterprise: customizable) |
| SEC-012 | Circuit Breaker Integration — register breaker states in health endpoint |

#### `tasks/infrastructure/EMAIL-STORAGE.md`
| Task ID | Description |
|---------|-------------|
| EMAIL-TRACK-001 | Email Open/Click Tracking — tracking pixel, webhook endpoint, link rewrite, `email_events` table |
| EMAIL-TRACK-002 | Email Engagement Dashboard — open/click rates, click map, bounce classification |
| EMAIL-INGEST-004 | Shared Inbox Management — team inboxes with assignment rules |
| EMAIL-INGEST-005 | Triage Delegation — delegate with audit trail, permission controls |

#### `tasks/infrastructure/SETTINGS-AUDIT.md`
| Task ID | Description |
|---------|-------------|
| API-PREF-001 | User Preferences API — `GET/PUT /api/v1/users/me/preferences`; theme, language, notifications, timezone |
| FRONT-PREF-001 | User Preferences Panel — avatar dropdown; theme toggle, language, notification channels |
| FRONT-AUDIT-001 | Audit Log Viewer — admin page at `/settings/audit-log`; filters, expandable row JSON diff, CSV export |

#### `tasks/infrastructure/NOTIFICATIONS.md`
| Task ID | Description |
|---------|-------------|
| FRONT-NOTIF-001 | Notification Bell — header icon with unread badge; dropdown list; "Mark all read"; click navigates to entity; polling/WebSocket updates |

#### `tasks/foundation/ARCHITECTURE.md`
| Task ID | Description |
|---------|-------------|
| ARCH-008 | Data Residency ADR — multi-region deployment strategy; region tag on orgs |
| ARCH-009 | OpenTelemetry Observability ADR — vendor‑neutral OTLP exporter; spans across stack |
| ARCH-010 | Encryption‑at‑Rest Strategy ADR — envelope encryption AES‑256‑GCM; key hierarchy |
| ARCH-011 | Multi‑Environment Deployment Strategy ADR — dev → staging → production pipeline |
| ARCH-012 | NIST SSDF Alignment ADR — map CI/CD, dependency scanning to SSDF tasks; SBOM |
| ARCH-013 | EU Cyber Resilience Act Compliance ADR — SBOM, vulnerability disclosure, secure dev attestation |
| ARCH-014 | Engagement Lifecycle Scoping ADR — boundary, deferral decision |
| ARCH-015 | Data Sovereignty vs. Residency Strategy — distinction and implications for EU financial services |
| ARCH-016 | ISO 27001 Alignment Note — overlap with SOC 2, roadmap for future certification |

#### `tasks/crm/CRM-DEALS.md`
| Task ID | Description |
|---------|-------------|
| API‑CRM‑033 | Deal Scoring Engine — mirror lead scoring architecture applied to Deals aggregate |

#### `tasks/finance/FINANCE-BILLS-APPROVALS.md`
| Task ID | Description |
|---------|-------------|
| API‑AP‑009 | Three‑Way Matching Engine — validate bill against PO and item receipt; tolerance thresholds; auto‑approve within tolerance |

#### `tasks/infrastructure/DATABASE.md`
| Task ID | Description |
|---------|-------------|
| DB-RLS-FIN-001 | Expand PostgreSQL RLS to all tenant‑scoped tables; auto‑generate policies from schemas; set `app.current_organization_id` per session |

#### `tasks/integrations/INTEGRATION-STRIPE.md`
| Task ID | Description |
|---------|-------------|
| PCI‑DSS‑001 | Define PCI DSS scope (SAQ A or A‑EP); collect and maintain evidence for annual attestation |

#### `tasks/foundation/TOOLING.md`
| Task ID | Description |
|---------|-------------|
| TOOLING‑005 | Directory Scaffolding — create all required directory paths referenced by task files (services, repositories, middleware, tests, seed, docs/adr, etc.) |

#### `tasks/infrastructure/OBSERVABILITY.md` (enrich)
| Task ID | Description |
|---------|-------------|
| OBS‑007 | Performance Testing & SLI/SLO — define p95 latency targets; load test with concurrent tenants; regression detection in CI |

#### `tasks/infrastructure/SUBSCRIPTION-BILLING.md` (enrich)
| Task ID | Description |
|---------|-------------|
| API-SUB-004 | Metered billing — report usage to Stripe Metered Billing API; per‑seat, per‑document, per‑appointment pricing; idempotent events |

---

## Part 4: Priority Tiers (Final)

| Tier | Label | Gates Unblocked | Files to Create/Update |
|------|-------|----------------|----------------------|
| **0** | Enterprise Procurement Gate | Enterprise sales, SOC 2 Type II, DORA, GDPR/CCPA/EU Data Act, legal compliance, email delivery, incident response, vendor risk, cyber insurance readiness | 12 new files + 8 existing updates |
| **1** | Essential Before Enterprise Sale | Observability, internationalization, penetration testing, Karbon triage, CRM‑to‑Projects sync, recurring appointments, circuit breaker, resilience, data sovereignty, ISO 27001 awareness, PCI DSS scope, eIDAS signature levels, NIS2 awareness, CRA/SBOM | 8 new files + 14 existing updates |
| **2** | Completes Core Product | Analytics, Dashboard, Settings, Admin, Custom Fields, Depreciation, Appointments API restoration, Mobile/PWA, Engagement lifecycle, deal scoring, three‑way matching, contract management, API deprecation, RLS expansion | 8 new files + 10 existing updates |
| **3** | Polish & Ecosystem | Migration utilities, Gantt view, client tasks, PDF generation, developer portal, Salesforce integration | 4 new files + 3 existing updates |

---

## Part 5: Verification Checklist (Comprehensive)

| # | Concern | Covered By |
|---|---------|-----------|
| 1 | Can a new organization self‑register and onboard? | ONBOARDING.md |
| 2 | Can an enterprise customer configure SAML SSO + SCIM? | ENTERPRISE-SSO.md |
| 3 | Are all pages keyboard‑navigable and screen‑reader accessible (WCAG 2.1 AA)? | ACCESSIBILITY.md |
| 4 | Do transactional emails reach inboxes (not spam)? | EMAIL-DELIVERABILITY.md |
| 5 | Is there a tested backup and disaster recovery plan? | DISASTER-RECOVERY.md |
| 6 | Can premium features be gated behind paid plans? | FEATURE-FLAGS.md + SUBSCRIPTION-BILLING.md |
| 7 | Can EU contacts exercise GDPR rights? | GDPR-COMPLIANCE.md |
| 8 | Is distributed tracing available for production debugging? | OBSERVABILITY.md |
| 9 | Are all user‑facing strings translatable with RTL support? | I18N-L10N.md |
| 10 | Is there a penetration testing program with SAST in CI? | PENETRATION-TESTING.md |
| 11 | Do failed background jobs go to a dead letter queue? | DEVOPS.md (JOB-INFRA-001.6/7) |
| 12 | Do failed webhooks go to a DLQ with replay capability? | SECURITY.md (WS-DLQ-001) |
| 13 | Are there automated tenant isolation tests in CI? | SECURITY.md (SEC-007) |
| 14 | Can a won deal automatically create a project? | CRM-TO-PROJECTS-SYNC.md |
| 15 | Can emails be converted to CRM tasks (Karbon Triage)? | EMAIL-INGESTION.md |
| 16 | Do recurring appointments work with RRULE? | RECURRING-APPOINTMENTS.md |
| 17 | Are all 16 appointment API endpoints defined? | APPOINTMENTS-API.md |
| 18 | Do Analytics and Dashboard pages show real data? | ANALYTICS-CORE.md + DASHBOARD-WIDGETS.md |
| 19 | Can admins manage users, roles, and settings via UI? | SETTINGS-UI.md + ADMIN-INVITATIONS.md |
| 20 | Can CRM entities have custom fields? | CUSTOM-FIELDS.md |
| 21 | Does Asset Management include depreciation tracking? | DEPRECIATION.md |
| 22 | Can invoices be downloaded as PDF? | FINANCE-INVOICES-PAYMENTS.md (API-FIN-023) |
| 23 | Do tasks support dependencies and Gantt visualization? | PROJECTS-CORE.md + PROJECTS-BOARD-PLANNER.md |
| 24 | Can clients have tasks assigned through the portal? | PORTAL-ACCESS.md |
| 25 | Is there a notification bell with real‑time updates? | NOTIFICATIONS.md |
| 26 | Is there a user preferences panel? | SETTINGS-AUDIT.md |
| 27 | Is there an audit log viewer for admins? | SETTINGS-AUDIT.md |
| 28 | Can open/click tracking measure email engagement? | EMAIL-STORAGE.md |
| 29 | Can leads be scored automatically? | CRM-LEADS.md |
| 30 | Can deals be scored automatically? | CRM-DEALS.md (API-CRM-033) |
| 31 | Can customers be managed (CRUD) via API? | FINANCE-ADVANCED.md |
| 32 | Is DORA compliance addressed for EU financial customers? | DORA-COMPLIANCE.md |
| 33 | Is there a documented and tested incident response plan? | INCIDENT-RESPONSE.md |
| 34 | Is vendor risk managed per SOC 2 and DORA requirements? | VENDOR-RISK-MANAGEMENT.md |
| 35 | Can organizations perform a comprehensive EU Data Act export? | EU-DATA-ACT.md |
| 36 | Do external API calls use circuit breakers? | RESILIENCE.md |
| 37 | Is the app mobile‑responsive with PWA support? | MOBILE-PWA.md |
| 38 | Is there an engagement lifecycle managing proposal → project → billing? | ENGAGEMENT-LIFECYCLE.md |
| 39 | Are API deprecation and sunset policies defined? | API-SPEC-002 (expanded) |
| 40 | Is there a developer portal with interactive docs? | DEVELOPER-PORTAL.md |
| 41 | Is PostgreSQL RLS applied to all tenant‑scoped tables? | DATABASE.md (DB-RLS-FIN-001 expanded) |
| 42 | Are cyber insurance requirements met (MFA, patching, incident response)? | SECURITY.md (SEC-010) |
| 43 | Is eIDAS 2.0 QES/AES signature support planned? | DOCUMENTS-SHARING.md (API-ESIGN-005) |
| 44 | Does finance have three‑way matching for bill approvals? | FINANCE-BILLS-APPROVALS.md (API-AP-009) |
| 45 | Is metered billing implemented for usage‑based pricing? | SUBSCRIPTION-BILLING.md (API-SUB-004) |
| 46 | Are PCI DSS scope and evidence collection defined? | INTEGRATION-STRIPE.md (PCI‑DSS-001) |
| 47 | Are all necessary directories scaffolded? | TOOLING.md (TOOLING‑005) |

---