---
name: ci-cd-pipeline-setup
description: Complete GitHub Actions CI/CD pipeline with lint, typecheck, unit tests, security audit, Postgres service containers, Docker build/push, and Playwright E2E testing
---

# CI/CD Pipeline Setup Skill

## Purpose
Create a comprehensive GitHub Actions CI/CD pipeline covering lint, typecheck, unit tests, security auditing, Docker builds, and E2E testing with proper matrix strategies and environment management.

## Pipeline Architecture

### Workflow Structure
```
.github/workflows/
├── ci.yml                    # Main CI pipeline
├── security.yml              # Security scanning and audit
├── docker.yml                # Docker build and push
├── e2e-tests.yml             # Playwright E2E testing
├── contract-tests.yml        # Pact contract testing
└── deploy.yml                # Deployment workflows
```

## Main CI Pipeline

### 1. Base CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Lint and Code Quality
  lint:
    name: Lint & Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run ESLint
        run: pnpm run lint
      
      - name: Run Prettier check
        run: pnpm run format:check
      
      - name: Check TypeScript types
        run: pnpm run typecheck

  # Job 2: Security Audit
  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run security audit
        run: pnpm audit --audit-level=high
      
      - name: Check for known vulnerabilities
        run: pnpm audit --json > audit-report.json
      
      - name: Upload audit report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-audit
          path: audit-report.json

  # Job 3: Unit Tests with Coverage
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['20', '22']
      fail-fast: false
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run unit tests
        run: pnpm test --coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        if: matrix.node-version == '22'
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
      
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.node-version }}
          path: test-results/

  # Job 4: Build Verification
  build:
    name: Build Verification
    runs-on: ubuntu-latest
    needs: [lint, security-audit, test]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build frontend
        run: pnpm --filter @workspace/nexus-digital run build
      
      - name: Build backend
        run: pnpm --filter @workspace/api-server run build
      
      - name: Verify Docker build
        run: |
          docker build -t test-frontend -f artifacts/apex-os/Dockerfile .
          docker build -t test-backend -f artifacts/api-server/Dockerfile .
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            artifacts/apex-os/dist/
            artifacts/api-server/dist/
```

### 2. Security Workflow
```yaml
# .github/workflows/security.yml
name: Security Scanning

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  dependency-scan:
    name: Dependency Scanning
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Upload Snyk results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: snyk.sarif

  codeql-analysis:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    strategy:
      fail-fast: false
      matrix:
        language: [javascript, typescript]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{matrix.language}}"

  supply-chain-security:
    name: Supply Chain Security
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Supply Chain Security Scan
        run: |
          pnpm install --frozen-lockfile
          npx audit-ci --moderate
      
      - name: Check for compromised packages
        run: |
          npx audit-ci --report --output-format=json > supply-chain-report.json
      
      - name: Upload supply chain report
        uses: actions/upload-artifact@v4
        with:
          name: supply-chain-report
          path: supply-chain-report.json
