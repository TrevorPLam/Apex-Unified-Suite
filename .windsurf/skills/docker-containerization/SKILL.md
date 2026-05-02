---
name: docker-containerization
description: Multi-stage Docker containerization with Node.js 24, Nginx for frontend, health checks, pre-start migrations, and docker-compose for local development
---

# Docker Containerization Skill

## Purpose
Create production-ready multi-stage Docker containers for both frontend (React + Nginx) and backend (Node.js) with health checks, proper optimization, and local development setup.

## Architecture Overview

### Container Strategy
- **Frontend**: Multi-stage build with Node.js build stage + Nginx serving stage
- **Backend**: Node.js 24 with pre-start database migrations
- **Development**: Docker Compose with hot reload and database services
- **Health Checks**: Comprehensive health monitoring for all services

## Frontend Dockerfile

### Multi-stage React + Nginx Build
```dockerfile
# artifacts/apex-os/Dockerfile
# Stage 1: Build the React application
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./
COPY artifacts/apex-os/package*.json artifacts/apex-os/pnpm-lock.yaml artifacts/apex-os/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY artifacts/apex-os/ ./artifacts/apex-os/
COPY lib/ ./lib/

# Build the application
RUN pnpm --filter @workspace/nexus-digital run build

# Stage 2: Production Nginx server
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY artifacts/apex-os/nginx.conf /etc/nginx/nginx.conf
COPY artifacts/apex-os/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/artifacts/apex-os/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
# artifacts/apex-os/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    include /etc/nginx/conf.d/*.conf;
}
```

```nginx
# artifacts/apex-os/default.conf
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # No cache for HTML files
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass http://backend:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /healthz {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Security
    location ~ /\. {
        deny all;
    }
}
```

## Backend Dockerfile

### Node.js Production Container
```dockerfile
# artifacts/api-server/Dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./
COPY artifacts/api-server/package*.json artifacts/api-server/pnpm-lock.yaml artifacts/api-server/
COPY lib/ package*.json lib/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/lib/node_modules ./lib/node_modules

# Copy source code
COPY artifacts/api-server/ ./artifacts/api-server/
COPY lib/ ./lib/

# Build TypeScript
RUN pnpm --filter @workspace/api-server run build

# Stage 3: Production
FROM node:22-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache curl dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./
COPY artifacts/api-server/package*.json artifacts/api-server/pnpm-lock.yaml artifacts/api-server/
COPY lib/ package*.json lib/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/artifacts/api-server/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/lib/dist ./lib/dist

# Copy configuration files
COPY --chown=nodejs:nodejs artifacts/api-server/drizzle.config.ts ./
COPY --chown=nodejs:nodejs lib/db/drizzle.config.ts ./lib/db/

# Set permissions
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8081/api/healthz || exit 1

# Use dumb-init as PID 1
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
```

## Docker Compose Configuration

### Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: apex-postgres-dev
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: apex_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for caching
  redis:
    image: redis:7-alpine
    container_name: apex-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # Backend API Server
  api-server:
    build:
      context: .
      dockerfile: artifacts/api-server/Dockerfile
      target: deps
    container_name: apex-api-dev
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/apex_dev
      REDIS_URL: redis://redis:6379
      PORT: 8081
      JWT_SECRET: dev-secret
    ports:
      - "8081:8081"
    volumes:
      - ./artifacts/api-server/src:/app/artifacts/api-server/src
      - ./lib:/app/lib
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: ["pnpm", "--filter", "@workspace/api-server", "run", "dev"]

  # Frontend Development Server
  frontend:
    build:
      context: .
      dockerfile: artifacts/apex-os/Dockerfile.dev
    container_name: apex-frontend-dev
    environment:
      NODE_ENV: development
      VITE_API_URL: http://localhost:8081
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./artifacts/apex-os/src:/app/artifacts/apex-os/src
      - ./lib:/app/lib
      - /app/node_modules
    depends_on:
      - api-server
    command: ["pnpm", "--filter", "@workspace/nexus-digital", "run", "dev"]

  # MailHog for email testing
  mailhog:
    image: mailhog/mailhog
    container_name: apex-mailhog-dev
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: apex-dev-network
```

### Production Environment
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: apex-postgres-prod
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis for caching
  redis:
    image: redis:7-alpine
    container_name: apex-redis-prod
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3
    restart: unless-stopped

  # Backend API Server
  api-server:
    build:
      context: .
      dockerfile: artifacts/api-server/Dockerfile
      target: production
    container_name: apex-api-prod
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://redis:6379
      PORT: 8081
      JWT_SECRET: ${JWT_SECRET}
      SENTRY_DSN: ${SENTRY_DSN}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/api/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

  # Frontend Nginx Server
  frontend:
    build:
      context: .
      dockerfile: artifacts/apex-os/Dockerfile
      target: production
    container_name: apex-frontend-prod
    ports:
      - "80:8080"
      - "443:8443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - api-server
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s

  # Nginx Load Balancer (optional)
  nginx-lb:
    image: nginx:alpine
    container_name: apex-nginx-lb
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx-lb.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: apex-prod-network
```

