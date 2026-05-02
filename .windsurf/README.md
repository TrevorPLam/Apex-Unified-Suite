# Apex Unified Suite - Windsurf Configuration

This directory contains the complete Windsurf customization configuration for the Apex Unified Suite, including skills, rules, and workflows that guide AI-assisted development.

## Overview

The Apex Unified Suite is a comprehensive enterprise SaaS application built with:
- **Frontend**: React 19.1.0 + TypeScript + Vite 7.3.2 + Tailwind CSS v4
- **Backend**: Express 5 + esbuild + PostgreSQL + Drizzle ORM
- **Architecture**: pnpm monorepo with API-first development
- **Deployment**: Replit Autoscaling with Node.js 24

## Configuration Structure

```
.windsurf/
├── README.md                    # This file
├── skills/                      # Multi-step procedures with supporting files
├── rules/                       # Behavioral guidelines and conventions
├── workflows/                   # Manual prompt templates for repeatable tasks
└── WINDSURF_RULES_SKILLS_GUIDE.md # Complete reference documentation
```

---

## 🎯 Skills (15 Available)

Skills are multi-step procedures that Cascade can invoke automatically or manually with `@skill-name`. Each skill includes comprehensive instructions, templates, and supporting files.

### Development Skills

| Skill | Description | Use Case |
|-------|-------------|----------|
| **[@api-business-endpoints](skills/api-business-endpoints/)** | Implement CRUD operations for all 8 business modules with 2026 API standards | Building complete backend API with OpenAPI-first development |
| **[@authentication-implementation](skills/authentication-implementation/)** | Complete JWT-based authentication system with RBAC for Apex Unified Suite | Adding secure auth with refresh tokens, rate limiting, minimal payloads |
| **[@database-schema-development](skills/database-schema-development/)** | Complete Drizzle ORM schema implementation using 2026 best practices | Creating database tables with type-safe enum patterns |
| **[@testing-infrastructure](skills/testing-infrastructure/)** | Complete testing setup with Vitest 2.0, React Testing Library, Playwright 1.45 | Implementing comprehensive test coverage across the suite |

### Frontend Skills

| Skill | Description | Use Case |
|-------|-------------|----------|
| **[@create-react-component](skills/create-react-component/)** | Create React components with TypeScript, Tailwind CSS v4, and shadcn/ui | Building UI components following visual identity and accessibility standards |
| **[@create-layout-component](skills/create-layout-component/)** | Guides creation of layout components including Sidebar, CommandPalette, StatusBar | Creating complex layout components with proper state management |
| **[@create-mock-data](skills/create-mock-data/)** | Create realistic mock data files for the AI command center | Generating placeholder data that matches TypeScript interfaces |

### Workflow Skills

| Skill | Description | Use Case |
|-------|-------------|----------|
| **[@codegen-workflow](skills/codegen-workflow/)** | Complete guide for API-first development using OpenAPI specifications | Setting up type-safe React Query hooks and Zod schemas |
| **[@frontend-api-integration](skills/frontend-api-integration/)** | Replace static mock data with React Query hooks across all 10 business pages | Connecting frontend to real backend APIs |
| **[@monorepo-structure](skills/monorepo-structure/)** | Guide for understanding and working with YDM's pnpm workspace monorepo | Managing the complex monorepo architecture |

### Optimization Skills

| Skill | Description | Use Case |
|-------|-------------|----------|
| **[@performance-optimization](skills/performance-optimization/)** | Optimize bundle size, implement caching strategies, and monitor Core Web Vitals | Improving application performance and user experience |
| **[@security-hardening](skills/security-hardening/)** | Implement 2026 security best practices including headers, rate limiting, OWASP ZAP | Securing the application against modern threats |

### Project-Specific Skills

| Skill | Description | Use Case |
|-------|-------------|----------|
| **[@ydm-api-development](skills/ydm-api-development/)** | Complete guide for implementing API-first development from scratch | Starting new API development in the YDM monorepo |
| **[@ydm-mockup-development](skills/ydm-mockup-development/)** | Guide for developing components in the YDM mockup sandbox with hot reload | Creating and previewing components in isolation |

---

## 📋 Rules (33 Available)

Rules are persistent behavioral guidelines that tell Cascade how to behave. They're automatically applied based on trigger modes.

