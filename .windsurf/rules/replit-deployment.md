---
trigger: always_on
---

# Replit Deployment Rules

This project uses Replit Autoscaling deployment with specific configurations and optimizations. Follow these deployment patterns.

<!-- SECTION: deployment_configuration -->

<deployment_configuration>
- **Platform**: Replit Autoscaling with automatic scaling
- **Runtime**: Node.js 24 with ES modules support
- **Port Mapping**: Internal 23379 → External 80
- **Build Process**: Parallel builds with post-build pnpm store pruning
- **Environment**: Development and production configurations
- **Git Integration**: Automatic deployment on git push with post-merge hooks
- **Agent Configuration**: PNPM_WORKSPACE stack with expertMode enabled
</deployment_configuration>

<!-- ENDSECTION: deployment_configuration -->

<!-- SECTION: replit_configuration -->

<replit_configuration>

**.replit file structure**:
```toml
modules = ["nodejs-24"]

[deployment]
router = "application"
deploymentTarget = "autoscale"

[deployment.postBuild]
args = ["pnpm", "store", "prune"]
env = { "CI" = "true" }

[workflows]
runButton = "Project"

[agent]
stack = "PNPM_WORKSPACE"
expertMode = true

[postMerge]
path = "scripts/post-merge.sh"
timeoutMs = 20000

[[ports]]
localPort = 23379
externalPort = 80
```

**Key Settings**:
- **modules**: Node.js 24 runtime specification
- **deployment.router**: Application routing mode
- **deploymentTarget**: Autoscaling deployment target
- **postBuild**: pnpm store pruning for optimization
- **agent.stack**: PNPM_WORKSPACE for monorepo support
- **expertMode**: Advanced agent features enabled
- **postMerge**: Git hook automation with 20s timeout
- **ports**: Internal 23379 to external 80 mapping

</replit_configuration>

<!-- ENDSECTION: replit_configuration -->

<!-- SECTION: build_optimization -->

<build_optimization>
- **Post-Build Hook**: Automatic pnpm store pruning
- **Bundle Size**: Optimized for fast deployment
- **Parallel Builds**: Libraries build first, then artifacts
- **Source Maps**: Enabled for debugging, hidden in production
- **Asset Optimization**: Images and static assets optimized
- **Dependency Caching**: Leverage pnpm workspace caching
</build_optimization>

<!-- ENDSECTION: build_optimization -->

<!-- SECTION: environment_variables -->

<environment_variables>
- **PORT**: Server port (provided by Replit, validated in Vite config)
- **BASE_PATH**: Frontend base path for routing (required)
- **NODE_ENV**: Environment mode (development/production)
- **REPL_ID**: Replit environment identifier (for conditional plugins)
- **DATABASE_URL**: PostgreSQL connection string
- **LOG_LEVEL**: Logging level (defaults to "info")
</environment_variables>

<!-- ENDSECTION: environment_variables -->

<!-- SECTION: development_plugins -->

<development_plugins>
- **Cartographer**: Workspace mapping tool with root path resolution
- **Dev Banner**: Development environment indicator
- **Runtime Error Modal**: Enhanced error display for debugging
- **Conditional Loading**: Only in development (NODE_ENV !== "production" && REPL_ID !== undefined)
- **Performance**: Excluded from production builds
</development_plugins>

<!-- ENDSECTION: development_plugins -->

<!-- SECTION: git_workflow -->

<git_workflow>
- **Automatic Deployment**: Push to main branch triggers deployment
- **Post-Merge Hook**: Runs scripts/post-merge.sh after git merge
- **Dependency Installation**: Automatic pnpm install --frozen-lockfile
- **Database Push**: Automatic schema changes with pnpm --filter db push
- **Build Validation**: Full workspace typecheck and build
</git_workflow>

<!-- ENDSECTION: git_workflow -->

<!-- SECTION: security_configuration -->

<security_configuration>
- **Supply Chain Protection**: 1440-minute minimum release age
- **Platform Filtering**: Extensive package exclusions
- **Trusted Packages**: @replit/* packages bypass release age
- **Native Modules**: Excluded for security (sharp, bcrypt, etc.)
- **Cloud SDKs**: Excluded by default (AWS, Azure, Google Cloud)
- **Environment Variables**: No hardcoded secrets in code
</security_configuration>

<!-- ENDSECTION: security_configuration -->

<!-- SECTION: performance_optimization -->

<performance_optimization>
- **Autoscaling**: Automatic scale based on traffic patterns
- **Cold Starts**: Optimized for fast startup
- **Bundle Splitting**: Code splitting for faster initial load
- **Static Assets**: Optimized delivery through CDN
- **Database Connections**: Efficient connection pooling
- **Caching**: Built-in caching with TanStack Query
</performance_optimization>

<!-- ENDSECTION: performance_optimization -->

<!-- SECTION: monitoring -->

<monitoring>
- **Health Checks**: /api/healthz endpoint for uptime monitoring
- **Logging**: Structured logging with Pino
- **Error Tracking**: Runtime error modal in development
- **Performance Metrics**: Built-in Replit monitoring
- **Resource Usage**: CPU and memory monitoring
- **Request Tracking**: Request/response logging
</monitoring>

<!-- ENDSECTION: monitoring -->

<!-- SECTION: deployment_commands -->

<deployment_commands>

**Local Development**:
```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/nexus-digital run dev

# Build all packages
pnpm run build

# Type check all packages
pnpm run typecheck
```

**Deployment**:
```bash
# Trigger deployment (automatic on git push)
git push origin main

# Manual rebuild (if needed)
# Replit automatically rebuilds on file changes
```

**Database Operations**:
```bash
# Push schema changes
pnpm --filter @workspace/db run push

# Force push (development only)
pnpm --filter @workspace/db run push-force
```

</deployment_commands>

<!-- ENDSECTION: deployment_commands -->

<!-- SECTION: troubleshooting -->

<troubleshooting>
- **Build Failures**: Check pnpm-workspace.yaml and package.json configurations
- **Port Conflicts**: Replit automatically handles port mapping
- **Dependency Issues**: Run pnpm install --frozen-lockfile
- **Database Connection**: Verify DATABASE_URL environment variable
- **Plugin Errors**: Check conditional plugin loading logic
- **Deployment Stuck**: Check Replit deployment logs
</troubleshooting>

<!-- ENDSECTION: troubleshooting -->

<!-- SECTION: best_practices -->

<best_practices>
- **Environment Variables**: Use Replit environment variables, never hardcode
- **Build Optimization**: Leverage post-build hooks for smaller images
- **Security**: Follow pnpm workspace security policies
- **Monitoring**: Implement health checks and structured logging
- **Performance**: Use autoscaling and caching strategies
- **Development**: Use Replit development tools for optimal experience
</best_practices>

<!-- ENDSECTION: best_practices -->

<!-- SECTION: strict_constraints -->

<strict_constraints>
- **Replit Only**: Use Replit deployment, not Vercel/Netlify
- **Environment Variables**: Use Replit environment variables, not .env files
- **Build System**: Use pnpm workspace builds, not individual builds
- **Security**: Follow pnpm-workspace.yaml security policies
- **Plugins**: Use Replit-specific development plugins conditionally
- **Database**: Use PostgreSQL provided by Replit, not external databases
</strict_constraints>

<!-- ENDSECTION: strict_constraints -->
