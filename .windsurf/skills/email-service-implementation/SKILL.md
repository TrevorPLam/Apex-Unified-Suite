---
name: email-service-implementation
description: Complete email service implementation with SMTP and mock providers, Handlebars templates, queue management, and delivery tracking for the Apex Unified Suite.
---

# Email Service Implementation Guide

## Overview
This skill guides you through implementing a comprehensive email service that supports both SMTP (production) and mock (development/testing) providers, with Handlebars template rendering, queue management, and delivery tracking.

## Prerequisites
- Access to SMTP credentials (production) or development environment
- Handlebars template engine knowledge
- Understanding of email queue patterns
- Database access for email tracking

## Step 1: Email Service Architecture

### Core Service Interface
Create `lib/email/src/types.ts`:

```typescript
export interface EmailMessage {
  id?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  sendAt?: Date;
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  contentId?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
  verifyConnection(): Promise<boolean>;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  timestamp: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailDelivery {
  id: string;
  messageId: string;
  to: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
  provider: string;
  attempts: number;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

## Step 2: Database Schema

### Email Tables
Create `lib/db/src/schema/email.ts`:

```typescript
import { pgTable, text, timestamp, uuid, json, integer, boolean } from 'drizzle-orm/pg-core';

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  subject: text('subject').notNull(),
  htmlTemplate: text('html_template').notNull(),
  textTemplate: text('text_template'),
  metadata: json('metadata'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailQueue = pgTable('email_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: text('message_id').notNull().unique(),
  to: text('to').notNull().array(),
  cc: text('cc').array(),
  bcc: text('bcc').array(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content'),
  textContent: text('text_content'),
  from: text('from'),
  replyTo: text('reply_to'),
  attachments: json('attachments'),
  headers: json('headers'),
  priority: text('priority').default('normal'),
  provider: text('provider').default('smtp'),
  status: text('status').default('pending'),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  sendAt: timestamp('send_at').defaultNow().notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  scheduledAt: timestamp('scheduled_at'),
  error: text('error'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailDeliveries = pgTable('email_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: text('message_id').notNull(),
  to: text('to').notNull(),
  status: text('status').default('pending').notNull(),
  provider: text('provider').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at'),
  deliveredAt: timestamp('delivered_at'),
  error: text('error'),
  response: json('response'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailQueue = typeof emailQueue.$inferSelect;
export type NewEmailQueue = typeof emailQueue.$inferInsert;
export type EmailDelivery = typeof emailDeliveries.$inferSelect;
export type NewEmailDelivery = typeof emailDeliveries.$inferInsert;
```

## Step 3: Email Providers

### SMTP Provider
Create `lib/email/src/providers/smtp-provider.ts`:

```typescript
import nodemailer from 'nodemailer';
import { EmailProvider, EmailMessage, EmailSendResult } from '../types';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from?: string;
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
}

export class SMTPProvider implements EmailProvider {
  private transporter: nodemailer.Transporter;
  private config: SMTPConfig;

  constructor(config: SMTPConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      pool: config.pool || true,
      maxConnections: config.maxConnections || 5,
      maxMessages: config.maxMessages || 100,
      from: config.from,
    });
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      const mailOptions = {
        from: message.from || this.config.from,
        to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
        cc: message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : undefined,
        bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : undefined,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo,
        attachments: message.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          cid: att.contentId,
        })),
        headers: message.headers,
        priority: message.priority === 'high' ? 'high' : message.priority === 'low' ? 'low' : 'normal',
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: 'smtp',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    this.transporter.close();
  }
}
```

### Mock Provider
Create `lib/email/src/providers/mock-provider.ts`:

```typescript
import fs from 'fs/promises';
import path from 'path';
import { EmailProvider, EmailMessage, EmailSendResult } from '../types';

export interface MockConfig {
  outputDir?: string;
  logToFile?: boolean;
  logToConsole?: boolean;
  simulateDelays?: boolean;
  failureRate?: number; // 0-1, probability of simulated failure
}

export class MockProvider implements EmailProvider {
  private config: MockConfig;
  private outputDir: string;

  constructor(config: MockConfig = {}) {
    this.config = {
      outputDir: config.outputDir || './mock-emails',
      logToFile: config.logToFile !== false,
      logToConsole: config.logToConsole !== false,
      simulateDelays: config.simulateDelays !== false,
      failureRate: config.failureRate || 0,
    };
    this.outputDir = this.config.outputDir!;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Simulate network delay
    if (this.config.simulateDelays) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    }

    // Simulate random failure
    if (Math.random() < (this.config.failureRate || 0)) {
      return {
        success: false,
        provider: 'mock',
        error: 'Simulated delivery failure',
        timestamp: new Date(),
      };
    }

    const messageId = `mock-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      const emailData = {
        messageId,
        to: message.to,
        cc: message.cc,
        bcc: message.bcc,
        subject: message.subject,
        html: message.html,
        text: message.text,
        from: message.from,
        replyTo: message.replyTo,
        attachments: message.attachments,
        headers: message.headers,
        priority: message.priority,
        timestamp: new Date().toISOString(),
      };

      // Write to file
      if (this.config.logToFile) {
        const filename = `${messageId.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        await fs.writeFile(
          path.join(this.outputDir, filename),
          JSON.stringify(emailData, null, 2)
        );
      }

      // Log to console
      if (this.config.logToConsole) {
        console.log('📧 Mock Email Sent:', {
          messageId,
          to: message.to,
          subject: message.subject,
        });
      }

      return {
        success: true,
        messageId,
        provider: 'mock',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        provider: 'mock',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      return true;
    } catch (error) {
      console.error('Mock provider verification failed:', error);
      return false;
    }
  }
}
```

## Step 4: Template Service

### Handlebars Template Service
Create `lib/email/src/template-service.ts`:

```typescript
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { db } from '@workspace/db';
import { emailTemplates } from '@workspace/db/src/schema/email';
import { eq } from 'drizzle-orm';