### Architecture & Development

| Rule | Trigger | Purpose |
|------|---------|---------|
| **[api-first-development](rules/api-first-development.md)** | always_on | Enforce API-first development methodology |
| **[ydm-architecture](rules/ydm-architecture.md)** | always_on | Monorepo architecture and project structure rules |
| **[tech-stack](rules/tech-stack.md)** | always_on | Technology stack guidelines and version management |
| **[pnpm-workspace-patterns](rules/pnpm-workspace-patterns.md)** | always_on | Workspace patterns and dependency management |
| **[typescript-strict-mode](rules/typescript-strict-mode.md)** | always_on | TypeScript strict mode enforcement |

### API & Database

| Rule | Trigger | Purpose |
|------|---------|---------|
| **[api-endpoint-development](rules/api-endpoint-development.md)** | model_decision | Guidelines for API endpoint implementation |
| **[api-endpoint-standards](rules/api-endpoint-standards.md)** | always_on | Comprehensive API standards and conventions |
| **[database-development](rules/database-development.md)** | model_decision | Database operation guidelines |
| **[database-schema-rules](rules/database-schema-rules.md)** | always_on | Schema design and migration rules |

### Frontend & UI

| Rule | Trigger | Purpose |
|------|---------|---------|
| **[component-development](rules/component-development.md)** | model_decision | React component development standards |
| **[visual-identity](rules/visual-identity.md)** | always_on | Design system constants and visual identity |
| **[design-tokens](rules/design-tokens.md)** | always_on | CSS custom properties and theming |
| **[bento-grid-layout](rules/bento-grid-layout.md)** | model_decision | Bento grid layout patterns and usage |
| **[frontend-api-integration](rules/frontend-api-integration.md)** | model_decision | Frontend API integration patterns |

### Motion & Animation

| Rule | Trigger | Purpose |
|------|---------|---------|
| **[motion-library](rules/motion-library.md)** | always_on | Framer Motion usage and patterns |
| **[motion-hierarchy](rules/motion-hierarchy.md)** | always_on | Animation hierarchy and categorization |
| **[motion-preference](rules/motion-preference.md)** | always_on | Motion preference and accessibility |
| **[css-property-animations](rules/css-property-animations.md)** | model_decision | CSS @property animated gradient borders |

### Performance & Accessibility

| Rule | Trigger | Purpose |
|------|---------|---------|
| **[performance](rules/performance.md)** | always_on | Performance optimization guidelines |
| **[core-web-vitals-inp](rules/core-web-vitals-inp.md)** | model_decision | INP (Interaction to Next Paint) optimization |
| **[accessibility](rules/accessibility.md)** | always_on | WCAG 2.2 AA accessibility requirements |
| **[focus-restoration](rules/focus-restoration.md)** | always_on | Focus management for accessibility |

### Security & Quality

| Rule | Trigger | Purpose |
|------|---------|---------|
| **[security-standards](rules/security-standards.md)** | always_on | Security requirements and validation checkpoints |
| **[testing-requirements](rules/testing-requirements.md)** | always_on | Comprehensive testing requirements |
| **[dependency-management](rules/dependency-management.md)** | always_on | Dependency management and security |

### Configuration & Deployment

| Rule | Trigger | Purpose |
|------|---------|---------|
| **[replit-deployment](rules/replit-deployment.md)** | always_on | Replit Autoscaling deployment configuration |
| **[vite-config](rules/vite-config.md)** | always_on | Vite configuration patterns and optimization |
| **[wouter-routing](rules/wouter-routing.md)** | always_on | Wouter routing patterns and usage |

### Markdown & Content

| Rule | Trigger | Purpose |
|------|---------|---------|
| **[markdown-block-editing](rules/markdown-block-editing.md)** | glob `*.md` | Prevent structural damage in markdown files |
| **[markdown-fence-avoidance](rules/markdown-fence-avoidance.md)** | glob `*.md` | Prevent code fence collisions |
| **[markdown-link-style](rules/markdown-link-style.md)** | glob `*.md` | Link style conventions |
| **[markdown-whitespace-preservation](rules/markdown-whitespace-preservation.md)** | glob `*.md` | Preserve whitespace and formatting |
| **[keyboard-shortcuts](rules/keyboard-shortcuts.md)** | model_decision | Display keyboard shortcuts properly |

