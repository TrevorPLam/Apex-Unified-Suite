---
name: create-adr
description: Guide for creating MADR-style Architecture Decision Records with proper template, status tracking, and repository integration for the Apex Unified Suite.
---

# Create Architecture Decision Record (ADR)

## Overview
This skill guides you through creating a MADR (Markdown Any Decision Record) style Architecture Decision Record for the Apex Unified Suite. ADRs capture architectural decisions with rationale, alternatives considered, and consequences.

## Prerequisites
- Git workspace with committed changes
- Understanding of the architectural decision being documented
- Access to the project's decision log directory

## Step 1: Determine ADR Type and Scope

Before creating an ADR, assess whether the decision meets these criteria:

### Architecturally Significant Requirements (ASRs)
- **Functional requirements** that have measurable effect on system architecture
- **Non-functional requirements** (performance, security, scalability, maintainability)
- **Cross-cutting concerns** affecting multiple bounded contexts
- **Technology choices** with long-term impact
- **Integration patterns** between systems or contexts

### Decision Drivers
Ask yourself:
- Is this decision reversible without significant cost?
- Does it affect multiple teams or bounded contexts?
- Will it influence future architectural decisions?
- Does it introduce new constraints or dependencies?

## Step 2: Choose ADR Template

### Use Full MADR Template for:
- Major architectural decisions (new bounded contexts, significant technology changes)
- Decisions with multiple viable options
- Decisions requiring stakeholder consensus

### Use Minimal MADR Template for:
- Minor architectural decisions
- Internal team decisions
- Decisions with obvious best choice

## Step 3: Create ADR File

### File Naming Convention
```
docs/adr/ARCH-XXX-decision-title.md
```

Where:
- `XXX` = Sequential number (e.g., 001, 002, 003)
- `decision-title` = kebab-case summary of decision

### Number Assignment
1. Check existing ADRs in `docs/adr/` directory
2. Use next sequential number
3. Update ADR index if it exists

## Step 4: Populate MADR Template

### Full MADR Template Structure:

```markdown
# [Title]

## Status
[proposed | rejected | accepted | deprecated | superseded by [ADR-XXX]]

## Date
[YYYY-MM-DD]

## Deciders
[List everyone involved in the decision]

## Consulted
[List subject matter experts and stakeholders]

## Informed
[List teams/people kept up-to-date]

## Context
[Describe the problem or situation that requires this decision]

## Decision Drivers
[List the key factors that influence this decision]

## Considered Options
### Option 1: [Title]
- **Pros**: [List advantages]
- **Cons**: [List disadvantages]

### Option 2: [Title]
- **Pros**: [List advantages]
- **Cons**: [List disadvantages]

### Option 3: [Title] (if applicable)
- **Pros**: [List advantages]
- **Cons**: [List disadvantages]

## Decision
[Clearly state the chosen option and why]

## Consequences
- **Positive**: [Expected benefits]
- **Negative**: [Drawbacks and trade-offs]

## Confirmation
[Optional: How the decision will be validated]
```

### Minimal MADR Template:

```markdown
# [Title]

## Status
[proposed | accepted | rejected]

## Context
[Problem description]

## Decision
[Chosen solution]

## Consequences
[Impact of the decision]
```

## Step 5: Write Quality Content Guidelines

### Context Section
- **Be specific**: Describe the actual problem, not generic concerns
- **Include metrics**: If performance is an issue, include current vs. target metrics
- **Reference requirements**: Link to specific business or technical requirements
- **Explain urgency**: Why this decision needs to be made now

### Options Section
- **Be objective**: Present each option fairly
- **Include costs**: Both implementation and ongoing maintenance costs
- **Consider risks**: Security, scalability, team expertise risks
- **Provide evidence**: Data, benchmarks, or case studies when possible

### Decision Section
- **Be decisive**: Clearly state which option was chosen
- **Explain reasoning**: Connect decision back to decision drivers
- **Address trade-offs**: Acknowledge why other options were rejected
- **Define scope**: What is included and what is out of scope