## Development Dockerfile

### Frontend Development Container
```dockerfile
# artifacts/apex-os/Dockerfile.dev
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json pnpm-lock.yaml ./
COPY artifacts/apex-os/package*.json artifacts/apex-os/pnpm-lock.yaml artifacts/apex-os/
COPY lib/ package*.json lib/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY artifacts/apex-os/ ./artifacts/apex-os/
COPY lib/ ./lib/

# Expose port
EXPOSE 3000

# Start development server
CMD ["pnpm", "--filter", "@workspace/nexus-digital", "run", "dev", "--", "--host", "0.0.0.0"]
```

## Database Migration Setup

### Migration Scripts
```bash
#!/bin/bash
# scripts/migrate.sh

set -e

echo "Running database migrations..."

# Wait for database to be ready
until pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER"; do
  echo "Waiting for database..."
  sleep 2
done

# Run migrations
pnpm --filter @workspace/db run push

echo "Migrations completed!"
```

### Pre-start Hook
```typescript
// artifacts/api-server/src/hooks/pre-start.ts
import { migrate } from 'drizzle-orm/node-postgres';
import { db } from '@workspace/db';

export async function preStart() {
  try {
    console.log('Running pre-start checks...');
    
    // Check database connection
    await db.execute(sql`SELECT 1`);
    console.log('Database connection OK');
    
    // Run migrations if needed
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database migrations OK');
    
    // Check Redis connection
    // await checkRedisConnection();
    console.log('Redis connection OK');
    
    console.log('Pre-start checks completed successfully');
  } catch (error) {
    console.error('Pre-start checks failed:', error);
    process.exit(1);
  }
}
```

## Health Check Implementation

### Backend Health Endpoint
```typescript
// artifacts/api-server/src/routes/health.ts
import { Router } from 'express';
import { db } from '@workspace/db';
import { redis } from '../lib/redis';

const router = Router();

router.get('/healthz', async (req, res) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: 'unknown',
    },
  };

  try {
    // Database health check
    await db.execute(sql`SELECT 1`);
    checks.checks.database = 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'unhealthy';
  }

  try {
    // Redis health check
    await redis.ping();
    checks.checks.redis = 'healthy';
  } catch (error) {
    checks.checks.redis = 'unhealthy';
    checks.status = 'unhealthy';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
  };

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

router.get('/readyz', async (req, res) => {
  // Readiness probe - check if all dependencies are ready
  const ready = await checkReadiness();
  
  if (ready) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

async function checkReadiness(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export default router;
```

## Environment Configuration

### .env Files
```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apex_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-change-me
SENTRY_DSN=
PORT=8081

# Frontend
VITE_API_URL=http://localhost:8081
VITE_ENV=development
```

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/apex_prod
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key
SENTRY_DSN=https://your-sentry-dsn
PORT=8081

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_ENV=production
```

## Utility Scripts

### Development Start Script
```bash
#!/bin/bash
# scripts/dev-start.sh

set -e

echo "Starting development environment..."

# Start database and Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Run database migrations
./scripts/migrate.sh

# Start application services
docker-compose -f docker-compose.dev.yml up api-server frontend

echo "Development environment started!"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:8081"
echo "MailHog: http://localhost:8025"
```

### Production Deploy Script
```bash
#!/bin/bash
# scripts/deploy-prod.sh

set -e

echo "Deploying to production..."

# Build and push images
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml push

# Deploy to production servers
# Add your deployment commands here

echo "Production deployment completed!"
```

## Best Practices

### 1. Security
- Use non-root users in containers
- Multi-stage builds to minimize attack surface
- Don't include development dependencies in production
- Use .dockerignore to exclude sensitive files

### 2. Performance
- Use .dockerignore to reduce build context
- Leverage layer caching effectively
- Optimize Nginx configuration for production
- Implement proper health checks

### 3. Reliability
- Implement proper health checks
- Use restart policies for containers
- Handle graceful shutdowns
- Implement proper logging

### 4. Maintainability
- Use environment-specific configurations
- Document container purposes and dependencies
- Use consistent naming conventions
- Implement proper volume management

## Verification Commands

```bash
# Build development containers
docker-compose -f docker-compose.dev.yml build

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Check container health
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f api-server

# Test health endpoints
curl http://localhost:8081/api/healthz
curl http://localhost:3000/healthz

# Build production images
docker-compose -f docker-compose.prod.yml build

# Test production deployment
docker-compose -f docker-compose.prod.yml up -d
```

This skill provides comprehensive Docker containerization with production-ready configurations, proper health monitoring, and development workflows for the Apex Unified Suite.
