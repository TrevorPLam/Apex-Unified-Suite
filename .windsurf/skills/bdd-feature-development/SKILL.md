---
name: bdd-feature-development
description: Write and manage Gherkin feature files for Behavior-Driven Development (BDD) using ubiquitous language from the domain glossary
---

# BDD Feature Development

This skill guides you through writing Gherkin feature files for Behavior-Driven Development that align with domain-driven design principles and serve as executable specifications.

## Current State Assessment

**BDD Status**: Zero feature files exist - behavior is completely unspecified.

**Missing Infrastructure**:
- No `.feature` files for any bounded context
- No Gherkin scenarios documenting user workflows
- No executable specifications linking to test automation
- No connection between domain glossary and behavior specs

## Gherkin Best Practices (2026)

### **Describe Behavior, Not Implementation**

**Good** - Declarative style describing what:
```gherkin
When "Bob" logs in with valid credentials
Then Bob should see the dashboard
```

**Bad** - Procedural style describing how:
```gherkin
Given I visit "/login"
When I enter "Bob" in the "username" field
And I enter "password" in the "password" field
And I click the "login" button
Then I should see the "dashboard" page
```

### **Use Ubiquitous Language**
- Every term in feature files MUST exist in `docs/glossary.md`
- Use domain language, not technical jargon
- Example: "Lead", "Deal", "Invoice" - not "Record", "Entity", "Row"

### **Scenario Structure**
- **Given** - Context/setup (preconditions)
- **When** - Action/event (the behavior being tested)
- **Then** - Expected outcome (verification)

### **Positive and Negative Paths**
Every feature must include both success scenarios and error/edge cases.

## Step-by-Step Implementation

### **Step 1: Create Feature File Structure**

Create the directory structure:
```
docs/features/
├── auth.feature
├── crm.feature
├── projects.feature
├── finance.feature
├── documents.feature
├── assets.feature
├── portal.feature
├── analytics.feature
├── settings.feature
└── appointments.feature
```

### **Step 2: Write Identity & Access Feature**

**File**: `docs/features/auth.feature`

```gherkin
Feature: Identity and Access Management
  As a user
  I want to securely authenticate and manage my account
  So that I can access the system and protect my data

  Background:
    Given an organization "Acme Corp" exists
    And the organization has a user "john@acme.com" with password "SecurePass123!"

  Scenario: Successful registration with valid organization
    Given a new user wants to join "Acme Corp"
    When they register with email "jane@acme.com" and password "SecurePass123!"
    Then the user account should be created
    And the user should receive a confirmation email
    And the user should be linked to "Acme Corp"

  Scenario: Registration rejected for duplicate email
    Given a user "john@acme.com" already exists in "Acme Corp"
    When someone tries to register with email "john@acme.com"
    Then the registration should fail with error "DuplicateEmail"
    And no new user should be created

  Scenario: Successful login with valid credentials
    Given the user "john@acme.com" exists with password "SecurePass123!"
    When they login with email "john@acme.com" and password "SecurePass123!"
    Then they should receive an access token and refresh token
    And the tokens should contain their user ID and role

  Scenario: Login rejected with invalid credentials
    Given the user "john@acme.com" exists
    When they login with email "john@acme.com" and password "WrongPassword"
    Then the login should fail with error "InvalidCredentials"
    And no tokens should be issued

  Scenario: Access denied for expired token
    Given a user with an expired access token
    When they attempt to access a protected resource
    Then the request should be rejected with error "TokenExpired"
    And they should be prompted to refresh their token

  Scenario: Token refresh with valid refresh token
    Given a user has a valid refresh token
    When they request a token refresh
    Then they should receive a new access token
    And the refresh token should be rotated

  Scenario: Logout invalidates refresh token
    Given a logged-in user with a valid refresh token
    When they logout
    Then the refresh token should be invalidated
    And subsequent refresh attempts should fail

  Scenario: Weak password rejected during registration
    Given a new user wants to register
    When they try to register with password "123"
    Then the registration should fail with error "WeakPassword"
    And the error should specify minimum password requirements
```

