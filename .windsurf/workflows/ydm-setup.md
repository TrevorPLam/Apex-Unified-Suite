---
description: Complete YDM project setup from empty state to fully functional development environment
---

# YDM Project Setup Workflow

This workflow guides you through setting up a complete YDM development environment from scratch, including database schema, authentication, monitoring, and testing infrastructure.

## Prerequisites

- Replit environment with Node.js 24
- PostgreSQL database available
- pnpm workspace structure already exists
- Read YDM architecture rules

---

## Step 1: Database Schema Implementation

Create the complete database schema that supports the business logic.

### Action

Use the `implement-database-schema` skill to create all necessary tables.

### Key Tables to Create

- users (authentication and user management)
- sessions (JWT token management)
- industries (matches frontend data)
- blog_posts (content management)
- leads (contact form submissions)
- clients, projects (client management)

### Commands

```bash
# Update schema
# Edit lib/db/src/schema/index.ts

# Push to database
pnpm --filter @workspace/db run push

# Seed initial data
pnpm --filter @workspace/db run seed
```

### Output Required

- Database tables created
- Seed data populated
- Schema validation successful

---

## Step 2: Authentication System Setup

Implement JWT-based authentication with proper security measures.

### Action

Use the `implement-authentication` skill to create the auth system.

### Components to Implement

- JWT middleware for token verification
- Authentication routes (register, login, logout, me)
- Session management with database storage
- Frontend auth context and protected routes

### Environment Variables

Set these in Replit environment variables:

```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
```

### Commands

```bash
# Install auth dependencies
pnpm --filter @workspace/api-server add jsonwebtoken bcrypt
pnpm --filter @workspace/api-server add -D @types/jsonwebtoken @types/bcrypt

# Test authentication endpoints
curl -X POST http://localhost:23379/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@ydm.com","password":"admin123"}'
```

### Output Required

- Authentication middleware implemented
- Auth routes created and tested
- Frontend auth components working
- Session management functional

---

## Step 3: API Development

Create business logic endpoints following API-first development.

### Action

Use the `ydm-api-development` skill to implement core API endpoints.

### Endpoints to Implement

- `/api/industries` (GET all, GET by slug)
- `/api/blog-posts` (GET all, GET by slug)
- `/api/leads` (POST for contact forms)
- `/api/users` (CRUD for user management)

### Integration Points

- Use generated Zod schemas for validation
- Implement proper error handling
- Add authentication middleware where needed
- Follow RESTful conventions

### Commands

```bash
# Update OpenAPI spec
# Edit lib/api-spec/openapi.yaml

# Generate hooks and schemas
pnpm --filter @workspace/api-spec run codegen

# Test endpoints
curl -X GET http://localhost:23379/api/industries
curl -X GET http://localhost:23379/api/blog-posts
```

### Output Required

- API endpoints implemented
- OpenAPI spec updated
- Code generation successful
- Endpoints tested and working

---

## Step 4: Frontend API Integration

Replace static data with real API calls throughout the frontend.

### Action

Use the `integrate-frontend-api` skill to connect the frontend to the backend.

### Components to Update

- Home page (dynamic industries and blog posts)
- Industry pages (API-driven content)
- Blog pages (dynamic blog content)
- Contact form (functional submission)
- Navigation (auth-aware)

### Key Changes

- Replace static imports with React Query hooks
- Add loading states and error handling
- Implement form submissions
- Add authentication state management

### Commands

```bash
# Start both servers
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/nexus-digital run dev

# Test in browser
# Navigate through all pages
# Test contact form submission
# Test authentication flow
```

### Output Required

- Frontend fully integrated with API
- All pages using dynamic data
- Contact form functional
- Authentication flow working

---

## Step 5: Testing Infrastructure Setup

Implement comprehensive testing across the full stack.

### Action

Use the `testing-strategy` rule to set up testing frameworks.

### Testing Stack

- Frontend: Vitest + React Testing Library
- Backend: Jest + Supertest
- E2E: Playwright
- Coverage: c8

### Test Structure

```
artifacts/
├── api-server/src/__tests__/
│   ├── setup.ts
│   ├── routes/
│   └── middleware/
├── nexus-digital/src/__tests__/
│   ├── setup.ts
│   ├── components/
│   └── pages/
└── e2e/
    └── tests/
```

### Commands

```bash
# Install testing dependencies
pnpm --filter @workspace/api-server add -D jest supertest @types/jest @types/supertest
pnpm --filter @workspace/nexus-digital add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D playwright @playwright/test

# Run tests
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/nexus-digital test
pnpm run test:e2e
```

### Output Required

- Testing frameworks configured
- Test files created for key components
- Tests passing with good coverage
- CI/CD pipeline ready for testing

---

## Step 6: Monitoring and Analytics Setup

Implement error tracking, performance monitoring, and analytics.

### Action

Use the `implement-monitoring` skill to set up comprehensive monitoring.

### Monitoring Stack

