---
trigger: model_decision
description: Enforce that closed_won leads automatically create a Deal and transition CRM stage according to the business lifecycle rules.
---

# CRM Lead Conversion Rule

## Purpose

Enforce the business rule that when a lead reaches `closed_won` status, a Deal must be automatically created and the CRM stage must be transitioned appropriately. This prevents data inconsistency and ensures proper sales pipeline tracking.

## Implementation Requirements

### Lead Status Transition Validation

**When a lead is updated to `closed_won`:**

1. **Verify Lead Existence**: Confirm the lead exists and belongs to the tenant
2. **Check Current Status**: Ensure the lead is transitioning from a valid status (not already `closed_won`)
3. **Validate Required Fields**: Ensure lead has all required fields for deal creation:
   - `client_id` or contact information
   - `deal_value` or `estimated_value`
   - `sales_rep_id`
   - `conversion_date`

### Automatic Deal Creation

**Create a new Deal with:**

```typescript
// Required deal fields from lead
const dealData = {
  tenantId: lead.tenant_id,
  clientId: lead.client_id,
  leadId: lead.id,
  title: `${lead.company_name} - ${lead.lead_source}`,
  description: `Converted from lead: ${lead.title}`,
  value: lead.deal_value || lead.estimated_value,
  currency: lead.currency || 'USD',
  stage: 'qualification', // Initial deal stage
  probability: 25, // Starting probability for converted leads
  expectedCloseDate: calculateExpectedCloseDate(lead.created_at),
  salesRepId: lead.sales_rep_id,
  sourceCampaign: lead.source_campaign,
  convertedFromLead: true,
  conversionDate: new Date(),
  createdBy: context.userId
};
```

### CRM Stage Transition

**Update client CRM stage based on deal value:**

```typescript
// Stage determination logic
function determineClientStage(dealValue: number): string {
  if (dealValue >= 100000) return 'enterprise';
  if (dealValue >= 25000) return 'commercial';
  if (dealValue >= 5000) return 'small_business';
  return 'prospect';
}
```

### Service Implementation Pattern

```typescript
// In LeadService.updateLeadStatus()
async updateLeadStatus(
  leadId: string, 
  newStatus: string, 
  tenantId: string, 
  updatedBy: string
): Promise<Lead> {
  return await this.db.transaction(async (tx) => {
    // 1. Update lead status
    const updatedLead = await this.updateLeadStatusOnly(tx, leadId, newStatus, tenantId, updatedBy);
    
    // 2. Handle closed_won conversion
    if (newStatus === 'closed_won') {
      await this.handleLeadConversion(tx, updatedLead, updatedBy);
    }
    
    return updatedLead;
  });
}

private async handleLeadConversion(tx: Database, lead: Lead, updatedBy: string): Promise<void> {
  // Check if deal already exists for this lead
  const existingDeal = await tx
    .select()
    .from(deals)
    .where(and(
      eq(deals.lead_id, lead.id),
      eq(deals.tenant_id, lead.tenant_id)
    ))
    .limit(1);

  if (existingDeal.length > 0) {
    throw new BusinessRuleError('Deal already exists for this lead');
  }

  // Create deal
  const deal = await this.createDealFromLead(tx, lead, updatedBy);
  
  // Update client CRM stage
  await this.updateClientCRMStage(tx, lead.client_id, deal.value);
  
  // Emit domain events
  await this.emitEvent('LeadConverted', {
    leadId: lead.id,
    dealId: deal.id,
    clientId: lead.client_id,
    convertedBy: updatedBy
  });
}
```

### Error Handling

**Required domain errors:**

- `LeadAlreadyConvertedError` - When trying to convert an already converted lead
- `DealAlreadyExistsError` - When a deal already exists for the lead
- `InsufficientLeadDataError` - When lead lacks required fields for conversion
- `InvalidLeadStatusTransitionError` - When status transition is not allowed

### Validation Rules

**Lead must have these fields before conversion to `closed_won`:**