### **Step 3: Write CRM Feature**

**File**: `docs/features/crm.feature`

```gherkin
Feature: Customer Relationship Management
  As a sales user
  I want to manage leads, contacts, and deals
  So that I can track and close sales opportunities

  Background:
    Given the user "sales@acme.com" is authenticated with role "sales"
    And the user belongs to organization "Acme Corp"

  Scenario: Process lead through pipeline stages
    Given a lead "Enterprise Software Opportunity" exists in stage "new"
    When the user moves the lead to stage "qualified"
    And the user moves the lead to stage "proposal"
    And the user moves the lead to stage "negotiation"
    And the user marks the lead as "closed_won"
    Then the lead stage should be "closed_won"
    And a deal should be created from the lead
    And the lead history should record all stage transitions

  Scenario: Invalid stage transition rejected
    Given a lead exists in stage "new"
    When the user attempts to move the lead directly to "closed_won"
    Then the transition should fail with error "InvalidStageTransition"
    And the lead should remain in stage "new"

  Scenario: Duplicate lead detection
    Given a lead with email "prospect@company.com" already exists
    When the user creates a new lead with email "prospect@company.com"
    Then the creation should fail with error "DuplicateLead"
    And the user should be offered to merge with existing lead

  Scenario: Lead not found error
    Given a lead with ID "non-existent-id" does not exist
    When the user attempts to retrieve the lead
    Then the request should fail with error "LeadNotFound"

  Scenario: Activity logging on lead interaction
    Given a lead "Hot Prospect" exists
    When the user adds a note "Called prospect, interested in demo"
    And the user schedules a follow-up for tomorrow
    Then the lead activity log should contain 2 entries
    And the entries should be timestamped
    And the entries should show the user "sales@acme.com" as actor

  Scenario: Unauthorized access to another organization's lead
    Given a lead exists in organization "Other Corp"
    When "sales@acme.com" from "Acme Corp" attempts to access it
    Then the request should fail with error "LeadNotFound"
    And the access attempt should be logged in audit trail
```

### **Step 4: Write Finance Feature**

**File**: `docs/features/finance.feature`

```gherkin
Feature: Financial Operations
  As a finance user
  I want to manage invoices and payments
  So that I can track revenue and customer payments

  Background:
    Given the user "finance@acme.com" is authenticated with role "finance"
    And a customer "Beta Inc" exists with open invoices

  Scenario: Create invoice for customer
    Given customer "Beta Inc" has no outstanding invoices
    When the user creates an invoice for $10,000 with due date in 30 days
    Then the invoice should be in status "draft"
    And the invoice should have a unique invoice number
    And the customer should receive an invoice notification

  Scenario: Pay invoice with idempotency
    Given an invoice "INV-001" exists with balance $5,000
    When the user records a payment of $5,000 with idempotency key "pay-123"
    And the user attempts the same payment with idempotency key "pay-123"
    Then only one payment should be recorded
    And the invoice balance should be $0
    And the invoice status should be "paid"

  Scenario: Overpayment rejected
    Given an invoice "INV-002" exists with balance $3,000
    When the user attempts to record a payment of $5,000
    Then the payment should fail with error "PaymentExceedsBalance"
    And the invoice balance should remain $3,000

  Scenario: Budget threshold alert
    Given a project "Website Redesign" has budget $50,000
    And current spending is $45,000
    When a new expense of $8,000 is recorded
    Then the system should trigger a "BudgetThresholdReached" alert
    And the project status should change to "at_risk"
```

### **Step 5: Write Document Management Feature**

**File**: `docs/features/documents.feature`