export interface TemplateRenderOptions {
  helpers?: Record<string, Function>;
  partials?: Record<string, string>;
}

export class TemplateService {
  private handlebars: typeof Handlebars;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerDefaultHelpers();
  }

  async renderTemplate(
    templateName: string,
    data: Record<string, any>,
    options?: TemplateRenderOptions
  ): Promise<{ subject: string; html: string; text?: string }> {
    // Register custom helpers
    if (options?.helpers) {
      Object.entries(options.helpers).forEach(([name, helper]) => {
        this.handlebars.registerHelper(name, helper);
      });
    }

    // Register partials
    if (options?.partials) {
      Object.entries(options.partials).forEach(([name, partial]) => {
        this.handlebars.registerPartial(name, partial);
      });
    }

    const template = await this.getTemplate(templateName);
    
    const subject = this.handlebars.compile(template.subject)(data);
    const html = this.handlebars.compile(template.htmlTemplate)(data);
    const text = template.textTemplate 
      ? this.handlebars.compile(template.textTemplate)(data)
      : undefined;

    return { subject, html, text };
  }

  async getTemplate(templateName: string): Promise<EmailTemplate> {
    // Check cache first
    const cached = this.templateCache.get(templateName);
    if (cached) {
      // Still need to fetch fresh data for subject and text template
      const template = await this.fetchTemplate(templateName);
      return {
        ...template,
        htmlTemplate: cached.toString(),
      };
    }

    const template = await this.fetchTemplate(templateName);
    
    // Cache compiled HTML template
    this.templateCache.set(templateName, this.handlebars.compile(template.htmlTemplate));

    return template;
  }

  private async fetchTemplate(templateName: string): Promise<EmailTemplate> {
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, templateName))
      .limit(1);

    if (templates.length === 0) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return templates[0];
  }

  async createTemplate(template: NewEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values(template).returning();
    
    // Clear cache
    this.templateCache.delete(created.name);
    
    return created;
  }

  async updateTemplate(
    name: string,
    updates: Partial<NewEmailTemplate>
  ): Promise<EmailTemplate> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.name, name))
      .returning();

    if (!updated) {
      throw new Error(`Template '${name}' not found`);
    }

    // Clear cache
    this.templateCache.delete(name);
    
    return updated;
  }

  async deleteTemplate(name: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.name, name));
    
    // Clear cache
    this.templateCache.delete(name);
  }

  private registerDefaultHelpers(): void {
    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date: Date | string, format: string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      switch (format) {
        case 'short':
          return d.toLocaleDateString();
        case 'long':
          return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        case 'time':
          return d.toLocaleTimeString();
        default:
          return d.toISOString();
      }
    });

    // Currency formatting helper
    this.handlebars.registerHelper('formatCurrency', (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    });

    // Conditional helper
    this.handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this);
    });

    // JSON stringification helper
    this.handlebars.registerHelper('json', function(obj) {
      return JSON.stringify(obj);
    });

    // URL encoding helper
    this.handlebars.registerHelper('urlEncode', function(str) {
      return encodeURIComponent(str);
    });
  }
}
```

## Step 5: Email Queue Service

### Queue Management
Create `lib/email/src/queue-service.ts`:

```typescript
import { db } from '@workspace/db';
import { emailQueue, emailDeliveries } from '@workspace/db/src/schema/email';
import { EmailMessage, EmailProvider, EmailSendResult } from './types';
import { eq, and, lt, gt, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface QueueConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // minutes
  cleanupInterval: number; // hours
}

