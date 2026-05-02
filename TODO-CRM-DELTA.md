# CRM Delta Backlog

Purpose: capture the CRM work required to deliver the intended CRM product that is not already represented in `TODO-P0.md` through `TODO-P10.md`.

Method used for de-duplication:

- Audited current CRM implementation in `artifacts/apex-os/src/pages/CRM.tsx` and `artifacts/apex-os/src/data/mockData.ts`.
- Audited CRM-related planning in `TODO-P0.md`, `TODO-P1.md`, `TODO-P2.md`, `TODO-P3.md`, `TODO-P4.md`, `TODO-P4b.md`, `TODO-P5.md`, `TODO-P7.md`, `TODO-P8.md`, `TODO-P9.md`, and `TODO-P10.md`.
- Audited architectural context in `AGENTS.md`, `ANALYSIS.md`, `FRAMEWORK.md`, and `docs/adr/005-api-versioning.md`.
- Audited hidden CRM rules in `.windsurf/rules/crm-unique-constraints.md` and `.windsurf/rules/crm-lead-conversion.md`.
- Cross-checked against the original CRM intent in `attached_assets/Pasted-Build-ApexOS-a-unified-business-management-SaaS-with-a-_1777660655466.txt` and 2026 ActiveCampaign product/help material.

Already planned elsewhere and intentionally excluded from this file:

- Domain glossary, bounded context mapping, CRM feature-file work, and CRM error taxonomy.
- CRM core schema for leads, contacts, companies, deals, and activities.
- CRM CRUD APIs and first-pass service/repository work for leads, contacts, companies, deals, and activities.
- RBAC foundation, dashboard CRM summary metrics, and basic CRM React Query data replacement.
- Generic email service infrastructure, generic email templating infrastructure, generic document workflow templates, and generic contract verification.
- Existing critical-path E2E coverage that already references lead creation and lead-to-deal flow.

Current confidence findings:

- The current CRM UI is still a mock shell. Only Leads and Contacts render; Deals, Email, and Engagements are placeholders.
- The existing TODO files cover CRM CRUD and first-pass frontend hookup, but they do not cover the feature depth required for a product-grade CRM modeled on the stated spec.
- The largest uncovered areas are: lead conversion, CRM follow-up tasks, 360 workspaces, inbox/email sync, engagement lifecycle, forms and visitor tracking, advanced analytics, and CRM-specific automation.

Planning rule for this delta file:

- Each task below is a missing feature-level task.
- Each task assumes the normal implementation stack for that feature: contract updates, schema/migration updates if needed, service/repository work, UI wiring, and tests.
- Phase names intentionally extend the existing roadmap without renumbering current files.

## Phase 3.6 - CRM Domain Completion

- [ ] CRM-DOM-001: Add a CRM follow-up task model for leads, contacts, and deals.
  Reason: the intended contact 360 workspace includes Tasks, ActiveCampaign-style pipelines rely on tasks, and no CRM task aggregate exists in the current TODO files.
  Outcome: tenant-scoped follow-up tasks with due dates, assignees, completion state, linked CRM entity references, task creation APIs, and task activity emission.

- [ ] CRM-DOM-002: Implement transactional lead conversion as a first-class CRM workflow.
  Reason: the UI already advertises "Convert to Contact," the hidden CRM rule requires conversion behavior, and no TODO file actually plans the end-to-end conversion workflow.
  Outcome: convert lead to contact/company/deal with duplicate checks, idempotency, linked activity creation, and domain events that downstream contexts can consume.

- [ ] CRM-DOM-003: Add CRM record ownership, assignment, and visibility policies.
  Reason: current TODOs define coarse RBAC only; they do not define assigned-owner/team/all visibility needed for My Leads, My Contacts, and queue-style CRM views.
  Outcome: owner and team assignment rules for leads, contacts, deals, and tasks; assigned-only query filters; policy checks enforced in services and queries.

- [ ] CRM-DOM-004: Implement duplicate review and merge workflows for leads, contacts, and companies.
  Reason: duplicate errors are planned, but there is no recovery path after duplicate detection.
  Outcome: duplicate candidate matching, review queue, merge API/service, field survivorship rules, and audit trail for merge operations.

- [ ] CRM-DOM-005: Add composite CRM detail endpoints for 360 workspaces.
  Reason: existing CRUD endpoints are not enough to power contact/company/deal drawers with related records in one request shape.
  Outcome: aggregate endpoints for contact 360, company 360, and deal workspace payloads containing related activities, deals, documents, engagements, tasks, and ownership metadata.

