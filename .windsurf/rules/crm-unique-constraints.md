---
trigger: model_decision
description: Define mandatory unique fields per CRM entity and the expected DuplicateX domain error for consistent duplicate detection across all CRM entities.
---

# CRM Unique Constraints Rule

## Purpose

Standardize duplicate detection across all CRM entities by defining mandatory unique fields per entity type and ensuring consistent `DuplicateX` domain error responses. This prevents data inconsistency and provides predictable duplicate handling behavior.

## Entity-Specific Unique Constraints

### Contacts

**Required unique fields:**
- `email` must be unique per organization (tenant)
- `phone` must be unique per organization (tenant) if provided

**Duplicate error:** `DuplicateContact`

```typescript
// Contact creation validation
async createContact(contactData: CreateContactRequest, tenantId: string): Promise<Contact> {
  // Check email uniqueness
  if (contactData.email) {
    const existingEmail = await this.db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.tenant_id, tenantId),
        eq(contacts.email, contactData.email.toLowerCase())
      ))
      .limit(1);

    if (existingEmail[0]) {
      throw new DuplicateContactError('Email already exists', {
        field: 'email',
        value: contactData.email,
        existingContactId: existingEmail[0].id
      });
    }
  }

  // Check phone uniqueness
  if (contactData.phone) {
    const normalizedPhone = this.normalizePhoneNumber(contactData.phone);
    const existingPhone = await this.db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.tenant_id, tenantId),
        eq(contacts.phone, normalizedPhone)
      ))
      .limit(1);

    if (existingPhone[0]) {
      throw new DuplicateContactError('Phone number already exists', {
        field: 'phone',
        value: contactData.phone,
        existingContactId: existingPhone[0].id
      });
    }
  }

  // Create contact...
}
```

### Companies

**Required unique fields:**
- `name` must be unique per organization (tenant)
- `domain` must be unique per organization (tenant) if provided
- `tax_id` must be unique per organization (tenant) if provided

**Duplicate error:** `DuplicateCompany`

```typescript
// Company creation validation
async createCompany(companyData: CreateCompanyRequest, tenantId: string): Promise<Company> {
  // Check name uniqueness (case-insensitive)
  const existingName = await this.db
    .select()
    .from(companies)
    .where(and(
      eq(companies.tenant_id, tenantId),
      sql`LOWER(${companies.name}) = LOWER(${companyData.name})`
    ))
    .limit(1);

  if (existingName[0]) {
    throw new DuplicateCompanyError('Company name already exists', {
      field: 'name',
      value: companyData.name,
      existingCompanyId: existingName[0].id
    });
  }

  // Check domain uniqueness
  if (companyData.domain) {
    const normalizedDomain = this.normalizeDomain(companyData.domain);
    const existingDomain = await this.db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenant_id, tenantId),
        eq(companies.domain, normalizedDomain)
      ))
      .limit(1);

    if (existingDomain[0]) {
      throw new DuplicateCompanyError('Domain already exists', {
        field: 'domain',
        value: companyData.domain,
        existingCompanyId: existingDomain[0].id
      });
    }
  }

  // Check tax ID uniqueness
  if (companyData.taxId) {
    const normalizedTaxId = this.normalizeTaxId(companyData.taxId);
    const existingTaxId = await this.db
      .select()
      .from(companies)
      .where(and(
        eq(companies.tenant_id, tenantId),
        eq(companies.tax_id, normalizedTaxId)
      ))
      .limit(1);

    if (existingTaxId[0]) {
      throw new DuplicateCompanyError('Tax ID already exists', {
        field: 'tax_id',
        value: companyData.taxId,
        existingCompanyId: existingTaxId[0].id
      });
    }
  }

  // Create company...
}
```

### Leads

**Required unique fields:**
- `email` must be unique per organization (tenant) if provided
- `phone` must be unique per organization (tenant) if provided
- Combination of `company_name` + `contact_name` must be unique per organization

**Duplicate error:** `DuplicateLead`