- `client_id` must be populated (not null)
- `deal_value` must be > 0 or `estimated_value` must be > 0
- `sales_rep_id` must be assigned
- Lead must not already have an associated deal
- Lead status must be transitioning from `qualified`, `proposal_sent`, or `negotiation`

### Database Constraints

**Add constraints to enforce the rule:**

```sql
-- Check constraint to prevent duplicate deals from same lead
ALTER TABLE deals ADD CONSTRAINT unique_deal_per_lead 
  UNIQUE (tenant_id, lead_id) 
  WHERE lead_id IS NOT NULL;

-- Trigger to automatically create deal on lead conversion
CREATE OR REPLACE FUNCTION create_deal_on_lead_conversion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed_won' AND OLD.status != 'closed_won' THEN
    -- Insert deal logic here
    INSERT INTO deals (tenant_id, client_id, lead_id, title, value, stage, ...)
    VALUES (NEW.tenant_id, NEW.client_id, NEW.id, ...);
    
    -- Update client CRM stage
    UPDATE clients SET crm_stage = determine_stage_from_value(NEW.deal_value)
    WHERE id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lead_conversion
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_deal_on_lead_conversion();
```

### API Endpoint Enforcement

**Lead update endpoint must enforce conversion:**

```typescript
// PUT /api/crm/leads/:id/status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Validate status transition
    const validTransitions = {
      'new': ['contacted', 'qualified', 'closed_lost'],
      'contacted': ['qualified', 'closed_lost'],
      'qualified': ['proposal_sent', 'closed_won', 'closed_lost'],
      'proposal_sent': ['negotiation', 'closed_won', 'closed_lost'],
      'negotiation': ['closed_won', 'closed_lost'],
      'closed_won': [], // Terminal state
      'closed_lost': []  // Terminal state
    };

    const lead = await leadService.findById(req.params.id, req.tenant.id);
    
    if (!validTransitions[lead.status].includes(status)) {
      throw new InvalidLeadStatusTransitionError(
        `Cannot transition from ${lead.status} to ${status}`
      );
    }

    const updatedLead = await leadService.updateLeadStatus(
      req.params.id,
      status,
      req.tenant.id,
      req.user.id
    );

    res.json({ lead: updatedLead });
  } catch (error) {
    next(error);
  }
});
```

### Testing Requirements

**Unit tests must cover:**

1. **Conversion Logic**: Test that `closed_won` status creates deal and updates stage
2. **Duplicate Prevention**: Test that already converted leads throw errors
3. **Validation**: Test that insufficient lead data prevents conversion
4. **Status Transitions**: Test that only valid status transitions are allowed
5. **Transaction Rollback**: Test that failures roll back all changes

**Integration tests must verify:**

1. **End-to-end Conversion**: Lead → Deal → Client Stage Update
2. **Concurrent Conversions**: Multiple users can't convert same lead simultaneously
3. **Domain Events**: Proper events are emitted on conversion
4. **Data Consistency**: All related data stays consistent after conversion

### Monitoring

**Track these metrics:**

- Lead conversion rate (leads converted to deals)
- Conversion failure rate and reasons
- Time from lead creation to conversion
- Deal value distribution by conversion source
- Client stage progression accuracy

### Audit Trail

**Log all conversion events:**

```typescript
interface LeadConversionLog {
  leadId: string;
  dealId: string;
  clientId: string;
  previousStatus: string;
  newStatus: string;
  dealValue: number;
  previousClientStage: string;
  newClientStage: string;
  convertedBy: string;
  conversionDate: Date;
}
```

## Enforcement Checklist

- [ ] Lead status update validates transition rules
- [ ] `closed_won` status automatically creates deal in same transaction
- [ ] Client CRM stage is updated based on deal value
- [ ] Duplicate deal creation is prevented
- [ ] Required lead fields are validated before conversion
- [ ] Domain events are emitted for conversion
- [ ] Comprehensive error handling for edge cases
- [ ] Audit trail tracks all conversions
- [ ] Database constraints prevent data inconsistency
- [ ] API endpoints enforce business rules
- [ ] Tests cover all conversion scenarios
- [ ] Monitoring tracks conversion metrics
