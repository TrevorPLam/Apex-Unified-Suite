---
name: background-job-runner
description: Implement scheduled job management system with health checks for expired magic-link cleanup, overdue invoice marking, sent email retries, and other periodic tasks.
---

# Background Job Runner Implementation

## Overview

This skill guides the implementation of a robust background job scheduler that handles periodic maintenance tasks like cleanup operations, status updates, and retry logic with comprehensive health monitoring and error handling.

## Core Architecture

### 1. Database Schema for Job Management

#### Scheduled Jobs Table
```sql
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  job_name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL, -- 'cleanup', 'notification', 'status_update', 'retry'
  schedule_expression VARCHAR(100) NOT NULL, -- Cron expression
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  timeout_seconds INTEGER DEFAULT 300,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_scheduled_jobs_name ON scheduled_jobs(job_name);
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at, is_active);
CREATE INDEX idx_scheduled_jobs_tenant ON scheduled_jobs(tenant_id);
```

#### Job Executions Table
```sql
CREATE TABLE job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  execution_id VARCHAR(100) NOT NULL UNIQUE, -- UUID for tracking
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_job_executions_job ON job_executions(job_id);
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_started ON job_executions(started_at);
```

### 2. Job Runner Service

```typescript
// src/services/BackgroundJobRunner.ts
import { Database } from 'drizzle-orm';
import { scheduledJobs, jobExecutions } from '../db/schema';
import { eq, and, lte, sql, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { JobExecutionError, JobTimeoutError } from '../domain/errors';

export interface JobDefinition {
  name: string;
  type: 'cleanup' | 'notification' | 'status_update' | 'retry';
  schedule: string; // Cron expression
  handler: (context: JobContext) => Promise<JobResult>;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  metadata?: Record<string, any>;
}

export interface JobContext {
  tenantId?: string;
  executionId: string;
  jobName: string;
  runCount: number;
  metadata?: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  message?: string;
  data?: any;
  nextRunDelay?: number; // For retry logic
}

export class BackgroundJobRunner {
  private jobs = new Map<string, JobDefinition>();
  private isRunning = false;
  private cronJobs = new Map<string, NodeJS.Timeout>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    private db: Database,
    private logger: Logger
  ) {}

  /**
   * Register a new job
   */
  async registerJob(job: JobDefinition, tenantId?: string): Promise<void> {
    // Store in memory
    const key = tenantId ? `${tenantId}:${job.name}` : job.name;
    this.jobs.set(key, job);

    // Persist to database
    const existingJob = await this.db
      .select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.job_name, job.name))
      .limit(1);

    if (existingJob.length === 0) {
      await this.db.insert(scheduledJobs).values({
        tenantId: tenantId || null,
        jobName: job.name,
        jobType: job.type,
        scheduleExpression: job.schedule,
        timeoutSeconds: job.timeout || 300,
        maxRetries: job.maxRetries || 3,
        retryDelaySeconds: job.retryDelay || 60,
        metadata: job.metadata || {},
        nextRunAt: this.getNextRunTime(job.schedule)
      });
    }

    this.logger.info(`Job registered: ${job.name}`);
  }

  /**
   * Start the job runner
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Job runner is already running');
      return;
    }

    this.isRunning = true;

    // Load existing jobs from database
    await this.loadJobsFromDatabase();

    // Schedule all active jobs
    await this.scheduleAllJobs();

    // Start health check monitoring
    this.startHealthChecks();

    this.logger.info('Background job runner started');
  }

  /**
   * Stop the job runner
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear all cron jobs
    for (const [jobName, timeout] of this.cronJobs) {
      clearTimeout(timeout);
    }
    this.cronJobs.clear();

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.logger.info('Background job runner stopped');
  }

  /**
   * Execute a job manually
   */
  async executeJob(
    jobName: string,
    tenantId?: string,
    context?: Partial<JobContext>
  ): Promise<JobResult> {
    const key = tenantId ? `${tenantId}:${jobName}` : jobName;
    const job = this.jobs.get(key);

    if (!job) {
      throw new JobExecutionError(`Job not found: ${jobName}`);
    }

    const executionId = randomUUID();
    const jobContext: JobContext = {
      tenantId,
      executionId,
      jobName,
      runCount: 0,
      metadata: context?.metadata
    };

    return await this.executeJobWithTracking(job, jobContext);
  }

  /**
   * Get job execution history
   */
  async getJobHistory(
    jobName: string,
    tenantId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<JobExecutionRecord[]> {
    const query = this.db
      .select({
        id: jobExecutions.id,
        executionId: jobExecutions.execution_id,
        status: jobExecutions.status,
        startedAt: jobExecutions.started_at,
        completedAt: jobExecutions.completed_at,
        durationMs: jobExecutions.duration_ms,
        errorMessage: jobExecutions.error_message,
        retryCount: jobExecutions.retry_count
      })
      .from(jobExecutions)
      .innerJoin(scheduledJobs, eq(jobExecutions.job_id, scheduledJobs.id))
      .where(eq(scheduledJobs.job_name, jobName))
      .orderBy(desc(jobExecutions.started_at))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  /**
   * Get job health status
   */
  async getJobHealth(): Promise<JobHealthStatus[]> {
    const jobs = await this.db
      .select({
        jobName: scheduledJobs.job_name,
        jobType: scheduledJobs.job_type,
        isActive: scheduledJobs.is_active,
        lastRunAt: scheduledJobs.last_run_at,
        nextRunAt: scheduled_jobs.next_run_at,
        runCount: scheduledJobs.run_count,
        successCount: scheduledJobs.success_count,
        failureCount: scheduledJobs.failure_count,
        lastError: scheduledJobs.last_error,
        lastErrorAt: scheduledJobs.last_error_at
      })
      .from(scheduledJobs)
      .orderBy(scheduledJobs.job_name);

    return jobs.map(job => ({
      jobName: job.jobName,
      jobType: job.jobType,
      isActive: job.isActive,
      lastRunAt: job.lastRunAt,
      nextRunAt: job.nextRunAt,
      runCount: job.runCount,
      successCount: job.successCount,
      failureCount: job.failureCount,
      successRate: job.runCount > 0 ? (job.success_count / job.runCount) * 100 : 0,
      lastError: job.lastError,
      lastErrorAt: job.lastErrorAt,
      isHealthy: this.isJobHealthy(job)
    }));
  }

  /**
   * Execute job with tracking and error handling
   */
  private async executeJobWithTracking(
    job: JobDefinition,
    context: JobContext
  ): Promise<JobResult> {
    const startTime = Date.now();
    let executionRecord: any;

    try {
      // Create execution record
      executionRecord = await this.db.insert(jobExecutions).values({
        jobId: await this.getJobId(job.name),
        executionId: context.executionId,
        status: 'running',
        startedAt: new Date()
      }).returning();

      // Execute job with timeout
      const result = await this.executeWithTimeout(
        () => job.handler(context),
        job.timeout || 300000 // 5 minutes default
      );

      const duration = Date.now() - startTime;

      // Update execution record
      await this.db.update(jobExecutions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          durationMs: duration,
          result: result.data || null
        })
        .where(eq(jobExecutions.id, executionRecord[0].id));

      // Update job statistics
      await this.updateJobStats(job.name, true, null);

      this.logger.info(`Job completed successfully: ${job.name}`, {
        executionId: context.executionId,
        duration
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Update execution record
      if (executionRecord) {
        await this.db.update(jobExecutions)
          .set({
            status: error instanceof JobTimeoutError ? 'timeout' : 'failed',
            completedAt: new Date(),
            durationMs: duration,
            errorMessage,
            errorStack
          })
          .where(eq(jobExecutions.id, executionRecord[0].id));
      }

      // Update job statistics
      await this.updateJobStats(job.name, false, errorMessage);

      this.logger.error(`Job failed: ${job.name}`, {
        executionId: context.executionId,
        error: errorMessage,
        duration
      });

      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new JobTimeoutError(`Job timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Load jobs from database
   */
  private async loadJobsFromDatabase(): Promise<void> {
    const jobs = await this.db
      .select()
      .from(scheduledJobs)
      .where(eq(scheduledJobs.is_active, true));

    for (const jobRecord of jobs) {
      // Jobs should be registered via registerJob() method
      // This just ensures they're tracked in memory
      const key = jobRecord.tenant_id ? `${jobRecord.tenant_id}:${jobRecord.job_name}` : jobRecord.job_name;
      if (!this.jobs.has(key)) {
        this.logger.warn(`Job found in database but not registered: ${jobRecord.job_name}`);
      }
    }
  }

  /**
   * Schedule all active jobs
   */
  private async scheduleAllJobs(): Promise<void> {
    const jobs = await this.db
      .select()
      .from(scheduledJobs)
      .where(and(
        eq(scheduledJobs.is_active, true),
        sql`${scheduledJobs.next_run_at} <= now()`
      ));

    for (const jobRecord of jobs) {
      this.scheduleJob(jobRecord);
    }
  }

  /**
   * Schedule a single job
   */
  private scheduleJob(jobRecord: any): void {
    const key = jobRecord.tenant_id ? `${jobRecord.tenant_id}:${jobRecord.job_name}` : jobRecord.job_name;
    const job = this.jobs.get(key);

    if (!job) {
      this.logger.warn(`Cannot schedule unregistered job: ${jobRecord.job_name}`);
      return;
    }

    const delay = jobRecord.next_run_at.getTime() - Date.now();
    
    if (delay <= 0) {
      // Job should run now
      this.runJob(jobRecord);
    } else {
      // Schedule for future execution
      const timeout = setTimeout(() => {
        this.runJob(jobRecord);
      }, delay);

      this.cronJobs.set(key, timeout);
    }
  }

  /**
   * Run a job and reschedule it
   */
  private async runJob(jobRecord: any): Promise<void> {
    const key = jobRecord.tenant_id ? `${jobRecord.tenant_id}:${jobRecord.job_name}` : jobRecord.job_name;
    
    try {
      const job = this.jobs.get(key);
      if (!job) {
        this.logger.error(`Job not found for execution: ${jobRecord.job_name}`);
        return;
      }

      const context: JobContext = {
        tenantId: jobRecord.tenant_id || undefined,
        executionId: randomUUID(),
        jobName: jobRecord.job_name,
        runCount: jobRecord.run_count + 1,
        metadata: jobRecord.metadata
      };

      await this.executeJobWithTracking(job, context);

      // Update next run time
      const nextRunTime = this.getNextRunTime(jobRecord.schedule_expression);
      await this.db.update(scheduledJobs)
        .set({
          lastRunAt: new Date(),
          nextRunAt: nextRunTime,
          runCount: sql`${scheduledJobs.run_count} + 1`
        })
        .where(eq(scheduledJobs.id, jobRecord.id));

      // Reschedule next run
      this.scheduleJob({ ...jobRecord, next_run_at: nextRunTime });

    } catch (error) {
      this.logger.error(`Job execution failed: ${jobRecord.job_name}`, { error });

      // Handle retry logic
      const retryCount = jobRecord.failure_count + 1;
      if (retryCount <= (jobRecord.max_retries || 3)) {
        const retryDelay = (jobRecord.retry_delay_seconds || 60) * 1000;
        const nextRunTime = new Date(Date.now() + retryDelay);

        await this.db.update(scheduledJobs)
          .set({
            failureCount: retryCount,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastErrorAt: new Date(),
            nextRunAt: nextRunTime
          })
          .where(eq(scheduledJobs.id, jobRecord.id));

        // Schedule retry
        this.scheduleJob({ ...jobRecord, next_run_at: nextRunTime });
      } else {
        // Max retries exceeded, disable job
        await this.db.update(scheduledJobs)
          .set({
            isActive: false,
            failureCount: retryCount,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastErrorAt: new Date()
          })
          .where(eq(scheduledJobs.id, jobRecord.id));

        this.logger.error(`Job disabled after max retries: ${jobRecord.job_name}`);
      }
    }
  }

  /**
   * Update job statistics
   */
  private async updateJobStats(
    jobName: string,
    success: boolean,
    error: string | null
  ): Promise<void> {
    const updates = {
      runCount: sql`${scheduledJobs.run_count} + 1`,
      lastRunAt: new Date()
    };

    if (success) {
      Object.assign(updates, {
        successCount: sql`${scheduledJobs.success_count} + 1`,
        lastError: null,
        lastErrorAt: null
      });
    } else {
      Object.assign(updates, {
        failureCount: sql`${scheduledJobs.failure_count} + 1`,
        lastError: error,
        lastErrorAt: new Date()
      });
    }

    await this.db.update(scheduledJobs)
      .set(updates)
      .where(eq(scheduledJobs.job_name, jobName));
  }

  /**
   * Get job ID from database
   */
  private async getJobId(jobName: string): Promise<string> {
    const job = await this.db
      .select({ id: scheduledJobs.id })
      .from(scheduledJobs)
      .where(eq(scheduledJobs.job_name, jobName))
      .limit(1);

    if (!job[0]) {
      throw new JobExecutionError(`Job not found in database: ${jobName}`);
    }

    return job[0].id;
  }

  /**
   * Calculate next run time from cron expression
   */
  private getNextRunTime(cronExpression: string): Date {
    // Implementation depends on cron parser library
    // For now, simple implementation - in production use node-cron or similar
    const now = new Date();
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now as placeholder
    return nextRun;
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.getJobHealth();
      
      for (const job of health) {
        if (!job.isHealthy) {
          this.logger.warn(`Job health issue detected: ${job.jobName}`, {
            lastError: job.lastError,
            failureCount: job.failureCount
          });

          // Emit health alert event
          await this.emitEvent('JobHealthAlert', {
            jobName: job.jobName,
            issue: 'unhealthy',
            details: job
          });
        }
      }
    } catch (error) {
      this.logger.error('Health check failed', { error });
    }
  }

  /**
   * Determine if job is healthy
   */
  private isJobHealthy(job: any): boolean {
    // Job is unhealthy if:
    // 1. Has recent failures
    // 2. Success rate is below threshold
    // 3. Last run was too long ago (if it should run frequently)
    
    const successRate = job.runCount > 0 ? (job.successCount / job.runCount) : 1;
    const hasRecentFailure = job.lastErrorAt && 
      (Date.now() - job.lastErrorAt.getTime()) < (24 * 60 * 60 * 1000); // Last 24 hours

    return successRate >= 0.8 && !hasRecentFailure;
  }

  /**
   * Emit domain events
   */
  private async emitEvent(eventName: string, data: any): Promise<void> {
    // Implementation depends on your event system
    console.log(`Emitting event: ${eventName}`, data);
  }
}
```

### 3. Built-in Job Handlers

```typescript
// src/jobs/BuiltInJobs.ts
import { JobContext, JobResult } from '../services/BackgroundJobRunner';
import { Database } from 'drizzle-orm';
import { eq, and, lt, sql } from 'drizzle-orm';