```typescript
// Lead creation validation
async createLead(leadData: CreateLeadRequest, tenantId: string): Promise<Lead> {
  // Check email uniqueness
  if (leadData.email) {
    const existingEmail = await this.db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenant_id, tenantId),
        eq(leads.email, leadData.email.toLowerCase())
      ))
      .limit(1);

    if (existingEmail[0]) {
      throw new DuplicateLeadError('Email already exists in leads', {
        field: 'email',
        value: leadData.email,
        existingLeadId: existingEmail[0].id
      });
    }
  }

  // Check phone uniqueness
  if (leadData.phone) {
    const normalizedPhone = this.normalizePhoneNumber(leadData.phone);
    const existingPhone = await this.db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenant_id, tenantId),
        eq(leads.phone, normalizedPhone)
      ))
      .limit(1);

    if (existingPhone[0]) {
      throw new DuplicateLeadError('Phone number already exists in leads', {
        field: 'phone',
        value: leadData.phone,
        existingLeadId: existingPhone[0].id
      });
    }
  }

  // Check company + contact name uniqueness
  if (leadData.companyName && leadData.contactName) {
    const existingCombo = await this.db
      .select()
      .from(leads)
      .where(and(
        eq(leads.tenant_id, tenantId),
        sql`LOWER(${leads.company_name}) = LOWER(${leadData.companyName})`,
        sql`LOWER(${leads.contact_name}) = LOWER(${leadData.contactName})`
      ))
      .limit(1);

    if (existingCombo[0]) {
      throw new DuplicateLeadError('Company and contact name combination already exists', {
        field: 'company_contact_combo',
        value: `${leadData.companyName} + ${leadData.contactName}`,
        existingLeadId: existingCombo[0].id
      });
    }
  }

  // Create lead...
}
```

### Deals

**Required unique fields:**
- No unique constraints required (deals can have multiple per company)
- However, `deal_number` must be unique per organization (tenant) if used

**Duplicate error:** `DuplicateDeal` (only for deal_number conflicts)

```typescript
// Deal creation validation
async createDeal(dealData: CreateDealRequest, tenantId: string): Promise<Deal> {
  // Check deal number uniqueness if provided
  if (dealData.dealNumber) {
    const existingDealNumber = await this.db
      .select()
      .from(deals)
      .where(and(
        eq(deals.tenant_id, tenantId),
        eq(deals.deal_number, dealData.dealNumber)
      ))
      .limit(1);

    if (existingDealNumber[0]) {
      throw new DuplicateDealError('Deal number already exists', {
        field: 'deal_number',
        value: dealData.dealNumber,
        existingDealId: existingDealNumber[0].id
      });
    }
  }

  // Create deal...
}
```

## Standardized Duplicate Error Format

### Base Duplicate Error Class

```typescript
export class DuplicateEntityError extends DomainError {
  constructor(
    entityType: string,
    message: string,
    public readonly details: {
      field: string;
      value: string;
      existingEntityId: string;
      additionalInfo?: Record<string, any>;
    }
  ) {
    super(`DUPLICATE_${entityType.toUpperCase()}`, message, details);
  }
}

export class DuplicateContactError extends DuplicateEntityError {
  constructor(message: string, details: any) {
    super('Contact', message, details);
  }
}

export class DuplicateCompanyError extends DuplicateEntityError {
  constructor(message: string, details: any) {
    super('Company', message, details);
  }
}

export class DuplicateLeadError extends DuplicateEntityError {
  constructor(message: string, details: any) {
    super('Lead', message, details);
  }
}

export class DuplicateDealError extends DuplicateEntityError {
  constructor(message: string, details: any) {
    super('Deal', message, details);
  }
}
```

### API Response Format

**Standardized duplicate error response:**

```typescript
// In error handler middleware
if (error instanceof DuplicateEntityError) {
  return res.status(409).json({
    error: error.message,
    code: error.code,
    details: {
      field: error.details.field,
      value: error.details.value,
      existingEntityId: error.details.existingEntityId,
      entityType: error.constructor.name.replace('Error', '').toLowerCase()
    },
    suggestions: [
      'Check if you meant to update the existing record instead',
      'Verify the duplicate data is not a data entry error',
      'Contact support if you believe this is an error'
    ],
    timestamp: new Date().toISOString()
  });
}
```

## Database Constraints

### Unique Indexes