- [ ] CRM-DOM-006: Expand CRM activity ingestion beyond manual notes.
  Reason: current activity planning is append-only CRUD, but not the full event capture needed for a usable CRM timeline.
  Outcome: automatic activity entries for stage changes, assignment changes, conversions, document events, email events, visitor events, and renewals.

## Phase 4.6 - CRM Communications And Engagements

- [ ] CRM-COMM-001: Add mailbox connection and message storage for CRM email.
  Reason: current TODOs provide transactional email infrastructure only; they do not provide a CRM inbox or synced email thread model.
  Outcome: mailbox connection records, folders/labels, threads, messages, participants, sync cursors, and provider abstraction for CRM email data.

- [ ] CRM-COMM-002: Implement CRM email sync and send/reply workflows.
  Reason: the CRM spec calls for a unified inbox with compose and linked threads, and that is not planned anywhere today.
  Outcome: send, reply, thread association to contacts/deals, inbound sync, outbound sync, open/click tracking where available, and activity logging from mail events.

- [ ] CRM-COMM-003: Add a CRM content template library.
  Reason: generic email templates are planned for platform notifications, but the CRM still lacks intro/follow-up/proposal/contract content templates used by sales workflows.
  Outcome: editable CRM templates with variables, categories, permissions, preview, and usage analytics.

- [ ] CRM-ENG-001: Define an Engagement aggregate spanning proposals, contracts, and renewals.
  Reason: the CRM page includes an Engagements tab, but there is no unified domain model behind it.
  Outcome: engagement records linked to contacts, companies, deals, documents, and renewal dates with status transitions and lifecycle audit data.

- [ ] CRM-ENG-002: Implement proposal generation from deals into Documents and E-Sign.
  Reason: the product spec explicitly calls for a "Generate Proposal" path from deals, and no TODO currently plans that CRM-specific bridge.
  Outcome: proposal creation from a deal, document placeholder generation, send-for-signature initiation, and status sync back into CRM.

- [ ] CRM-ENG-003: Implement renewal lifecycle management.
  Reason: renewals are part of the intended CRM surface, but there is no planned schema, service, or UI for renewal tracking.
  Outcome: renewal records, reminder windows, renewal risk states, renewal-to-deal handoff, and renewal activities.

- [ ] CRM-ENG-004: Build the real CRM Email and Engagements tabs.
  Reason: current TODOs stop at replacing lead/contact/deal mock data and do not finish the missing tabs.
  Outcome: Email tab backed by message APIs and Engagements tab backed by proposal/contract/renewal APIs, including empty/loading/error states and actions.

## Phase 5.6 - CRM UX Completion

- [ ] CRM-UX-001: Replace the generic CRM slide-out with entity-specific drawers and forms.
  Reason: the current slide-out shows generic fields and fake activity regardless of entity type.
  Outcome: dedicated lead, contact, company, and deal drawers with the correct actions, fields, validation, and entity-aware content.

- [ ] CRM-UX-002: Build the full contact 360 workspace.
  Reason: the original spec calls for Overview, Activity Timeline, Deals, Documents, and Tasks, and no existing TODO fully closes that UX.
  Outcome: contact profile workspace with related entities, quick actions, ownership, recent activity, linked engagements, and follow-up tasks.

- [ ] CRM-UX-003: Build the company/account workspace.
  Reason: companies are planned in schema and API, but not as a real frontend account-management experience.
  Outcome: company view with linked contacts, open deals, engagement history, document summary, revenue summary, and ownership.

- [ ] CRM-UX-004: Build the deal workspace and pipeline management experience.
  Reason: existing TODOs only cover deal data hookup and stage mutation wiring, not the detail workspace needed to actually operate deals.
  Outcome: deal drawer/page with linked contacts, next steps, documents, engagements, forecast metadata, and proposal actions.

- [ ] CRM-UX-005: Add bulk operations plus CRM import/export.
  Reason: the intended Contacts experience includes bulk actions, and a real CRM requires onboarding/export capabilities; no TODO currently plans this.
  Outcome: bulk assign, bulk status change, bulk delete/archive, CSV import preview with validation, CSV export, and audit logging.

- [ ] CRM-UX-006: Add saved views, advanced filters, and queue-style CRM worklists.
  Reason: the current CRM only has static filter buttons and no persisted user views.
  Outcome: saved filters for My Records, Uncontacted, Hot Leads, Stale Deals, Renewals Due, and custom query presets.

## Phase 7.6 - CRM Capture And Attribution

- [ ] CRM-CAP-001: Implement public lead capture forms.
  Reason: forms are part of the intended CRM surface, but no TODO currently plans CRM lead forms specifically.
  Outcome: hosted and embeddable lead forms with field mapping, spam controls, hidden metadata fields, and submission-to-lead creation.