export class BuiltInJobs {
  constructor(private db: Database) {}

  /**
   * Clean up expired magic links
   */
  async cleanupExpiredMagicLinks(context: JobContext): Promise<JobResult> {
    const deletedCount = await this.db
      .delete(magicLinks)
      .where(and(
        eq(magicLinks.tenant_id, context.tenantId || ''),
        lt(magicLinks.expires_at, new Date())
      ));

    return {
      success: true,
      message: `Cleaned up ${deletedCount} expired magic links`,
      data: { deletedCount }
    };
  }

  /**
   * Mark overdue invoices
   */
  async markOverdueInvoices(context: JobContext): Promise<JobResult> {
    const updated = await this.db
      .update(invoices)
      .set({
        status: 'overdue',
        updated_at: new Date()
      })
      .where(and(
        eq(invoices.tenant_id, context.tenantId || ''),
        eq(invoices.status, 'sent'),
        lt(invoices.due_date, new Date())
      ));

    return {
      success: true,
      message: `Marked ${updated} invoices as overdue`,
      data: { updatedCount: updated }
    };
  }

  /**
   * Retry failed email deliveries
   */
  async retryFailedEmails(context: JobContext): Promise<JobResult> {
    const failedEmails = await this.db
      .select()
      .from(emailQueue)
      .where(and(
        eq(emailQueue.tenant_id, context.tenantId || ''),
        eq(emailQueue.status, 'failed'),
        sql`${emailQueue.retry_count} < 3`,
        sql`${emailQueue.last_attempt_at} < now() - interval '1 hour'`
      ));

    let retriedCount = 0;
    for (const email of failedEmails) {
      // Retry email sending logic here
      await this.db.update(emailQueue)
        .set({
          status: 'pending',
          retryCount: email.retry_count + 1,
          lastAttemptAt: new Date()
        })
        .where(eq(emailQueue.id, email.id));
      
      retriedCount++;
    }

    return {
      success: true,
      message: `Retried ${retriedCount} failed emails`,
      data: { retriedCount }
    };
  }