export class QueueService {
  private config: QueueConfig;
  private processing = false;

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = {
      batchSize: config.batchSize || 10,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5,
      cleanupInterval: config.cleanupInterval || 24,
    };
  }

  async enqueue(message: EmailMessage, provider: string = 'smtp'): Promise<string> {
    const messageId = message.id || uuidv4();
    
    await db.insert(emailQueue).values({
      messageId,
      to: Array.isArray(message.to) ? message.to : [message.to],
      cc: message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]) : [],
      bcc: message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]) : [],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      from: message.from,
      replyTo: message.replyTo,
      attachments: message.attachments,
      headers: message.headers,
      priority: message.priority || 'normal',
      provider,
      sendAt: message.sendAt || new Date(),
      scheduledAt: message.sendAt,
      metadata: message.metadata,
    });

    return messageId;
  }

  async processQueue(provider: EmailProvider): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const messages = await this.getPendingMessages();
      
      for (const message of messages) {
        await this.processMessage(message, provider);
      }
    } catch (error) {
      console.error('Error processing email queue:', error);
    } finally {
      this.processing = false;
    }
  }

  private async getPendingMessages(): Promise<EmailQueue[]> {
    const now = new Date();
    
    return await db
      .select()
      .from(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'pending'),
          lt(emailQueue.sendAt, now),
          lt(emailQueue.attempts, this.config.maxRetries)
        )
      )
      .orderBy(emailQueue.priority, emailQueue.createdAt)
      .limit(this.config.batchSize);
  }

  private async processMessage(queueMessage: EmailQueue, provider: EmailProvider): Promise<void> {
    try {
      // Update attempt count and status
      await db
        .update(emailQueue)
        .set({
          status: 'processing',
          attempts: queueMessage.attempts + 1,
          lastAttemptAt: new Date(),
        })
        .where(eq(emailQueue.messageId, queueMessage.messageId));

      // Prepare message
      const message: EmailMessage = {
        id: queueMessage.messageId,
        to: queueMessage.to,
        cc: queueMessage.cc,
        bcc: queueMessage.bcc,
        subject: queueMessage.subject,
        html: queueMessage.htmlContent,
        text: queueMessage.textContent,
        from: queueMessage.from,
        replyTo: queueMessage.replyTo,
        attachments: queueMessage.attachments as any,
        headers: queueMessage.headers as any,
        priority: queueMessage.priority as any,
      };

      // Send email
      const result = await provider.send(message);

      if (result.success) {
        // Mark as sent
        await db
          .update(emailQueue)
          .set({ status: 'sent', updatedAt: new Date() })
          .where(eq(emailQueue.messageId, queueMessage.messageId));

        // Record delivery
        await this.recordDelivery(queueMessage.messageId, queueMessage.to[0], result);
      } else {
        // Mark as failed or retry
        if (queueMessage.attempts + 1 >= this.config.maxRetries) {
          await db
            .update(emailQueue)
            .set({
              status: 'failed',
              error: result.error,
              updatedAt: new Date(),
            })
            .where(eq(emailQueue.messageId, queueMessage.messageId));

          await this.recordDelivery(queueMessage.messageId, queueMessage.to[0], result);
        } else {
          // Schedule retry
          const retryAt = new Date(Date.now() + this.config.retryDelay * 60 * 1000);
          
          await db
            .update(emailQueue)
            .set({
              status: 'pending',
              sendAt: retryAt,
              error: result.error,
              updatedAt: new Date(),
            })
            .where(eq(emailQueue.messageId, queueMessage.messageId));
        }
      }
    } catch (error) {
      console.error(`Error processing message ${queueMessage.messageId}:`, error);
      
      // Mark as failed
      await db
        .update(emailQueue)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(emailQueue.messageId, queueMessage.messageId));
    }
  }

  private async recordDelivery(messageId: string, to: string, result: EmailSendResult): Promise<void> {
    await db.insert(emailDeliveries).values({
      messageId,
      to,
      status: result.success ? 'sent' : 'failed',
      provider: result.provider || 'unknown',
      attempts: 1,
      lastAttemptAt: new Date(),
      deliveredAt: result.success ? new Date() : undefined,
      error: result.error,
      metadata: {
        timestamp: result.timestamp.toISOString(),
      },
    });
  }

  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  }> {
    const [pending, processing, sent, failed] = await Promise.all([
      db.select().from(emailQueue).where(eq(emailQueue.status, 'pending')).then(r => r.length),
      db.select().from(emailQueue).where(eq(emailQueue.status, 'processing')).then(r => r.length),
      db.select().from(emailQueue).where(eq(emailQueue.status, 'sent')).then(r => r.length),
      db.select().from(emailQueue).where(eq(emailQueue.status, 'failed')).then(r => r.length),
    ]);

    return { pending, processing, sent, failed };
  }

  async cleanup(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.cleanupInterval * 60 * 60 * 1000);
    
    // Delete old sent messages
    await db
      .delete(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'sent'),
          lt(emailQueue.updatedAt, cutoffDate)
        )
      );

    // Delete old failed messages
    await db
      .delete(emailQueue)
      .where(
        and(
          eq(emailQueue.status, 'failed'),
          lt(emailQueue.updatedAt, cutoffDate)
        )
      );
  }
}
```

## Step 6: Main Email Service

### Email Service Implementation
Create `lib/email/src/email-service.ts`:

```typescript
import { EmailMessage, EmailProvider, EmailSendResult } from './types';
import { TemplateService } from './template-service';
import { QueueService } from './queue-service';
import { SMTPProvider } from './providers/smtp-provider';
import { MockProvider } from './providers/mock-provider';