```gherkin
Feature: Document Management and E-Sign
  As a user
  I want to manage documents and request e-signatures
  So that I can execute contracts digitally

  Background:
    Given the user "legal@acme.com" is authenticated
    And a document "Contract.pdf" exists in the system

  Scenario: Send document for e-signature
    Given a document "Contract.pdf" is ready for signature
    And signers are defined:
      | name       | email                  | order |
      | John Doe   | john@client.com        | 1     |
      | Jane Smith | jane@client.com        | 2     |
    When the user sends the document for e-signature via SignWell
    Then a signature request should be created in SignWell
    And the document status should be "awaiting_signatures"
    And John Doe should receive a signature request email

  Scenario: Signature status reflected in document list
    Given a document was sent for e-signature
    When John Doe signs the document
    Then the document status should update to "partially_signed"
    When Jane Smith signs the document
    Then the document status should update to "fully_signed"
    And all parties should receive completion notifications

  Scenario: Cannot send document without signers
    Given a document exists without defined signers
    When the user attempts to send for e-signature
    Then the request should fail with error "NoSignersDefined"
    And the user should be prompted to add signers first
```

## Feature File Patterns

### **Structure Template**
```gherkin
Feature: [Feature Name]
  As a [role]
  I want [goal]
  So that [benefit]

  Background:
    Given [shared preconditions]

  Scenario: [Descriptive scenario name]
    Given [context]
    When [action]
    Then [outcome]

  Scenario: [Error scenario name]
    Given [context]
    When [invalid action]
    Then [error outcome]
```

### **Data Tables for Complex Input**
```gherkin
Scenario: Bulk import contacts
  Given the following contacts to import:
    | firstName | lastName | email              | company  |
    | John      | Doe      | john@acme.com      | Acme Corp|
    | Jane      | Smith    | jane@beta.com      | Beta Inc |
  When the user imports the contacts
  Then 2 contacts should be created
  And all contacts should be linked to the user's organization
```

### **Scenario Outlines for Data-Driven Tests**
```gherkin
Scenario Outline: Lead stage transitions
  Given a lead exists in stage "<from_stage>"
  When the user moves the lead to stage "<to_stage>"
  Then the transition should be "<result>"

  Examples:
    | from_stage  | to_stage      | result    |
    | new         | qualified     | allowed   |
    | new         | closed_won    | rejected  |
    | proposal    | negotiation   | allowed   |
    | negotiation | closed_won    | allowed   |
```

## Glossary Alignment Checklist

Before finalizing a feature file, verify:
- [ ] All business terms exist in `docs/glossary.md`
- [ ] No technical/database terms used (use "Lead" not "lead_record")
- [ ] Error codes match domain error types (see `artifacts/api-server/src/errors/domain-errors.ts`)
- [ ] Scenario names describe behavior, not implementation
- [ ] Each feature has at least one positive and one negative scenario

## Minimum Scenario Requirements

Each bounded context feature file must include:
- **Identity & Access**: ≥4 scenarios (register, login, refresh, logout + negative cases)
- **CRM**: ≥5 scenarios (pipeline, duplicates, not found, activities, permissions)
- **Projects**: ≥4 scenarios (create, update, delete, status transitions)
- **Finance**: ≥4 scenarios (create, pay, overpayment, budget alerts)
- **Documents**: ≥4 scenarios (upload, e-sign, status tracking, permissions)
- **Assets**: ≥4 scenarios (checkout, return, maintenance, depreciation)
- **Portal**: ≥4 scenarios (access, permissions, magic-link, session)
- **Analytics**: ≥3 scenarios (reports, date ranges, exports)
- **Settings**: ≥3 scenarios (update, permissions, API keys)
- **Appointments**: ≥5 scenarios (book, cancel, availability, conflicts, rules)

## Integration with Testing

Future phases will wire these feature files to:
- **Playwright + Cucumber**: Automated acceptance tests
- **Cucumber-js**: Node.js test runner for Gherkin
- **Living documentation**: Features as executable specifications

## Verification Commands

After creating feature files:
```bash
# Check feature file syntax
npx gherkin-lint docs/features/*.feature

# Validate against glossary (manual review)
grep -r "Given\|When\|Then" docs/features/*.feature | sort | uniq

# Count scenarios per file
for f in docs/features/*.feature; do echo "$f: $(grep -c "^  Scenario:" $f)"; done
```

This approach ensures feature files serve as both human-readable documentation and the foundation for automated acceptance testing.