- [ ] CRM-CAP-002: Add attribution metadata propagation.
  Reason: source exists as a string today, but there is no end-to-end capture of UTM, campaign, referrer, or first-touch/last-touch values.
  Outcome: attribution fields captured from forms, email clicks, bookings, and manual imports, then exposed in CRM analytics and detail views.

- [ ] CRM-CAP-003: Implement visitor and site tracking.
  Reason: visitor tracking is explicitly called out in the CRM spec and is not covered by the current TODO files.
  Outcome: site tracking beacon, anonymous-to-known visitor stitching, page-visit timelines, visit-based lead filters, and dashboard widgets.

- [ ] CRM-CAP-004: Bridge appointment and booking events into CRM.
  Reason: scheduling is intentionally a separate context, but CRM still needs bookings to create/update contacts, deals, and activities.
  Outcome: mapping layer from appointment events into CRM records without making CRM own scheduling data.

- [ ] CRM-CAP-005: Add external lead-source intake adapters.
  Reason: the product inspiration is integration-heavy, and there is no planned intake path for external form or booking providers into CRM.
  Outcome: adapter layer and webhook ingestion for external lead sources with validation, dedupe, attribution, and activity creation.

## Phase 8.6 - CRM Administration And Intelligence

- [ ] CRM-ADMIN-001: Add CRM settings for pipelines, stage policies, lead sources, and assignment rules.
  Reason: the current plan assumes fixed enums and static views, which is not enough for a configurable CRM product.
  Outcome: admin-managed pipelines, stage order, required fields by stage, allowed transitions, and assignment defaults.

- [ ] CRM-ADMIN-002: Add CRM custom fields and layout metadata.
  Reason: the CRM will otherwise be locked to hardcoded lead/contact/company/deal fields.
  Outcome: custom field definitions, UI metadata, API validation, and rendering rules for list/detail/form surfaces.

- [ ] CRM-INTEL-001: Implement lead scoring and health scoring.
  Reason: current "Hot Leads" UI has no underlying model and the ActiveCampaign benchmark expects qualification intelligence.
  Outcome: configurable score rules, score breakdown display, hot/stale indicators, and score-driven filters.

- [ ] CRM-INTEL-002: Add advanced CRM analytics.
  Reason: the existing TODOs cover only basic lead funnel metrics.
  Outcome: weighted pipeline, source-to-close attribution, conversion cohorts, sales activity SLA metrics, and owner-level performance views for CRM only.

- [ ] CRM-INTEL-003: Add CRM data-quality monitoring.
  Reason: duplicate detection alone is not enough to keep CRM data usable over time.
  Outcome: stale-record alerts, overdue follow-up alerts, failed sync alerts, duplicate trend monitoring, and operational dashboards for CRM health.

## Phase 9.6 - CRM Automation

- [ ] CRM-AUTO-001: Implement stage-based follow-up automation.
  Reason: the general automation roadmap is appointment-centered and does not yet provide CRM-triggered follow-up behavior.
  Outcome: rules that create tasks, reminders, or notifications after lead/deal stage changes or inactivity thresholds.

- [ ] CRM-AUTO-002: Implement CRM nurture sequences.
  Reason: a CRM inspired by ActiveCampaign needs outbound follow-up flows beyond one-off email sending.
  Outcome: sequence enrollment, pauses/exits, email-step execution, linked activity logging, and template reuse.

- [ ] CRM-AUTO-003: Implement renewal and re-engagement automation.
  Reason: renewals are part of the intended CRM product and need proactive outreach, not just passive reporting.
  Outcome: reminder rules, renewal chase sequences, lapse detection, and re-engagement automation for dormant accounts.

- [ ] CRM-AUTO-004: Add prebuilt CRM automation recipes and simulation mode.
  Reason: the platform can have a generic workflow builder and still fail to ship usable CRM automation out of the box.
  Outcome: ready-made CRM recipes, dry-run/simulation support, and execution previews before publish.

## Exit Criteria For CRM Product Completion

The CRM product should not be considered delivered until all of the following are true:

- Leads, Contacts, Companies, Deals, Email, and Engagements are all backed by real APIs and usable from the UI.
- CRM follow-up tasks, lead conversion, and duplicate merge workflows exist end to end.
- Contacts, companies, and deals each have a usable 360 workspace.
- Proposal, contract, and renewal states are visible and actionable from CRM.
- CRM forms, visitor tracking, and attribution feed the CRM with real inbound data.
- Scoring, analytics, and automation are good enough to support the existing filters and the ActiveCampaign-inspired operating model.
- CRM-specific tests exist for the missing workflows above, not just CRUD.
