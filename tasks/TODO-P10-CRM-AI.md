# TODO-P10-CRM-AI.md – Phase 10: CRM Intelligence (from CRM Delta)

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

## Phase 10 CRM Intelligence Task Index

**CRM Intelligence (from CRM Delta)**
- [ ] AI‑CRM‑001 – Lead Scoring & Health Scoring
- [ ] AI‑CRM‑002 – Advanced CRM Analytics
- [ ] AI‑CRM‑003 – CRM Data Quality Monitoring

---

## CRM Intelligence (from CRM Delta)

### [ ] AI‑CRM‑001: Lead Scoring & Health Scoring
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005 (leads API), API‑CRM‑017 (deals API).  
**Definition of Done:** Configurable scoring models for leads and deals:
- Lead scoring: evaluate leads based on demographic data (company size, industry, job title), engagement signals (email opens, link clicks, form submissions, website visits), and behavioural data (activity recency, frequency of touchpoints, social media interactions).
- Deal health scoring: evaluate deals based on stage, age (days in current stage vs. average), activity recency (last contact date), contact engagement, and deal attributes (amount, product type, competitor involvement).
- Scores displayed as numeric values (0‑100) with visual indicators: hot (75‑100, red/orange), warm (40‑74, yellow), cold (0‑39, blue).
- Score breakdown: users can see which factors contributed to the score and how much weight each factor had.
- Configurable score rules: admin can adjust which factors are used, their weights, and thresholds for hot/warm/cold classification.
- Scores update automatically when relevant events occur (new email, stage change, activity logged).
- Re‑scoring history: track score changes over time for each record.

**DDD:** AI intelligence within the CRM bounded context; scoring models evaluate lead and deal health (ActiveCampaign lead scoring).  
**TDD:** Unit test with known lead data verifying that engaging leads score higher than inactive leads.  
**BDD:** "As a sales rep, I can see which leads are hot based on their engagement score and prioritise my outreach."

**Subtasks:**
- [ ] AI‑CRM‑001.1: Implement lead scoring engine with configurable factors and weights. (AGENT) – `services/crm/lead‑scoring‑service.ts`  
  **verification:** Engine produces scores that correlate with engagement; configurable factors work.
- [ ] AI‑CRM‑001.2: Implement deal health scoring engine. (AGENT) – `services/crm/deal‑health‑service.ts`  
  **verification:** Deals stuck in stage score lower; recently active deals score higher.
- [ ] AI‑CRM‑001.3: Build score configuration interface (admin panel for adjusting weights and thresholds). (AGENT) – `src/components/crm/ScoreConfig.tsx`  
  **verification:** Weights and thresholds configurable; changes reflected in new scores.
- [ ] AI‑CRM‑001.4: Add score visualisation on lead and deal cards (colour‑coded badges and breakdown tooltip). (AGENT)  
  **verification:** Scores displayed with colour indicators; breakdown visible on hover.
- [ ] AI‑CRM‑001.5: Implement re‑scoring on relevant events and scoring history tracking. (AGENT)  
  **verification:** Score updates when activity logged; history shows score changes over time.
- **Depends on:** API‑CRM‑005, API‑CRM‑017.

### [ ] AI‑CRM‑002: Advanced CRM Analytics
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005, API‑CRM‑017, API‑ANALYTICS‑004.  
**Definition of Done:** Advanced CRM‑specific analytics beyond basic funnel metrics:
- Weighted pipeline reporting: deal values multiplied by probability for each stage; total weighted pipeline value with stage breakdown.
- Source‑to‑close attribution modelling: track which lead sources (website, referral, event, cold outreach) produce the most won deals and highest revenue; multi‑touch attribution options (first‑touch, last‑touch, linear, time‑decay).
- Conversion cohort analysis: group leads by creation month and track conversion rate over time; identify which cohorts perform best.
- Sales activity SLA metrics: measure rep activity against targets (calls per day, emails sent, follow‑up task completion rate, average response time to new leads).
- Owner‑level performance views: compare reps on deals won, revenue generated, average deal size, win rate, and pipeline velocity (average days from lead to won).

**DDD:** CRM analytics within the CRM bounded context; extends the general analytics platform with CRM‑specific metrics.  
**TDD:** Unit test for attribution model verifying correct revenue allocation across sources.  
**BDD:** "As a sales manager, I can see which lead sources produce the highest revenue and which reps are performing best."

**Subtasks:**
- [ ] AI‑CRM‑002.1: Implement weighted pipeline calculation and visualisation. (AGENT) – `services/crm/pipeline‑analytics‑service.ts`  
  **verification:** Weighted values calculated correctly; pipeline chart renders.
- [ ] AI‑CRM‑002.2: Build source‑to‑close attribution model with configurable attribution method. (AGENT)  
  **verification:** Attribution correctly assigns revenue to sources based on selected model.
- [ ] AI‑CRM‑002.3: Implement conversion cohort analysis and visualisation. (AGENT)  
  **verification:** Cohort chart shows conversion rates by month; trends visible.
- [ ] AI‑CRM‑002.4: Build sales activity SLA tracking and rep performance dashboards. (AGENT) – `src/components/crm/SalesAnalytics.tsx`  
  **verification:** SLA metrics calculated; rep comparison view works.
- **Depends on:** API‑CRM‑005, API‑CRM‑017, API‑ANALYTICS‑004.

### [ ] AI‑CRM‑003: CRM Data Quality Monitoring
**Status:** ⏳ Not Started  
**Depends on:** API‑CRM‑005 (leads), API‑CRM‑009 (contacts), API‑CRM‑013 (companies).  
**Definition of Done:** Automated data quality monitoring for CRM records:
- Stale record detection: identify leads, contacts, or deals with no activity or updates for a configurable number of days; flag as "stale" and notify owner.
- Overdue follow‑up alerts: CRM follow‑up tasks past their due date trigger alerts to the assignee and their manager.
- Duplicate trends: monitor the rate of duplicate detection over time; if duplicates are increasing, flag a possible integration or data entry issue.
- Sync failure alerts: when email sync or calendar sync fails for a user, detect the failure and notify the user and admin.
- Data completeness scoring: score each record type on completeness of key fields (e.g., contact missing phone and email scores low); highlight incomplete records.
- Operational dashboard: single view showing data quality KPIs (stale records count, duplicate rate, average completeness score, sync health).

**DDD:** CRM data quality is a cross‑cutting concern within the CRM bounded context.  
**TDD:** Unit test verifying that a lead with no activity for 60 days triggers a stale record alert.  
**BDD:** "As a CRM administrator, I am alerted when data quality degrades so I can take corrective action."

**Subtasks:**
- [ ] AI‑CRM‑003.1: Implement stale record detection with configurable thresholds per record type. (AGENT) – `services/crm/data‑quality‑service.ts`  
  **verification:** Stale records detected and flagged; thresholds configurable.
- [ ] AI‑CRM‑003.2: Implement overdue follow‑up detection and sync failure monitoring. (AGENT)  
  **verification:** Overdue tasks trigger alerts; sync failures detected and notified.
- [ ] AI‑CRM‑003.3: Build data completeness scoring per record type. (AGENT)  
  **verification:** Records scored on field completeness; incomplete records highlighted.
- [ ] AI‑CRM‑003.4: Create operational data quality dashboard. (AGENT) – `src/components/crm/DataQualityDashboard.tsx`  
  **verification:** Dashboard displays all quality KPIs with trend lines and drill‑down to affected records.
- **Depends on:** API‑CRM‑005, API‑CRM‑009, API‑CRM‑013.

---