- Error Tracking: Sentry
- Performance: Web Vitals
- Analytics: Privacy-first custom solution
- Logging: Enhanced Pino with structured data

### Components to Implement

- Frontend error boundaries with Sentry
- Backend error tracking
- Performance monitoring
- Privacy-focused analytics
- Health check enhancements

### Environment Variables

```bash
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ENVIRONMENT=development
ANALYTICS_ENABLED=true
```

### Commands

```bash
# Install monitoring dependencies
pnpm --filter @workspace/api-server add @sentry/node
pnpm --filter @workspace/nexus-digital add @sentry/react web-vitals

# Test error tracking
# Trigger an error to verify Sentry integration
# Test performance monitoring
# Verify analytics collection
```

### Output Required

- Error tracking implemented
- Performance monitoring active
- Analytics collecting data
- Health checks comprehensive

---

## Step 7: Environment Configuration

Set up proper environment variable management and configuration.

### Action

Use the `environment-configuration` rule to establish proper config management.

### Configuration Areas

- Development vs production environments
- Secret management
- Database connection strings
- API endpoints and external services
- Feature flags

### Environment Variables

Create comprehensive environment setup:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ydm

# Authentication
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Application
NODE_ENV=development
PORT=23379
BASE_PATH=/
```

### Output Required

- Environment variables documented
- Configuration validation implemented
- Development/production parity
- Secret management established

---

## Step 8: Final Integration Testing

Verify the entire system works end-to-end.

### Comprehensive Testing Checklist

#### Backend Testing
- [ ] All API endpoints functional
- [ ] Authentication flow working
- [ ] Database operations successful
- [ ] Error handling proper
- [ ] Monitoring capturing data

#### Frontend Testing
- [ ] All pages loading data from API
- [ ] Authentication state management working
- [ ] Form submissions successful
- [ ] Loading states and error handling functional
- [ ] Performance metrics within thresholds

#### Integration Testing
- [ ] Full user journeys working
- [ ] Cross-package type safety confirmed
- [ ] Build process successful
- [ ] Deployment configuration verified

### Commands

```bash
# Full typecheck
pnpm run typecheck

# Full build
pnpm run build

# Start all services
pnpm run dev

# Run full test suite
pnpm run test
```

### Output Required

- All systems functional
- Performance metrics collected
- Error tracking verified
- Documentation complete

---

## Step 9: Documentation and README

Update project documentation to reflect the complete setup.

### Documentation to Update

- README.md with setup instructions
- API documentation
- Development workflow guide
- Deployment instructions

### Key Documentation Sections

- Prerequisites and setup
- Development workflow
- API documentation
- Testing procedures
- Deployment process

### Output Required

- Documentation updated and accurate
- Setup instructions tested
- Development guide comprehensive

---

## Step 10: Production Readiness Assessment

Final assessment of production readiness.

### Production Readiness Checklist

#### Security
- [ ] Authentication implemented
- [ ] Input validation on all endpoints
- [ ] Error handling doesn't leak sensitive data
- [ ] CORS properly configured
- [ ] Environment variables secured

#### Performance
- [ ] Database queries optimized
- [ ] Frontend loading times acceptable
- [ ] Core Web Vitals within thresholds
- [ ] Bundle sizes optimized
- [ ] Caching strategies implemented

#### Reliability
- [ ] Error tracking implemented
- [ ] Health checks comprehensive
- [ ] Monitoring and alerting active
- [ ] Backup strategies defined
- [ ] Disaster recovery planned

#### Maintainability
- [ ] Code follows project conventions
- [ ] Documentation comprehensive
- [ ] Testing coverage adequate
- [ ] Type safety enforced
- [ ] Development workflow established

### Output Required

- Production readiness assessment complete
- Any remaining issues identified
- Go/no-go decision for production deployment

---

## Common Setup Issues and Solutions

### Database Connection Issues

- **Problem**: Cannot connect to PostgreSQL
- **Solution**: Verify DATABASE_URL format and database accessibility
- **Check**: `pnpm --filter @workspace/db run push` success

### Authentication Failures

- **Problem**: JWT tokens not working
- **Solution**: Ensure JWT_SECRET is set and consistent
- **Check**: Environment variables in Replit

### Code Generation Issues

- **Problem**: Orval failing to generate hooks
- **Solution**: Validate OpenAPI spec syntax
- **Command**: `pnpm --filter @workspace/api-spec run codegen`

### Frontend Build Issues

- **Problem**: Vite build failing
- **Solution**: Check import paths and TypeScript errors
- **Command**: `pnpm --filter @workspace/nexus-digital run build`

---

## Source-of-Truth Order

When making setup decisions, prioritize in this order:

1. YDM architecture rules and patterns
2. Security best practices
3. Performance requirements
4. Developer experience
5. Documentation completeness

---

## Notes

- This workflow transforms the empty project into a production-ready application
- Each step builds upon the previous ones
- Verify each step completely before proceeding
- Document any deviations from the standard setup
- Test thoroughly before considering setup complete
