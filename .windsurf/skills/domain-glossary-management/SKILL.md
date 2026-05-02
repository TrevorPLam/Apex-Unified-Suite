---
name: domain-glossary-management
description: Create and maintain domain glossary with ubiquitous language for Domain-Driven Design implementation in Apex Unified Suite.
---

# Domain Glossary Management

## Purpose
Establish a shared vocabulary (ubiquitous language) that bridges business stakeholders, developers, and domain experts. This prevents ambiguity and ensures consistent terminology across the entire Apex Unified Suite codebase.

## When to Use This Skill
- Starting new bounded contexts or business modules
- Onboarding new team members
- During domain modeling sessions
- When terminology conflicts arise between teams
- Before implementing new business features

## Prerequisites
- Understanding of Domain-Driven Design principles
- Access to business stakeholders or product requirements
- Knowledge of the 10 business domains in Apex Unified Suite

## Implementation Steps

### 1. Set Up Glossary Structure
Create a central glossary file that organizes terms by bounded context:

```markdown
# Domain Glossary

## CRM Domain
- **Lead**: Potential customer who has shown interest but not yet converted
- **Contact**: Individual person or organization associated with leads/deals
- **Deal**: Opportunity in progress with potential revenue value
- **Engagement**: Any interaction with contacts (email, call, meeting)

## Projects Domain
- **Project**: Time-bound initiative with specific deliverables
- **Task**: Atomic unit of work within a project
- **Milestone**: Significant checkpoint in project timeline
- **Template**: Reusable project structure or task pattern

## Finance Domain
- **Invoice**: Formal request for payment for goods/services
- **Payment**: Monetary transaction settling an invoice
- **Expense**: Cost incurred by the organization
- **Budget**: Planned allocation of financial resources
```

### 2. Conduct Domain Discovery Workshops
Organize sessions with business stakeholders to:
- Identify key business terms and concepts
- Map term relationships and dependencies
- Resolve terminology conflicts
- Establish context boundaries

**Workshop Format:**
1. **Term Collection** (30 min): Brainstorm all domain terms
2. **Definition Refinement** (45 min): Write clear, unambiguous definitions
3. **Context Mapping** (30 min): Assign terms to bounded contexts
4. **Conflict Resolution** (15 min): Address overlapping or conflicting terms

### 3. Create Bounded Context Glossaries
Split the main glossary by bounded context:

```typescript
// src/domain/crm/glossary.ts
export const CRM_GLOSSARY = {
  LEAD: {
    definition: "Potential customer who has shown interest but not yet converted",
    attributes: ["status", "source", "value", "assignedTo"],
    examples: ["Website lead from contact form", "Referral from existing customer"]
  },
  CONTACT: {
    definition: "Individual person or organization associated with leads/deals",
    attributes: ["firstName", "lastName", "email", "phone", "company"],
    relationships: ["associatedWith", "employs"]
  }
} as const;

// Type definitions for type safety
export type Lead = typeof CRM_GLOSSARY.LEAD.definition;
export type ContactAttributes = typeof CRM_GLOSSARY.CONTACT.attributes;
```

### 4. Integrate with Code Generation
Update the OpenAPI specification to include domain terms:

```yaml
# lib/api-spec/openapi.yaml
components:
  schemas:
    Lead:
      type: object
      description: "${CRM_GLOSSARY.LEAD.definition}"
      properties:
        id:
          type: string
          description: "Unique identifier for the lead"
        status:
          type: string
          enum: [new, contacted, qualified, converted, lost]
          description: "Current status based on ${CRM_GLOSSARY.LEAD.definition} lifecycle"
```

### 5. Implement Validation Layer
Create Zod schemas that enforce domain terminology:

```typescript
// lib/api-zod/src/generated/crm-schemas.ts
import { z } from 'zod';

export const LeadSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  source: z.string().describe("Channel through which lead was acquired"),
  value: z.number().min(0).describe("Potential revenue value"),
}).describe(`Represents a ${CRM_GLOSSARY.LEAD.definition} in the system`);
```

