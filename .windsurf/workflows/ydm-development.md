---
description: Complete YDM development workflow from API changes to frontend integration with type safety
---

# YDM Development Workflow

This workflow guides you through the complete YDM development process, ensuring API-first development, type safety, and proper monorepo coordination.

## Prerequisites

- Read YDM architecture rules and API-first development guidelines
- Understand pnpm workspace structure
- Repository must be in clean state (no uncommitted changes)

---

## Step 1: Define API Specification

Always start with the OpenAPI specification - this is the single source of truth.

### Action

Update `lib/api-spec/openapi.yaml` with new endpoints or schema changes.

### Key Requirements

- Use OpenAPI 3.1.0 specification
- All endpoints use `/api` prefix
- Title must remain "Api" for import path compatibility
- Include proper schema definitions in `components/schemas`
- Add operationId for each operation (used for hook generation)

### Output Required

- Summary of API changes made
- New endpoints added
- Schema definitions created/modified

---

## Step 2: Update Database Schema (if applicable)

If API changes involve new data models, update the database schema first.

### Action

Update `lib/db/src/schema/index.ts` with new table definitions.

### Schema Requirements

- Use Drizzle ORM with PostgreSQL
- Generate Zod schemas with `createInsertSchema`
- Include proper foreign key relationships
- Match OpenAPI schema structure

### Output Required

- Tables added/modified
- Zod schemas generated
- Relationship definitions

---

## Step 3: Generate Code

Run the code generation pipeline to create type-safe API hooks and validation schemas.

### Action

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Verification

- Check `lib/api-client-react/src/generated/` for React Query hooks
- Check `lib/api-zod/src/generated/types/` for Zod schemas
- Verify no generation errors occurred

### Output Required

- Confirmation of successful generation
- List of new hooks/schemas created
- Any generation issues and their resolution

---

## Step 4: Implement Backend Endpoints

Create Express routes that use the generated Zod schemas for validation.

### Action

Create/update route files in `artifacts/api-server/src/routes/`.

### Implementation Standards

- Import Zod schemas from `@workspace/api-zod`
- Use `db` from `@workspace/db` for database operations
- Include proper error handling with status codes
- Register routes in `src/routes/index.ts`

### Route Template

```typescript
// Example route structure
import { Router } from 'express';
import { z } from 'zod';
import { insertUserSchema } from '@workspace/api-zod';
import { db } from '@workspace/db';
import { usersTable } from '@workspace/db/schema';

const router = Router();

router.get('/', async (req, res) => {
  // Implementation
});

router.post('/', async (req, res) => {
  const validated = insertUserSchema.parse(req.body);
  // Implementation
});

export default router;
```

### Output Required

- Routes created/modified
- Database operations implemented
- Error handling added

---

## Step 5: Update Frontend Integration

Replace static data with API calls using generated React Query hooks.

### Action

Update components in `artifacts/nexus-digital/src/` to use generated hooks.

### Integration Pattern

```typescript
// Replace static imports
// OLD: import { industries } from '@/data/industries';
// NEW: import { useIndustriesQuery } from '@workspace/api-client-react';

const { data: industries, isLoading, error } = useIndustriesQuery();
```

### Components to Update

- Pages using static data (Home, Industry, BlogList, BlogPost)
- Forms (ContactForm)
- Any components with mock data

### Output Required

- Components updated with API hooks
- Loading states added
- Error handling implemented

---

## Step 6: Type Checking and Validation

Ensure full workspace type safety across all packages.

### Action

```bash
pnpm run typecheck
```

### Validation Steps

- All TypeScript errors resolved
- Cross-package type references working
- Generated types properly integrated

### Output Required

- Typecheck results
- Any type errors and their resolution
- Confirmation of type safety

---

## Step 7: Testing

Verify the implementation works end-to-end.

### Backend Testing

```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Test endpoints
curl -X GET http://localhost:23379/api/healthz
curl -X GET http://localhost:23379/api/your-endpoint
```

### Frontend Testing

```bash
# Start frontend
pnpm --filter @workspace/nexus-digital run dev

# Test in browser
# - Navigate to pages using new data
# - Test form submissions
# - Verify loading/error states
```

### Output Required

- API endpoint test results
- Frontend functionality verification
- Any issues found and fixes applied

---

## Step 8: Build Verification

Ensure the entire monorepo builds successfully.

### Action

```bash
pnpm run build
```

### Verification

- All packages build without errors
- Generated files included in build
- No build warnings or errors

### Output Required

- Build results for all packages
- Any build issues and resolution
- Confirmation of successful build

---

## Step 9: Update Documentation

Update relevant documentation if the changes warrant it.

### Documentation to Review

- OpenAPI spec (already updated in Step 1)
- Component documentation if new patterns introduced
- API documentation if new endpoints added

### When to Update

- New endpoints added
- Significant UI changes
- New data patterns introduced

### Output Required

- Documentation files updated (if any)
- Summary of changes made
- Reason for updates

---

## Step 10: Git Workflow

Commit and push changes following the project's git workflow.

### Actions

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add [feature name] with API-first development

- Update OpenAPI specification
- Generate React Query hooks and Zod schemas  
- Implement backend endpoints
- Integrate frontend with API calls
- Add proper error handling and loading states"

# Push to branch
git push origin feature-branch-name
```

### Output Required

- Confirmation of commit and push
- Commit message used
- Branch pushed to

---

## Quality Assurance Checklist

Before completing the workflow, verify:

- [ ] OpenAPI spec follows project conventions
- [ ] Database schema matches API definitions
- [ ] Code generation completed successfully
- [ ] Backend endpoints use Zod validation
- [ ] Frontend uses generated React Query hooks
- [ ] Full workspace typechecks without errors
- [ ] All packages build successfully
- [ ] Manual testing confirms functionality
- [ ] Documentation updated if needed
- [ ] Changes committed and pushed

---

## Common Issues and Solutions

### Code Generation Failures

- **Problem**: Orval fails to generate hooks
- **Solution**: Check OpenAPI syntax, ensure operationId is unique
- **Command**: `pnpm --filter @workspace/api-spec run codegen`

### Type Mismatches

- **Problem**: Generated types don't match database schema
- **Solution**: Align OpenAPI schemas with Drizzle table definitions
- **Check**: Run `pnpm run typecheck` to identify issues

### CORS Issues

- **Problem**: Frontend can't connect to API
- **Solution**: Verify CORS middleware configuration
- **Check**: API server CORS settings

### Import Path Issues

- **Problem**: Generated hooks not found
- **Solution**: Ensure workspace packages are properly linked
- **Command**: `pnpm install` to refresh dependencies

---

## Source-of-Truth Order

When deciding what to do, prioritize in this order:

1. OpenAPI specification (`lib/api-spec/openapi.yaml`)
2. Database schema (`lib/db/src/schema/`)
3. Generated types and hooks
4. Backend implementation
5. Frontend integration
6. Testing and validation

If conflicts exist between specifications and implementation, **follow the API-first approach and update the specification to match the intended behavior.**

---

## Response Style

- Be concise but thorough
- Explain technical decisions clearly
- Provide copy-pasteable commands where applicable
- Include verification steps for each phase

---

## Notes

- This workflow ensures end-to-end type safety
- Always run codegen after OpenAPI changes
- Test both backend and frontend separately
- Verify the full monorepo builds before committing
- Follow API-first development principles religiously