export interface EmailServiceConfig {
  provider: 'smtp' | 'mock';
  smtp?: any; // SMTPConfig
  mock?: any; // MockConfig
  queue?: any; // QueueConfig
  enableQueue?: boolean;
}

export class EmailService {
  private provider: EmailProvider;
  private templateService: TemplateService;
  private queueService: QueueService;
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = config;
    
    // Initialize provider
    if (config.provider === 'smtp' && config.smtp) {
      this.provider = new SMTPProvider(config.smtp);
    } else {
      this.provider = new MockProvider(config.mock);
    }

    this.templateService = new TemplateService();
    this.queueService = new QueueService(config.queue);
  }

  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    // If template is specified, render it first
    if (message.template && message.templateData) {
      const rendered = await this.templateService.renderTemplate(
        message.template,
        message.templateData
      );
      
      message.subject = rendered.subject;
      message.html = rendered.html;
      message.text = rendered.text;
    }

    // Queue or send immediately
    if (this.config.enableQueue) {
      const messageId = await this.queueService.enqueue(message, this.config.provider);
      return {
        success: true,
        messageId,
        provider: this.config.provider,
        timestamp: new Date(),
      };
    } else {
      return await this.provider.send(message);
    }
  }

  async sendMagicLink(email: string, magicLink: string, options?: {
    firstName?: string;
    companyName?: string;
    expiryMinutes?: number;
  }): Promise<EmailSendResult> {
    const templateData = {
      email,
      magicLink,
      firstName: options?.firstName || 'there',
      companyName: options?.companyName || 'Apex Unified Suite',
      expiryMinutes: options?.expiryMinutes || 15,
    };

    return await this.sendEmail({
      to: email,
      template: 'magic-link',
      templateData,
    });
  }

  async sendWelcomeEmail(email: string, options?: {
    firstName?: string;
    companyName?: string;
  }): Promise<EmailSendResult> {
    const templateData = {
      email,
      firstName: options?.firstName || 'there',
      companyName: options?.companyName || 'Apex Unified Suite',
    };

    return await this.sendEmail({
      to: email,
      template: 'welcome',
      templateData,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string, options?: {
    firstName?: string;
    expiryMinutes?: number;
  }): Promise<EmailSendResult> {
    const templateData = {
      email,
      resetLink,
      firstName: options?.firstName || 'there',
      expiryMinutes: options?.expiryMinutes || 60,
    };

    return await this.sendEmail({
      to: email,
      template: 'password-reset',
      templateData,
    });
  }

  async processQueue(): Promise<void> {
    if (this.config.enableQueue) {
      await this.queueService.processQueue(this.provider);
    }
  }

  async getQueueStatus() {
    return await this.queueService.getQueueStatus();
  }

  async verifyConnection(): Promise<boolean> {
    return await this.provider.verifyConnection();
  }

  async close(): Promise<void> {
    if (this.provider instanceof SMTPProvider) {
      await this.provider.close();
    }
  }
}
```

## Step 7: API Integration

### Email API Routes
Create `artifacts/api-server/src/routes/v1/email.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { EmailService } from '@workspace/email/src/email-service';

const router = Router();

// Initialize email service based on environment
const emailService = new EmailService({
  provider: process.env.NODE_ENV === 'production' ? 'smtp' : 'mock',
  smtp: process.env.NODE_ENV === 'production' ? {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM,
  } : undefined,
  enableQueue: true,
});

// Send email
router.post('/send', async (req, res) => {
  try {
    const schema = z.object({
      to: z.union([z.string().email(), z.array(z.string().email())]),
      subject: z.string().min(1),
      html: z.string().optional(),
      text: z.string().optional(),
      template: z.string().optional(),
      templateData: z.record(z.any()).optional(),
      cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
      bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
      from: z.string().email().optional(),
      replyTo: z.string().email().optional(),
    });

    const data = schema.parse(req.body);
    
    const result = await emailService.sendEmail(data);
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      timestamp: result.timestamp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Email send error:', error);
    res.status(500).json({
      error: 'Failed to send email',
    });
  }
});

// Send magic link
router.post('/magic-link', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      magicLink: z.string().url(),
      firstName: z.string().optional(),
      companyName: z.string().optional(),
      expiryMinutes: z.number().optional(),
    });

    const data = schema.parse(req.body);
    
    const result = await emailService.sendMagicLink(data.email, data.magicLink, {
      firstName: data.firstName,
      companyName: data.companyName,
      expiryMinutes: data.expiryMinutes,
    });
    
    res.json({
      success: result.success,
      messageId: result.messageId,
      provider: result.provider,
      timestamp: result.timestamp,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Magic link send error:', error);
    res.status(500).json({
      error: 'Failed to send magic link',
    });
  }
});