### 6. Set Up Documentation Generation
Create automated glossary documentation:

```typescript
// scripts/generate-glossary-docs.ts
import { CRM_GLOSSARY, PROJECTS_GLOSSARY, FINANCE_GLOSSARY } from '../src/domain/glossaries';

export function generateGlossaryDocs() {
  const contexts = [
    { name: 'CRM', glossary: CRM_GLOSSARY },
    { name: 'Projects', glossary: PROJECTS_GLOSSARY },
    { name: 'Finance', glossary: FINANCE_GLOSSARY }
  ];

  return contexts.map(context => `
## ${context.name} Domain

${Object.entries(context.glossary).map(([term, definition]) => `
### ${term}
**Definition**: ${definition.definition}

**Attributes**: ${definition.attributes.join(', ')}

**Examples**: ${definition.examples.join(', '')}
`).join('\n')}
`).join('\n\n');
}
```

## Verification Steps

### 1. Review Glossary Completeness
```bash
# Check if all business domains have glossaries
find src/domain -name "glossary.ts" | wc -l
# Should return 10 (one for each business domain)
```

### 2. Validate Type Safety
```bash
pnpm run typecheck
# Ensure all glossary terms are properly typed
```

### 3. Test API Documentation
```bash
pnpm --filter @workspace/api-spec run codegen
# Verify glossary terms appear in generated OpenAPI docs
```

### 4. Review Team Understanding
Schedule review sessions with:
- Development team
- Product managers
- Business stakeholders

Verify everyone uses consistent terminology in:
- Code comments and variable names
- API documentation
- User interface text
- Database schema definitions

## Maintenance Procedures

### Weekly Updates
- Review new terms from feature development
- Update definitions based on stakeholder feedback
- Check for terminology inconsistencies in new code

### Monthly Reviews
- Full glossary audit with all stakeholders
- Identify emerging term conflicts
- Update bounded context boundaries if needed

### Integration with Development Workflow
1. **Pre-Development**: Reference glossary during technical design
2. **During Development**: Use glossary terms in naming conventions
3. **Code Review**: Verify consistent terminology usage
4. **Documentation**: Include glossary references in API docs

## Common Pitfalls to Avoid

### ❌ Anti-Patterns
- **Tech Jargon in Business Terms**: Don't use "entity" when business says "customer"
- **Inconsistent Naming**: "User" in one module, "Customer" in another
- **Missing Context**: Terms without clear bounded context assignment
- **Stale Definitions**: Glossary not updated as business evolves

### ✅ Best Practices
- **Business-First Language**: Start from business terminology, not technical
- **Context Boundaries**: Clear assignment of terms to specific domains
- **Living Document**: Regular updates as understanding evolves
- **Cross-Team Alignment**: Ensure all teams use same definitions

## File Structure
```
src/
├── domain/
│   ├── glossary.ts              # Main glossary file
│   ├── crm/
│   │   └── glossary.ts         # CRM-specific terms
│   ├── projects/
│   │   └── glossary.ts         # Projects-specific terms
│   ├── finance/
│   │   └── glossary.ts         # Finance-specific terms
│   └── [other-domains]/
│       └── glossary.ts
├── scripts/
│   └── generate-glossary-docs.ts # Documentation generator
└── docs/
    └── domain-glossary.md         # Generated documentation
```

## Success Metrics
- **Zero Terminology Conflicts**: No ambiguous terms in code reviews
- **100% API Coverage**: All business terms defined in OpenAPI specs
- **Team Alignment**: All stakeholders use consistent language
- **Onboarding Efficiency**: New team members understand terms within 1 week

## Integration with Existing Skills
This skill works with:
- `bounded-context-mapping` for defining domain boundaries
- `database-schema-development` for implementing domain models
- `api-business-endpoints` for consistent API terminology
- `create-react-component` for UI consistency

## Related Documentation
- [Domain-Driven Design](https://domain-driven.design/) - Official DDD resources
- [Azure Multi-Tenant Patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns) - Domain isolation strategies
- [Apex Architecture Guide](./ydm-architecture.md) - Project-specific DDD implementation