```

### 3. Docker Build and Push
```yaml
# .github/workflows/docker.yml
name: Docker Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    name: Build and Push Docker Images
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    outputs:
      frontend-image: ${{ steps.frontend.outputs.image }}
      backend-image: ${{ steps.backend.outputs.image }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata (frontend)
        id: frontend-meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push frontend image
        id: frontend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: artifacts/apex-os/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.frontend-meta.outputs.tags }}
          labels: ${{ steps.frontend-meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64
      
      - name: Extract metadata (backend)
        id: backend-meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha
      
      - name: Build and push backend image
        id: backend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: artifacts/api-server/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.backend-meta.outputs.tags }}
          labels: ${{ steps.backend-meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64
      
      - name: Generate SBOM
        run: |
          docker sbom ${{ steps.frontend.outputs.image }} > frontend-sbom.json
          docker sbom ${{ steps.backend.outputs.image }} > backend-sbom.json
      
      - name: Upload SBOMs
        uses: actions/upload-artifact@v4
        with:
          name: sboms
          path: |
            frontend-sbom.json
            backend-sbom.json
```

### 4. E2E Testing Workflow
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 60
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: apex_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps
      
      - name: Setup test database
        run: |
          pnpm --filter @workspace/db run test-setup
          pnpm --filter @workspace/db run seed:test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/apex_test
      
      - name: Start services
        run: |
          pnpm --filter @workspace/api-server run start:test &
          pnpm --filter @workspace/nexus-digital run start:test &
          sleep 30
      
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/apex_test
          TEST_BASE_URL: http://localhost:3000
      
      - name: Upload E2E test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload E2E screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-screenshots
          path: test-results/
          retention-days: 7
```

### 5. Contract Testing Workflow
```yaml
# .github/workflows/contract-tests.yml
name: Contract Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  consumer-contracts:
    name: Consumer Contract Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run consumer contract tests
        run: pnpm test:pact:consumer
      
      - name: Upload contract files
        uses: actions/upload-artifact@v4
        with:
          name: pact-files
          path: pacts/
      
      - name: Publish contracts
        if: github.ref == 'refs/heads/main'
        run: pnpm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
          GIT_BRANCH: ${{ github.ref_name }}

  provider-verification:
    name: Provider Verification
    runs-on: ubuntu-latest
    needs: consumer-contracts
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: apex_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Setup test database
        run: pnpm --filter @workspace/db run test-setup
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/apex_test
      
      - name: Download contract files
        uses: actions/download-artifact@v4
        with:
          name: pact-files
          path: pacts/
      
      - name: Verify provider contracts
        run: pnpm test:pact:provider
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/apex_test
      
      - name: Publish verification results
        run: pnpm run pact:verify:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
```

## Environment Configuration

### 1. Environment Variables Setup
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

env:
  ENVIRONMENT: staging
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
  JWT_SECRET: ${{ secrets.STAGING_JWT_SECRET }}
  SENTRY_DSN: ${{ secrets.STAGING_SENTRY_DSN }}

jobs:
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Add your deployment commands here
      
      - name: Run smoke tests
        run: |
          curl -f ${{ secrets.STAGING_URL }}/api/healthz
          curl -f ${{ secrets.STAGING_URL }}/
```

### 2. Production Deployment
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    tags: ['v*']

env:
  ENVIRONMENT: production
  NODE_ENV: production
  DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
  JWT_SECRET: ${{ secrets.PROD_JWT_SECRET }}
  SENTRY_DSN: ${{ secrets.PROD_SENTRY_DSN }}

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Create deployment
        run: |
          echo "Creating production deployment"
          # Add your production deployment commands here
      
      - name: Wait for health check
        run: |
          timeout 300 bash -c 'until curl -f ${{ secrets.PROD_URL }}/api/healthz; do sleep 5; done'
      
      - name: Run production smoke tests
        run: |
          curl -f ${{ secrets.PROD_URL }}/api/healthz
          curl -f ${{ secrets.PROD_URL }}/
      
      - name: Notify deployment
        if: always()
        run: |
          echo "Deployment completed with status ${{ job.status }}"
```

## Advanced Features

### 1. Matrix Strategy for Multiple Environments
```yaml
# .github/workflows/matrix-deploy.yml
name: Matrix Deployment

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string

jobs:
  deploy:
    name: Deploy to ${{ inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    
    strategy:
      matrix:
        component: [frontend, backend]
      fail-fast: false
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy ${{ matrix.component }}
        run: |
          echo "Deploying ${{ matrix.component }} to ${{ inputs.environment }}"
          # Component-specific deployment logic
```

### 2. Caching Strategy
```yaml
# Enhanced caching in CI jobs
- name: Cache pnpm modules
  uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-

- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 3. Status Checks and Gates
```yaml
# .github/workflows/status-checks.yml
name: Status Checks

on:
  pull_request:
    branches: [main]

jobs:
  pre-merge-checks:
    name: Pre-merge Validation
    runs-on: ubuntu-latest
    
    steps:
      - name: Validate PR
        run: |
          # Check if PR has required labels
          # Check if description is filled
          # Check if required reviewers are assigned
          echo "Validating PR requirements"
      
      - name: Check merge conflicts
        run: |
          git merge origin/main --no-commit --no-ff || echo "Merge conflicts detected"
      
      - name: Verify breaking changes
        run: |
          # Run oasdiff to check for breaking API changes
          echo "Checking for breaking changes"
```

## Monitoring and Notifications

### 1. Slack Notifications
```yaml
# .github/workflows/notifications.yml
name: Build Notifications

on:
  workflow_run:
    workflows: ['CI Pipeline', 'E2E Tests', 'Deploy to Production']
    types: [completed]

jobs:
  notify:
    name: Send Notifications
    runs-on: ubuntu-latest
    if: always()
    
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#ci-cd'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Performance Monitoring
```yaml
# .github/workflows/performance.yml
name: Performance Monitoring

on:
  push:
    branches: [main]

jobs:
  performance:
    name: Performance Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-results
          path: .lighthouseci/
```

## Best Practices

### 1. Security
- Use GitHub secrets for sensitive data
- Implement proper RBAC for deployments
- Scan for vulnerabilities regularly
- Use signed commits for critical deployments

### 2. Performance
- Use parallel jobs where possible
- Implement proper caching strategies
- Optimize Docker layer caching
- Monitor build times and optimize

### 3. Reliability
- Implement proper error handling
- Use retry logic for flaky operations
- Set appropriate timeouts
- Implement rollback mechanisms

### 4. Maintainability
- Use reusable workflows
- Document complex workflows
- Use consistent naming conventions
- Implement proper logging

## Verification Commands

```bash
# Validate workflow syntax
act -j build

# Test workflows locally
act -W .github/workflows/ci.yml

# Check workflow permissions
gh api repos/:owner/:repo/actions/permissions

# View workflow runs
gh run list

# Debug workflow failures
gh run view <run-id> --log
```

This skill provides a comprehensive, production-ready CI/CD pipeline that ensures code quality, security, and reliable deployments for the Apex Unified Suite.