// Get queue status
router.get('/queue/status', async (req, res) => {
  try {
    const status = await emailService.getQueueStatus();
    res.json(status);
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
    });
  }
});

// Process queue (admin only)
router.post('/queue/process', async (req, res) => {
  try {
    await emailService.processQueue();
    res.json({
      message: 'Queue processing initiated',
    });
  } catch (error) {
    console.error('Queue processing error:', error);
    res.status(500).json({
      error: 'Failed to process queue',
    });
  }
});

export { router as emailRouter };
```

## Step 8: Email Templates

### Create Default Templates
Create a template seeding script `lib/email/src/templates/seed.ts`:

```typescript
import { db } from '@workspace/db';
import { emailTemplates } from '@workspace/db/src/schema/email';

const defaultTemplates = [
  {
    name: 'magic-link',
    subject: 'Sign in to {{companyName}} Portal',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Portal</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #0066ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Portal Sign In</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>Click the button below to sign in to the {{companyName}} portal:</p>
      <div style="text-align: center;">
        <a href="{{magicLink}}" class="button">Sign In to Portal</a>
      </div>
      <p><strong>Important:</strong> This link will expire in {{expiryMinutes}} minutes for security reasons.</p>
      <p>If you didn't request this sign-in link, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Apex Unified Suite portal.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `
Hello {{firstName}},

Sign in to the {{companyName}} portal by clicking this link:
{{magicLink}}

This link will expire in {{expiryMinutes}} minutes for security reasons.

If you didn't request this sign-in link, you can safely ignore this email.

This is an automated message from the Apex Unified Suite portal.
    `,
  },
  {
    name: 'welcome',
    subject: 'Welcome to {{companyName}}',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome!</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>Welcome to {{companyName}}! We're excited to have you on board.</p>
      <p>You can now access your portal and start using our platform.</p>
      <p>If you have any questions, don't hesitate to reach out to our support team.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Apex Unified Suite.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `
Hello {{firstName}},

Welcome to {{companyName}}! We're excited to have you on board.

You can now access your portal and start using our platform.

If you have any questions, don't hesitate to reach out to our support team.

This is an automated message from the Apex Unified Suite.
    `,
  },
  {
    name: 'password-reset',
    subject: 'Reset your password',
    htmlTemplate: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066ff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #0066ff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <p>Hello {{firstName}},</p>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center;">
        <a href="{{resetLink}}" class="button">Reset Password</a>
      </div>
      <p><strong>Important:</strong> This link will expire in {{expiryMinutes}} minutes for security reasons.</p>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from the Apex Unified Suite.</p>
    </div>
  </div>
</body>
</html>
    `,
    textTemplate: `
Hello {{firstName}},

You requested to reset your password. Click this link to proceed:
{{resetLink}}

This link will expire in {{expiryMinutes}} minutes for security reasons.

If you didn't request this password reset, you can safely ignore this email.

This is an automated message from the Apex Unified Suite.
    `,
  },
];

