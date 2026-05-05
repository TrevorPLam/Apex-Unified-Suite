# tasks/infrastructure/EMAIL‑DELIVERABILITY.md – Email Deliverability & DNS Authentication

Email deliverability infrastructure: SPF, DKIM, DMARC, BIMI, MTA‑STS, and TLS reporting. Without these, major mailbox providers (Gmail, Yahoo, Microsoft) will reject or spam‑folder transactional emails. This file also covers the deliverability monitoring dashboard and alerting on threshold breaches.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## DNS Configuration Tasks

### [ ] EMAIL‑DNS‑001: SPF Record Deployment
**Status:** ⏳ Not Started  
**Actor:** MIXED (requires domain DNS access)  
**Priority:** 🔴 Critical  
**Current State:** No SPF record exists. Gmail, Yahoo, and Microsoft now require SPF or DKIM to accept email.  
**Size:** Small  

**Description:**  
Publish an SPF TXT record on the sending domain that authorizes the configured SMTP provider (e.g., SendGrid, Postmark, or a custom server) to send email on behalf of the domain. All other sources are explicitly denied (`-all`).

**Depends on:** Domain access credentials, SMTP provider information  
**Blocks:** All transactional emails (welcome, password reset, notifications, portal magic links)

**Definition of Done**
- [ ] SMTP provider identified and its sending IP ranges or include mechanism documented.  
- [ ] `spf1` TXT record created: `v=spf1 include:<provider-spf> -all` (or the exact record provided by the SMTP service).  
- [ ] Record validated using `dig` or an online SPF checker; syntax error‑free.  
- [ ] SPF record documented in the production operations runbook.  
- [ ] `pnpm run typecheck` – N/A, infrastructure task.

**Rules to Follow**
- Only one SPF record per domain; multiple includes must be consolidated.  
- Use `-all` (hard fail), not `~all`, to prevent spoofing.  
- Record must be updated in DNS provider and verified externally before emails are sent.

**Verification**
```bash
dig TXT <sending-domain> | grep "v=spf1"
# Online tool: mx toolbox SPF check
```

---

### Subtasks
- [ ] EMAIL‑DNS‑001.1 (HUMAN): Provision SMTP account, obtain SPF include directive. **Verification:** SMTP credentials ready.
- [ ] EMAIL‑DNS‑001.2 (HUMAN): Create SPF TXT record in DNS provider. **Verification:** `dig` returns the correct record.
- [ ] EMAIL‑DNS‑001.3 (AGENT): Add SPF record documentation to operations runbook. **File:** `docs/operations/email‑deliverability.md` **Verification:** Documented.

---

### [ ] EMAIL‑DNS‑002: DKIM Key Generation & Deployment
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No DKIM signing key exists. Email authentication depends on DKIM for most providers.  
**Size:** Small  

**Description:**  
Generate a 2048‑bit RSA key pair for DKIM signing. Publish the public key as a CNAME or TXT record per the SMTP provider’s instructions. Configure the SMTP provider to sign all outbound email with the private key.

**Depends on:** `EMAIL‑DNS‑001` (SMTP provider selected)  
**Blocks:** All transactional emails

**Definition of Done**
- [ ] 2048‑bit RSA DKIM key pair generated (usually via the SMTP provider’s dashboard).  
- [ ] Public key published as a DNS record (typically `selector._domainkey.<domain>`).  
- [ ] SMTP provider configured to sign outbound mail with the private key.  
- [ ] DKIM record validated using `dig` or an online checker.  
- [ ] `pnpm run typecheck` – N/A.

**Rules to Follow**
- Use at least 2048‑bit keys; 1024‑bit is deprecated and rejected by many providers.  
- Rotate DKIM keys annually or per the provider’s recommendation.  
- Store the private key securely; it must never be committed to source control.

**Verification**
```bash
dig TXT <selector>._domainkey.<sending-domain>
# Online: dkimvalidator.com
```

---