  /**
   * Clean up old job execution logs
   */
  async cleanupJobExecutionLogs(context: JobContext): Promise<JobResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep last 30 days

    const deletedCount = await this.db
      .delete(jobExecutions)
      .where(and(
        lt(jobExecutions.started_at, cutoffDate),
        eq(jobExecutions.status, 'completed')
      ));

    return {
      success: true,
      message: `Cleaned up ${deletedCount} old job execution logs`,
      data: { deletedCount }
    };
  }

  /**
   * Update tenant statistics
   */
  async updateTenantStatistics(context: JobContext): Promise<JobResult> {
    // Update various tenant statistics
    const tenantStats = await this.db
      .select({
        userCount: sql<number>`COUNT(*)`,
        activeUserCount: sql<number>`COUNT(CASE WHEN is_active = true THEN 1 END)`
      })
      .from(users)
      .where(eq(users.tenant_id, context.tenantId || ''));

    // Store in tenant_stats table or cache
    await this.db.insert(tenantStatistics).values({
      tenantId: context.tenantId,
      userCount: tenantStats[0].userCount,
      activeUserCount: tenantStats[0].activeUserCount,
      calculatedAt: new Date()
    }).onConflictDoUpdate({
      target: tenantStatistics.tenantId,
      set: {
        userCount: tenantStats[0].userCount,
        activeUserCount: tenantStats[0].activeUserCount,
        calculatedAt: new Date()
      }
    });

    return {
      success: true,
      message: 'Updated tenant statistics',
      data: tenantStats[0]
    };
  }
}
```

### 4. Job Registration and Startup

```typescript
// src/app/jobInitializer.ts
import { BackgroundJobRunner } from '../services/BackgroundJobRunner';
import { BuiltInJobs } from '../jobs/BuiltInJobs';