### Consequences Section
- **Be comprehensive**: Include both technical and business impacts
- **Consider timeline**: Short-term vs. long-term consequences
- **Identify dependencies**: What other decisions or work does this enable?
- **Plan mitigation**: How negative consequences will be managed

## Step 6: Review and Validation

### Self-Review Checklist
- [ ] Title is clear and descriptive
- [ ] Status is accurately set
- [ ] All required sections are complete
- [ ] Decision drivers are clearly linked to decision
- [ ] Options are presented objectively
- [ ] Consequences cover both positive and negative impacts
- [ ] Language is precise and unambiguous

### Stakeholder Review
1. **Technical review**: Share with senior developers and architects
2. **Business review**: Share with product managers and stakeholders
3. **Security review**: Include security team for decisions affecting security
4. **Operations review**: Include DevOps/SRE for infrastructure decisions

## Step 7: Integration Process

### Git Workflow
```bash
# Create feature branch
git checkout -b adr/ARCH-XXX-[decision-title]

# Add ADR file
git add docs/adr/ARCH-XXX-[decision-title].md

# Commit with descriptive message
git commit -m "feat: Add ARCH-XXX - [decision title] ADR"

# Push for review
git push origin adr/ARCH-XXX-[decision-title]
```

### ADR Status Updates
- **Proposed**: Initial creation, awaiting review
- **Accepted**: Decision made and approved
- **Rejected**: Decision not pursued (include reason)
- **Deprecated**: Decision superseded or no longer relevant
- **Superseded by**: Replaced by newer ADR (reference new ADR)

### Repository Integration
- Update ADR index if it exists
- Add to decision log summary
- Link from related code/documentation
- Consider adding to project README for major decisions

## Step 8: Post-Decision Activities

### Implementation Tracking
- Create implementation tasks/issues referencing the ADR
- Update ADR status as implementation progresses
- Add implementation notes to ADR as lessons learned

### Review and Maintenance
- Schedule review 1-3 months after implementation
- Update ADR with actual outcomes vs. expected consequences
- Consider creating follow-up ADRs for related decisions

## Common ADR Patterns in Apex Unified Suite

### Bounded Context Decisions
- New bounded context creation
- Context boundary adjustments
- Cross-context integration patterns

### Technology Decisions
- Database technology choices
- API framework selections
- Authentication/authorization patterns
- Deployment infrastructure changes

### Process Decisions
- Development workflow changes
- Testing strategy updates
- Monitoring and observability implementations

## Example ADRs for Reference

See existing ADRs in `docs/adr/` directory for examples of:
- ARCH-001: API-first development approach
- ARCH-005: Multi-tenancy strategy
- Additional project-specific architectural decisions

## Troubleshooting

### Common Issues
- **Vague context**: Be more specific about the problem
- **Incomplete options**: Ensure all viable alternatives are considered
- **Missing consequences**: Always document both positive and negative impacts
- **Unclear decision**: State exactly what was decided and why

### Getting Help
- Consult with senior architects for complex decisions
- Reference existing ADRs for formatting and content examples
- Use the MADR project documentation for template guidance
- Consider pair decision-making for critical architectural choices

## Integration with Development Workflow

### Code References
When implementing code based on an ADR:
```typescript
// Implementation based on ARCH-XXX decision
// See: docs/adr/ARCH-XXX-decision-title.md
```

### Documentation Updates
- Update API documentation for API-related decisions
- Update developer guides for process decisions
- Update deployment guides for infrastructure decisions

## Quality Metrics

Good ADRs should be:
- **Actionable**: Clear what needs to be done
- **Justifiable**: Rationale is compelling and evidence-based
- **Traceable**: Can be linked to requirements and implementation
- **Maintainable**: Easy to update as circumstances change
- **Shareable**: Understandable by both technical and business stakeholders

This skill ensures all architectural decisions in the Apex Unified Suite are properly documented, reviewed, and traceable throughout the project lifecycle.