### Subtasks
- [ ] EMAIL‑DNS‑002.1 (HUMAN): Generate DKIM key pair via SMTP provider. **Verification:** Keys available.
- [ ] EMAIL‑DNS‑002.2 (HUMAN): Create DKIM DNS record. **Verification:** `dig` returns correct public key.
- [ ] EMAIL‑DNS‑002.3 (AGENT): Document DKIM selector and rotation schedule. **File:** `docs/operations/email‑deliverability.md`

---

### [ ] EMAIL‑DNS‑003: DMARC Policy Deployment (Gradual Enforcement)
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🔴 Critical  
**Current State:** No DMARC record exists. DMARC is required by Google and Yahoo as of early 2024, and enforced with increasing strictness through 2026.  
**Size:** Small  

**Description:**  
Deploy a DMARC DNS record starting at `p=none` (monitoring only) with aggregate reporting via `rua`. Monitor reports for 2 weeks, then graduate to `p=quarantine`, and finally `p=reject` once SPF and DKIM are proven reliable.

**Depends on:** `EMAIL‑DNS‑001`, `EMAIL‑DNS‑002`  
**Blocks:** Full deliverability guarantee

**Definition of Done**
- [ ] DMARC TXT record at `_dmarc.<domain>` with policy `p=none` and `rua=mailto:<dmarc‑reports@domain>`.  
- [ ] DMARC aggregate reports parsed and reviewed for unauthorized senders.  
- [ ] After 2 weeks of clean reports, policy updated to `p=quarantine`.  
- [ ] After additional 2 weeks, policy updated to `p=reject`.  
- [ ] `pnpm run typecheck` – N/A.

**Rules to Follow**
- `rua` must point to an email address capable of receiving XML aggregate reports.  
- Use `pct=100` to apply policy to 100% of emails once enforcing.  
- Never jump directly to `p=reject` without a monitoring period.

**Verification**
```bash
dig TXT _dmarc.<sending-domain>
# process rua reports with a DMARC parsing tool (e.g., parsedmarc)
```

---

### Subtasks
- [ ] EMAIL‑DNS‑003.1 (HUMAN): Deploy DMARC record with policy `p=none`. **Verification:** Record visible via DNS.
- [ ] EMAIL‑DNS‑003.2 (AGENT): Set up DMARC report ingestion and parsing pipeline. **File:** `scripts/dmarc‑report‑parser.ts` **Verification:** Reports parsed and stored.
- [ ] EMAIL‑DNS‑003.3 (HUMAN): After monitoring period, approve policy advance to `quarantine` then `reject`. **Verification:** Manual.

---

### [ ] EMAIL‑DNS‑004: BIMI Record Deployment (Optional, Enhanced Trust)
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟢 Low  
**Current State:** No BIMI record. BIMI displays the brand logo in supported inbox clients, increasing trust.  
**Size:** Small  

**Description:**  
Publish a BIMI TXT record at `default._bimi.<domain>` pointing to an SVG logo and a VMC certificate (Verified Mark Certificate). This is optional but enhances trust for financial/professional services SaaS.

**Depends on:** `EMAIL‑DNS‑003` (DMARC `p=reject` is a BIMI prerequisite)  
**Blocks:** None

**Definition of Done**
- [ ] SVG logo created per BIMI specifications (square, exact size, no external references).  
- [ ] VMC certificate obtained from a certified authority (e.g., DigiCert).  
- [ ] BIMI record published: `v=BIMI1; l=<logo-url>; a=<vmc-url>`.  
- [ ] `pnpm run typecheck` – N/A.

**Rules to Follow**
- SVG must be published at a publicly accessible HTTPS URL.  
- BIMI only works with DMARC `p=reject`.

**Verification**
```bash
dig TXT default._bimi.<sending-domain>
```

---

### Subtasks
- [ ] EMAIL‑DNS‑004.1 (HUMAN): Procure VMC certificate and host SVG logo. **Verification:** Assets ready.
- [ ] EMAIL‑DNS‑004.2 (AGENT): Publish BIMI DNS record. **Verification:** `dig` confirms.

