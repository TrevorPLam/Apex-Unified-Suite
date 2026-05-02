---
trigger: always_on
---

# API-First Development Rule

Enforce API-first development methodology where OpenAPI specifications drive all implementation.

## Core Requirements

### **Specification First**
- All new features MUST start with OpenAPI specification updates in `lib/api-spec/openapi.yaml`
- Never implement backend routes without corresponding OpenAPI definitions
- Never implement frontend data fetching without generated React Query hooks

### **Code Generation Workflow**
1. Update `lib/api-spec/openapi.yaml` with new endpoints
2. Run `pnpm --filter @workspace/api-spec run codegen` to generate:
   - React Query hooks in `lib/api-client-react/src/generated/`
   - Zod schemas in `lib/api-zod/src/generated/`
3. Use generated types and hooks in implementation
4. Never manually edit generated files

### **Type Safety Enforcement**
- All API responses must use generated Zod schemas for validation
- Frontend must use generated React Query hooks, not manual fetch calls
- Backend must validate requests using generated Zod schemas
- End-to-end type safety from database to frontend

### **Implementation Order**
1. Define OpenAPI specification
2. Generate types and hooks
3. Implement backend routes with validation
4. Implement frontend components with generated hooks
5. Add integration tests

## Anti-Patterns

❌ **Never** implement backend routes without OpenAPI spec
❌ **Never** use manual `fetch()` in frontend components
❌ **Never** write custom validation logic - use generated Zod schemas
❌ **Never** manually create TypeScript interfaces for API data

## Validation Commands

```bash
# Verify code generation is up to date
pnpm --filter @workspace/api-spec run codegen

# Check that all generated files are recent
ls -la lib/api-client-react/src/generated/
ls -la lib/api-zod/src/generated/

# Ensure no manual edits to generated files
git status lib/api-client-react/src/generated/
git status lib/api-zod/src/generated/
```

## Examples

### ✅ Correct Workflow
```typescript
// 1. OpenAPI spec defines endpoint
GET /api/crm/contacts
responses:
  200:
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ContactList'

// 2. Generated hook usage
import { useListContacts } from '@workspace/api-client-react';

function ContactsPage() {
  const { data: contacts, isLoading, error } = useListContacts();
  // ...
}
```

### ❌ Incorrect Workflow
```typescript
// Manual fetch - NOT ALLOWED
function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  
  useEffect(() => {
    fetch('/api/crm/contacts')
      .then(res => res.json())
      .then(setContacts);
  }, []);
  // ...
}
```

## Compliance Checklist

- [ ] OpenAPI spec updated before implementation
- [ ] Code generation run after spec changes
- [ ] Generated hooks used in frontend
- [ ] Generated Zod schemas used for validation
- [ ] No manual edits to generated files
- [ ] End-to-end type safety verified

This rule ensures consistent, type-safe API development across the entire Apex Unified Suite.