export async function initializeJobs(db: Database, logger: Logger): Promise<BackgroundJobRunner> {
  const jobRunner = new BackgroundJobRunner(db, logger);
  const builtInJobs = new BuiltInJobs(db);

  // Register built-in jobs
  await jobRunner.registerJob({
    name: 'cleanup-expired-magic-links',
    type: 'cleanup',
    schedule: '0 */6 * * *', // Every 6 hours
    handler: (context) => builtInJobs.cleanupExpiredMagicLinks(context),
    timeout: 300000, // 5 minutes
    maxRetries: 3
  });

  await jobRunner.registerJob({
    name: 'mark-overdue-invoices',
    type: 'status_update',
    schedule: '0 0 * * *', // Daily at midnight
    handler: (context) => builtInJobs.markOverdueInvoices(context),
    timeout: 600000, // 10 minutes
    maxRetries: 3
  });

  await jobRunner.registerJob({
    name: 'retry-failed-emails',
    type: 'retry',
    schedule: '0 */30 * * * *', // Every 30 minutes
    handler: (context) => builtInJobs.retryFailedEmails(context),
    timeout: 300000, // 5 minutes
    maxRetries: 2
  });

  await jobRunner.registerJob({
    name: 'cleanup-job-logs',
    type: 'cleanup',
    schedule: '0 2 * * 0', // Weekly on Sunday at 2 AM
    handler: (context) => builtInJobs.cleanupJobExecutionLogs(context),
    timeout: 600000, // 10 minutes
    maxRetries: 1
  });

  await jobRunner.registerJob({
    name: 'update-tenant-statistics',
    type: 'status_update',
    schedule: '0 */15 * * * *', // Every 15 minutes
    handler: (context) => builtInJobs.updateTenantStatistics(context),
    timeout: 300000, // 5 minutes
    maxRetries: 3
  });

  // Start the job runner
  await jobRunner.start();

  return jobRunner;
}
```

## Implementation Checklist

- [ ] Create job management database schema
- [ ] Implement BackgroundJobRunner with scheduling logic
- [ ] Add comprehensive error handling and retry logic
- [ ] Create built-in job handlers for common tasks
- [ ] Implement health check monitoring
- [ ] Add job execution tracking and logging
- [ ] Create job registration and initialization system
- [ ] Add API endpoints for job management
- [ ] Implement graceful shutdown handling
- [ ] Add comprehensive test coverage
- [ ] Create monitoring and alerting system
- [ ] Add job performance metrics

## Testing Requirements

### Unit Tests
- Test job scheduling and execution
- Test timeout and retry logic
- Test error handling and recovery
- Test health check functionality

### Integration Tests
- Test end-to-end job execution
- Test database transaction handling
- Test concurrent job execution
- Test job persistence and recovery

### Performance Tests
- Test job execution under load
- Test memory usage with many jobs
- Test database performance impact
- Test timeout handling

## Security Considerations

- Job execution context isolation
- Proper authorization for job management
- Audit trail for job modifications
- Secure handling of sensitive job data
- Tenant isolation for job execution

## Performance Optimizations

- Efficient cron expression parsing
- Database connection pooling for jobs
- Memory-efficient job tracking
- Optimized job execution logging
- Proper cleanup of completed jobs

## Monitoring

- Track job execution success rates
- Monitor job performance and duration
- Alert on job failures and timeouts
- Track resource usage by jobs
- Monitor job queue backlog