export async function seedEmailTemplates(): Promise<void> {
  for (const template of defaultTemplates) {
    const existing = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, template.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(emailTemplates).values(template);
      console.log(`Created email template: ${template.name}`);
    }
  }
}
```

## Step 9: Queue Processor

### Background Queue Processor
Create `artifacts/api-server/src/workers/email-queue-processor.ts`:

```typescript
import { EmailService } from '@workspace/email/src/email-service';

class EmailQueueProcessor {
  private emailService: EmailService;
  private interval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.emailService = new EmailService({
      provider: process.env.NODE_ENV === 'production' ? 'smtp' : 'mock',
      enableQueue: true,
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    console.log('Starting email queue processor...');

    // Process immediately
    await this.processQueue();

    // Schedule regular processing
    this.interval = setInterval(async () => {
      await this.processQueue();
    }, 30000); // Process every 30 seconds
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    console.log('Email queue processor stopped');

    await this.emailService.close();
  }

  private async processQueue(): Promise<void> {
    try {
      await this.emailService.processQueue();
    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  }
}

// Singleton instance
const processor = new EmailQueueProcessor();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down email queue processor...');
  await processor.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down email queue processor...');
  await processor.stop();
  process.exit(0);
});

// Start processor if this file is run directly
if (require.main === module) {
  processor.start().catch(console.error);
}

export { processor };
```

## Step 10: Testing

### Email Service Tests
Create `tests/email/email-service.test.ts`:

```typescript
import { EmailService } from '@workspace/email/src/email-service';
import { MockProvider } from '@workspace/email/src/providers/mock-provider';

describe('Email Service', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService({
      provider: 'mock',
      mock: {
        logToFile: false,
        logToConsole: false,
      },
      enableQueue: false,
    });
  });

  test('should send email directly', async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('should send magic link email', async () => {
    const result = await emailService.sendMagicLink(
      'test@example.com',
      'https://example.com/auth/verify?token=abc123',
      {
        firstName: 'John',
        companyName: 'Test Company',
      }
    );

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  test('should handle template rendering', async () => {
    // This would require templates to be seeded
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      template: 'magic-link',
      templateData: {
        magicLink: 'https://example.com/auth/verify?token=abc123',
        firstName: 'John',
        companyName: 'Test Company',
        expiryMinutes: 15,
      },
    });

    expect(result.success).toBe(true);
  });
});
```

## Common Issues and Solutions

### SMTP Connection Issues
- Verify SMTP credentials and server details
- Check firewall and network connectivity
- Ensure TLS/SSL settings match provider requirements
- Test with telnet or openssl for basic connectivity

### Template Rendering Issues
- Verify Handlebars syntax
- Check template data structure
- Ensure all required variables are provided
- Test templates with sample data

### Queue Processing Issues
- Monitor queue status regularly
- Check database connectivity
- Verify retry logic and backoff strategy
- Implement proper error handling and logging

### Email Delivery Issues
- Monitor bounce rates and spam complaints
- Verify SPF/DKIM/DMARC records
- Check email content for spam triggers
- Implement proper unsubscribe mechanisms

## Security Considerations

### SMTP Security
- Use TLS/SSL for all connections
- Store SMTP credentials securely
- Implement connection pooling
- Monitor for suspicious activity

### Template Security
- Sanitize template inputs
- Escape user-provided content
- Limit template complexity
- Prevent code injection

### Queue Security
- Validate message queue data
- Implement proper access controls
- Monitor queue processing
- Secure database connections

This skill provides a comprehensive email service implementation with both production and development capabilities, proper template management, queue processing, and security considerations for the Apex Unified Suite.
