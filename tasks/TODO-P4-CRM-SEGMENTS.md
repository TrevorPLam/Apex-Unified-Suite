# TODO-P4-CRM-SEGMENTS.md - CRM Segmentation Engine

This file contains tasks for implementing a dynamic segmentation engine similar to ActiveCampaign's segment builder, allowing users to create dynamic lists from any combination of fields, tags, and behaviors.

---

## CRM Segmentation Tasks

- [ ] **CRM‑SEG‑001: Dynamic Segment Builder – API & UI**
  - **Status:** ⏳ Not Started  
  - **Depends on:** API‑CRM‑005 (leads API), API‑CRM‑009 (contacts API), API‑CRM‑013 (companies API)  
  - **Why added:** ActiveCampaign's segment builder is a core feature – it lets users create dynamic lists from any combination of fields, tags, and behaviours. The current task list has only basic filtering.  
  - **Definition of Done:**
    - API endpoints: `POST /api/v1/crm/segments` (create segment), `GET /api/v1/crm/segments` (list), `GET /api/v1/crm/segments/{id}` (detail), `GET /api/v1/crm/segments/{id}/members` (paginated member list), `DELETE /api/v1/crm/segments/{id}` (soft delete).  
    - Segment definition JSON: supports AND/OR/NOT logic with conditions on any standard or custom field (string, number, date, boolean), tags, scores, pipeline stage, activity recency, etc.  
    - Segments are evaluated on‑the‑fly (or pre‑cached nightly).  
    - UI: a visual rule builder (drag‑and‑drop) that allows building complex segment definitions without coding.  
    - Integration: segments can be used as filters in list views, report data sources, and automation enrolment.  
  - **DDD:** Segment is an aggregate within the CRM bounded context. Segment evaluation is a domain service.  
  - **TDD:** Integration test verifying that a segment returns the correct contacts based on a multi‑condition definition.  
  - **BDD:** "As a marketer, I can create a segment of contacts who opened an email in the last 30 days and have a lead score >70."

- [ ] **CRM‑SEG‑002: Segment‑based Automation Triggers**
  - **Status:** ⏳ Not Started  
  - **Depends on:** CRM‑SEG‑001, AUTO‑CRM‑001  
  - **Why added:** Segments are only useful if they can drive actions (ActiveCampaign's core automation).  
  - **Definition of Done:**
    - Automation recipes can use "Contact enters/exits segment" as a trigger.  
    - When a segment is evaluated (real‑time or batch), domain events `ContactEnteredSegment` and `ContactExitedSegment` are emitted.  
    - Existing automation rules engine (AUTO‑CRM‑001) consumes these events to start workflows.  
  - **BDD:** "When a contact's score exceeds 80 and they are added to the 'Hot Leads' segment, automatically assign a sales rep and create a follow‑up task."

---

## Implementation Notes

### Segment Definition Schema
```json
{
  "name": "Hot Leads",
  "description": "Leads with high engagement",
  "rules": {
    "operator": "AND",
    "conditions": [
      {
        "field": "lead_score",
        "operator": ">",
        "value": 70,
        "type": "number"
      },
      {
        "field": "last_email_opened",
        "operator": ">=",
        "value": "30_days_ago",
        "type": "date"
      },
      {
        "field": "tags",
        "operator": "contains",
        "value": "interested",
        "type": "array"
      }
    ]
  }
}
```

### API Endpoints Design
- `POST /api/v1/crm/segments` - Create new segment
- `GET /api/v1/crm/segments` - List all segments (paginated)
- `GET /api/v1/crm/segments/{id}` - Get segment details
- `GET /api/v1/crm/segments/{id}/members` - Get segment members (paginated)
- `PATCH /api/v1/crm/segments/{id}` - Update segment
- `DELETE /api/v1/crm/segments/{id}` - Soft delete segment

### Database Schema Considerations
- `segments` table: id, name, description, rules (JSONB), organization_id, created_at, updated_at, deleted_at
- `segment_evaluations` table: id, segment_id, evaluated_at, member_count (for caching)
- Index on organization_id and deleted_at for performance
- Consider materialized views for frequently accessed segments

### Performance Optimization
- Cache segment evaluations for high-traffic segments
- Background job for nightly segment recalculation
- Lazy evaluation for real-time segment membership checks
- Consider using PostgreSQL's JSONB operators for efficient rule evaluation