```sql
-- Contacts unique constraints
CREATE UNIQUE INDEX idx_contacts_tenant_email 
  ON contacts(tenant_id, email) 
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX idx_contacts_tenant_phone 
  ON contacts(tenant_id, phone) 
  WHERE phone IS NOT NULL;

-- Companies unique constraints
CREATE UNIQUE INDEX idx_companies_tenant_name 
  ON companies(tenant_id, LOWER(name));

CREATE UNIQUE INDEX idx_companies_tenant_domain 
  ON companies(tenant_id, domain) 
  WHERE domain IS NOT NULL;

CREATE UNIQUE INDEX idx_companies_tenant_tax_id 
  ON companies(tenant_id, tax_id) 
  WHERE tax_id IS NOT NULL;

-- Leads unique constraints
CREATE UNIQUE INDEX idx_leads_tenant_email 
  ON leads(tenant_id, email) 
  WHERE email IS NOT NULL;

CREATE UNIQUE INDEX idx_leads_tenant_phone 
  ON leads(tenant_id, phone) 
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX idx_leads_tenant_company_contact 
  ON leads(tenant_id, LOWER(company_name), LOWER(contact_name)) 
  WHERE company_name IS NOT NULL AND contact_name IS NOT NULL;

-- Deals unique constraint for deal numbers
CREATE UNIQUE INDEX idx_deals_tenant_deal_number 
  ON deals(tenant_id, deal_number) 
  WHERE deal_number IS NOT NULL;
```

## Data Normalization Utilities

### Phone Number Normalization

```typescript
normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle country codes (assuming US format for now)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return cleaned; // Return as-is if format is unexpected
}
```

### Domain Normalization

```typescript
normalizeDomain(domain: string): string {
  // Remove protocol and www, convert to lowercase
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .toLowerCase();
}
```

### Tax ID Normalization

```typescript
normalizeTaxId(taxId: string): string {
  // Remove all non-alphanumeric characters and convert to uppercase
  return taxId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}
```

## Duplicate Detection API Endpoint

### Check for Duplicates Before Creation

```typescript
// POST /api/crm/check-duplicates
router.post('/check-duplicates', async (req, res, next) => {
  try {
    const { entityType, data } = req.body;
    
    const duplicates = await crmService.checkForDuplicates(
      entityType,
      data,
      req.tenant.id
    );

    res.json({
      hasDuplicates: duplicates.length > 0,
      duplicates: duplicates.map(dup => ({
        field: dup.field,
        value: dup.value,
        existingEntity: dup.existingEntity,
        confidence: dup.confidence // How likely this is a true duplicate
      }))
    });
  } catch (error) {
    next(error);
  }
});
```

## Testing Requirements

### Unit Tests

**Test each entity's duplicate detection:**

1. **Email Uniqueness**: Verify email duplicates are caught across entities
2. **Phone Uniqueness**: Test phone normalization and duplicate detection
3. **Name Combinations**: Test company + contact name uniqueness for leads
4. **Domain Uniqueness**: Test domain normalization and duplicate detection
5. **Error Format**: Verify all duplicate errors follow the same format

### Integration Tests

**Test cross-entity duplicate scenarios:**

1. **Contact-Lead Conflicts**: Same email in both contacts and leads
2. **Company-Lead Conflicts**: Same domain in both companies and leads
3. **Case Sensitivity**: Verify uniqueness is case-insensitive where appropriate
4. **Normalization**: Verify phone and domain normalization works correctly

### Edge Cases

**Test these scenarios:**

1. **Null Values**: Ensure null values don't trigger duplicate errors
2. **Partial Matches**: Test partial data doesn't create false positives
3. **Special Characters**: Test special characters in names and emails
4. **International Formats**: Test international phone numbers and domains

## Enforcement Checklist

- [ ] All CRM entities have defined unique constraints
- [ ] Duplicate errors follow standardized format
- [ ] Database unique indexes enforce constraints at DB level
- [ ] Data normalization utilities are implemented
- [ ] API endpoints validate duplicates before creation
- [ ] Cross-entity duplicate checking is available
- [ ] Comprehensive test coverage for all scenarios
- [ ] Proper error handling and user feedback
- [ ] Monitoring for duplicate detection performance
- [ ] Audit logging for duplicate detection events