---

## 🔄 Workflows (4 Available)

Workflows are manual-only prompt templates for repeatable tasks. Invoke them with `/workflow-name`.

| Workflow | Description | Use Case |
|----------|-------------|----------|
| **[/ydm-development](workflows/ydm-development.md)** | Complete YDM development workflow from API changes to frontend integration | End-to-end feature development with type safety |
| **[/ydm-setup](workflows/ydm-setup.md)** | Complete YDM project setup from empty state to fully functional development environment | Initial project bootstrap and configuration |
| **[/process-todo-task](workflows/process-todo-task.md)** | Work through a single TODO.md task following the structured 10-step sequence | Processing individual tasks with production-quality changes |
| **[/tasks](workflows/tasks.md)** | Execute the first active parent task from TASKS.md with PowerShell-optimized execution | Systematic task completion with quality assessment |

---

## 🚀 Quick Start

### For Development Tasks

1. **API Development**: Use `/ydm-development` for complete end-to-end feature development
2. **Component Creation**: Use `@create-react-component` for UI components
3. **Database Changes**: Use `@database-schema-development` for schema updates
4. **Testing Setup**: Use `@testing-infrastructure` for comprehensive test implementation

### For Project Setup

1. **New Project**: Use `/ydm-setup` to bootstrap the entire development environment
2. **Authentication**: Use `@authentication-implementation` for complete auth system
3. **Security**: Use `@security-hardening` for security best practices

### For Maintenance

1. **Performance**: Use `@performance-optimization` for optimization tasks
2. **Bug Fixes**: Rules automatically guide proper debugging approaches
3. **Documentation**: Follow markdown rules for consistent documentation

---

## 📚 Key Principles

### API-First Development
- All features start with OpenAPI specification in `lib/api-spec/openapi.yaml`
- Code generation creates React Query hooks and Zod schemas
- End-to-end type safety from database to frontend

### Monorepo Architecture
- pnpm workspaces with centralized dependency management
- Libraries build first, then applications in parallel
- Cross-package type references and shared configurations

### Security & Performance
- 1440-minute minimum release age for dependencies
- Comprehensive security headers and validation
- Core Web Vitals optimization and monitoring

### Accessibility Standards
- WCAG 2.2 AA compliance throughout
- Semantic HTML and ARIA landmarks
- Keyboard navigation and focus management

---

## 🔧 Invocation Patterns

### Automatic Invocation
- Skills are invoked automatically when their description matches your request
- Rules with `always_on` trigger are always active
- Rules with `model_decision` trigger are loaded when relevant

### Manual Invocation
- **Skills**: Use `@skill-name` (e.g., `@create-react-component`)
- **Workflows**: Use `/workflow-name` (e.g., `/ydm-development`)
- **Rules**: Use `@rule-name` for manual rules

### Example Commands
```
@create-react-component
@testing-infrastructure
/ydm-development
@performance-optimization
```

---

## 📖 Additional Documentation

- **[Complete Reference](WINDSURF_RULES_SKILLS_GUIDE.md)**: Comprehensive guide to all Windsurf customization features
- **[Project Architecture](rules/ydm-architecture.md)**: Deep dive into monorepo structure
- **[API Standards](rules/api-endpoint-standards.md)**: Detailed API development guidelines
- **[Security Requirements](rules/security-standards.md)**: Security implementation checklist

---

## 🏗️ Project Status

### ✅ Completed
- Frontend marketing website with React 19 + Tailwind CSS v4
- Basic Express API with health check endpoint
- Drizzle ORM configuration (no schemas yet)
- OpenAPI spec with minimal endpoints
- Replit deployment configuration

### 🚧 In Progress
- Database schema implementation
- Business API endpoints (80-120 endpoints needed)
- Frontend API integration
- Authentication system
- Testing infrastructure

### 📋 Priority Areas
1. Database schema development
2. API business endpoints implementation
3. Frontend integration with real APIs
4. Authentication and authorization
5. Comprehensive testing setup
6. Performance optimization
7. Security hardening

---

*This configuration is continuously updated as the Apex Unified Suite evolves. Last updated: 2026-05-02*