---

### [ ] EMAIL‑DNS‑005: MTA‑STS and TLS‑RPT Deployment
**Status:** ⏳ Not Started  
**Actor:** MIXED  
**Priority:** 🟡 Medium  
**Current State:** No MTA‑STS policy exists. TLS for SMTP is not enforced. Gmail has made user‑facing warnings for unencrypted email more prominent. Google ended its "security exception" for unencrypted email in January 2025.  
**Size:** Small  

**Description:**  
Deploy MTA‑STS (`_mta‑sts.<domain>` TXT record and `https://mta‑sts.<domain>/.well‑known/mta‑sts.txt` policy file) to enforce TLS for SMTP connections. Also deploy TLS‑RPT (`_smtp._tls.<domain>` TXT record) to receive TLS failure reports for troubleshooting.

**Depends on:** `EMAIL‑DNS‑001` (SPF)  
**Blocks:** None

**Definition of Done**
- [ ] MTA‑STS policy file published at the required HTTPS URL with `mode: enforce`, `max_age`, and required MX hosts.  
- [ ] `_mta‑sts` TXT record deployed.  
- [ ] `_smtp._tls` TXT record deployed pointing to a report receiving email address.  
- [ ] TLS‑RPT reports monitored for failures.  
- [ ] `pnpm run typecheck` – N/A.

**Verification**
```bash
curl https://mta‑sts.<domain>/.well‑known/mta‑sts.txt
dig TXT _mta‑sts.<domain>
dig TXT _smtp._tls.<domain>
```

---

### Subtasks
- [ ] EMAIL‑DNS‑005.1 (AGENT): Create MTA‑STS policy file and deploy to web server. **File:** `infra/web/mta‑sts.txt` **Verification:** `curl` returns correct content.
- [ ] EMAIL‑DNS‑005.2 (HUMAN): Deploy DNS TXT records for MTA‑STS and TLS‑RPT. **Verification:** `dig` confirms.
- [ ] EMAIL‑DNS‑005.3 (AGENT): Set up TLS‑RPT report collection and alerting. **Verification:** Reports received and alerts configured.

---

## Monitoring & Alerting

### [ ] EMAIL‑MON‑001: Deliverability Dashboard & Alerting
**Status:** ⏳ Not Started  
**Actor:** AGENT  
**Priority:** 🟡 Medium  
**Current State:** No monitoring exists for email delivery metrics. Bounce rates, spam complaint rates, and DMARC aggregates are not tracked.  
**Size:** Medium  

**Description:**  
Build a deliverability dashboard that ingests SMTP provider webhooks (delivered, bounced, complained, opened, clicked) and displays key metrics: bounce rate (target <2%), spam complaint rate (target <0.10%, per Google/Yahoo requirements), delivery rate, and DMARC aggregate report summaries. Set up alert thresholds that notify the operations team when metrics breach acceptable limits.

**Depends on:** `EMAIL‑DNS‑003` (DMARC reports), `infrastructure/EMAIL‑STORAGE.md → EMAIL‑SERVICE‑001` (SMTP provider webhooks), `infrastructure/NOTIFICATIONS.md → API‑NOTIF‑001` (alert notifications), `infrastructure/DEVOPS.md → JOB‑INFRA‑001` (background processing)  
**Blocks:** None

**Related Files:** `artifacts/api‑server/src/routes/webhooks/email‑events.ts`, `artifacts/api‑server/src/services/email‑deliverability/deliverability‑service.ts`, `artifacts/apex‑os/src/components/settings/EmailDeliverabilityDashboard.tsx`

**Definition of Done**
- [ ] Webhook endpoints for SMTP provider (SendGrid, Postmark, or Nodemailer with custom transport hooks) to receive delivery events.  
- [ ] `email_delivery_events` table: `id`, `organization_id`, `message_id`, `event_type` (sent/delivered/bounced/opened/clicked/complaint), `recipient`, `timestamp`, `metadata`.  
- [ ] `DeliverabilityService` calculates: daily bounce rate, daily complaint rate, 7‑day delivery rate.  
- [ ] Background job processes DMARC aggregate XML reports and stores summarized data.  
- [ ] Alert rules: bounce rate > 2% for 2 consecutive days → trigger alert; complaint rate > 0.10% → immediate alert.  
- [ ] Daily summary email to ops team with key metrics.  
- [ ] Admin dashboard at `/settings/email‑deliverability` with time‑series charts (bounce rate, complaint rate, delivery volume).  
- [ ] Integration tests: webhook event ingestion, metric calculation, alert generation.  
- [ ] `pnpm run typecheck` passes.

**Verification**
```bash
pnpm --filter @workspace/api‑spec run codegen
pnpm --filter @workspace/api‑server test -- deliverability.test.ts
pnpm --filter @workspace/apex‑os test -- EmailDeliverabilityDashboard.test.tsx
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Deliverability monitoring is an infrastructure cross‑cutting concern; it reads from webhook events and does not own domain entities.  
- TDD: Write integration test that ingests a webhook payload and verifies aggregate metrics are updated.  
- BDD: “As an operations engineer, I am alerted when the spam complaint rate exceeds 0.10% and can see the trend on a dashboard.”  
- Deep Module: `DeliverabilityService.getCurrentMetrics(orgId)` hides event aggregation, time‑window calculations, and alert rule evaluation.

---

### Subtasks
- [ ] EMAIL‑MON‑001.0.25 (AGENT): Read EMAIL‑SERVICE‑001, API‑NOTIF‑001, JOB‑INFRA‑001. No action — pause.  
- [ ] EMAIL‑MON‑001.0.5 (AGENT): Research SMTP provider webhook payloads (SendGrid Event Webhook, Postmark Webhooks) and DMARC XML report format.  
- [ ] EMAIL‑MON‑001.1 (AGENT): Define `email_delivery_events` schema. **File:** `lib/db/src/schema/email/email‑delivery‑events.ts` **Verification:** Migration generated (human approval for push); `pnpm typecheck`.  
- [ ] EMAIL‑MON‑001.2 (AGENT): Implement SMTP webhook receiver route with payload verification. **File:** `artifacts/api‑server/src/routes/webhooks/email‑events.ts` **Verification:** Unit tests.  
- [ ] EMAIL‑MON‑001.3 (AGENT): Implement `DeliverabilityService` with metric calculations and alert rule evaluation. **File:** `artifacts/api‑server/src/services/email‑deliverability/deliverability‑service.ts` **Verification:** Unit tests.  
- [ ] EMAIL‑MON‑001.4 (AGENT): Implement DMARC report parser and scheduled job. **File:** `artifacts/api‑server/src/services/email‑deliverability/dmarc‑parser.ts` **Verification:** Integration test with sample XML report.  
- [ ] EMAIL‑MON‑001.5 (AGENT): Add alert generation via `NotificationService` and daily summary email job. **Verification:** Unit tests.  
- [ ] EMAIL‑MON‑001.6 (AGENT): Build deliverability dashboard page. **File:** `artifacts/apex‑os/src/components/settings/EmailDeliverabilityDashboard.tsx` **Verification:** Component tests.  
- [ ] EMAIL‑MON‑001.7 (HUMAN): Final review and sign‑off. **Verification:** Approved.

---

## Manual Verification Checklist

Before any transactional email is sent to a real user, the following must pass:

- [ ] Send test email to [mail‑tester.com](https://www.mail‑tester.com) → score ≥ 9/10.  
- [ ] Send test email to a Gmail address → email lands in primary inbox, not spam.  
- [ ] Send test email to a Yahoo address → same.  
- [ ] Send test email to a Microsoft (Outlook.com) address → same.  
- [ ] DMARC aggregate reports are arriving and show no unauthorized senders.  
- [ ] MTA‑STS policy file is accessible at the expected URL.  
- [ ] TLS‑RPT reports are being received.

---