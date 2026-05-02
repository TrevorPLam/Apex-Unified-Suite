---
name: domain-event-bus
description: Implement in-process domain event bus for decoupled communication between bounded contexts with type-safe event publishing and subscription
---

# Domain Event Bus Implementation

This skill guides you through implementing an in-process domain event bus that enables decoupled communication between bounded contexts, supports audit logging, and maintains type safety across event publishers and subscribers.

## Current State Assessment

**Current State**: No event system exists - domain events cannot be published or subscribed to.

**Missing Infrastructure**:
- No event bus for decoupled communication
- No audit trail for significant state changes
- No mechanism for cross-context notifications
- No type-safe event definitions

## Event Bus Architecture

### **Pattern Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Bounded Context A                           │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │   Service    │────►│  Event Bus   │                         │
│  │              │     │              │                         │
│  │  publishes   │     │  - Store     │                         │
│  │  LeadCreated │     │  - Route     │                         │
│  └──────────────┘     └──────┬───────┘                         │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Bounded Context B                           │
│  ┌──────────────┐     ┌──────────────┐                         │
│  │  Subscriber  │◄────│  Event Bus   │                         │
│  │              │     │              │                         │
│  │  handles     │     │  - Deliver   │                         │
│  │  LeadCreated │     │  - Audit     │                         │
│  └──────────────┘     └──────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### **Event Flow**

1. **Domain Event Created** - When aggregate state changes significantly
2. **Event Published** - Service publishes event to bus
3. **Subscribers Notified** - Bus routes to interested handlers
4. **Handlers Execute** - Subscribers react to event (in-process)
5. **Audit Logged** - Event recorded for compliance

## Step-by-Step Implementation

### **Step 1: Create Domain Event Base Class**

**File**: `artifacts/api-server/src/lib/events/domain-event.ts`

```typescript
import { randomUUID } from 'crypto';

/**
 * Base class for all domain events
 * Events represent significant state changes in the domain
 */
export abstract class DomainEvent {
  /**
   * Unique event ID for idempotency and tracking
   */
  readonly id: string;
  
  /**
   * Event type identifier (used for routing)
   */
  abstract readonly type: string;
  
  /**
   * ID of the aggregate that emitted the event
   */
  readonly aggregateId: string;
  
  /**
   * Timestamp when event occurred
   */
  readonly timestamp: Date;
  
  /**
   * Organization/tenant ID for multi-tenancy
   */
  readonly organizationId: string;
  
  /**
   * User who triggered the event
   */
  readonly triggeredBy?: string;
  
  /**
   * Event version for schema evolution
   */
  readonly version: number = 1;

  constructor(
    aggregateId: string,
    organizationId: string,
    options?: {
      triggeredBy?: string;
      version?: number;
    }
  ) {
    this.id = randomUUID();
    this.aggregateId = aggregateId;
    this.organizationId = organizationId;
    this.timestamp = new Date();
    this.triggeredBy = options?.triggeredBy;
    if (options?.version) {
      this.version = options.version;
    }
  }

  /**
   * Serialize to plain object for storage/transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      aggregateId: this.aggregateId,
      timestamp: this.timestamp.toISOString(),
      organizationId: this.organizationId,
      triggeredBy: this.triggeredBy,
      version: this.version,
    };
  }
}

/**
 * Type helper to extract event type from event class
 */
export type EventType<T extends DomainEvent> = T['type'];
```

### **Step 2: Define Concrete Domain Events**

**File**: `artifacts/api-server/src/lib/events/events.ts`

```typescript
import { DomainEvent } from './domain-event';

// ==================== Identity & Access Events ====================

export class UserCreated extends DomainEvent {
  readonly type = 'UserCreated';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly email: string,
    public readonly role: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class UserRoleChanged extends DomainEvent {
  readonly type = 'UserRoleChanged';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly oldRole: string,
    public readonly newRole: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== CRM Events ====================

export class LeadCreated extends DomainEvent {
  readonly type = 'LeadCreated';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly title: string,
    public readonly email: string,
    public readonly source?: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class LeadStageChanged extends DomainEvent {
  readonly type = 'LeadStageChanged';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly oldStage: string,
    public readonly newStage: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class DealWon extends DomainEvent {
  readonly type = 'DealWon';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly value: number,
    public readonly contactId: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Project Events ====================

export class TaskCompleted extends DomainEvent {
  readonly type = 'TaskCompleted';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly projectId: string,
    public readonly completedBy: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class ProjectMilestoneReached extends DomainEvent {
  readonly type = 'ProjectMilestoneReached';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly milestoneName: string,
    public readonly projectId: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Finance Events ====================

export class InvoicePaid extends DomainEvent {
  readonly type = 'InvoicePaid';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly amount: number,
    public readonly paidBy: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

export class PaymentRecorded extends DomainEvent {
  readonly type = 'PaymentRecorded';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly amount: number,
    public readonly method: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Appointment Events ====================

export class AppointmentBooked extends DomainEvent {
  readonly type = 'AppointmentBooked';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly clientEmail: string,
    public readonly startTime: Date,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Document Events ====================

export class DocumentSigned extends DomainEvent {
  readonly type = 'DocumentSigned';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly documentName: string,
    public readonly signedBy: string,
    triggeredBy?: string
  ) {
    super(aggregateId, organizationId, { triggeredBy });
  }
}

// ==================== Event Union Type ====================

export type DomainEvents =
  | UserCreated
  | UserRoleChanged
  | LeadCreated
  | LeadStageChanged
  | DealWon
  | TaskCompleted
  | ProjectMilestoneReached
  | InvoicePaid
  | PaymentRecorded
  | AppointmentBooked
  | DocumentSigned;
```

### **Step 3: Implement Event Bus**

**File**: `artifacts/api-server/src/lib/events/event-bus.ts`

```typescript
import { DomainEvent, DomainEvents } from './events';
import { logger } from '../logger';

/**
 * Event handler function type
 */
type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>;

/**
 * Event subscription structure
 */
interface Subscription<T extends DomainEvent = DomainEvent> {
  id: string;
  handler: EventHandler<T>;
  once: boolean;
}

/**
 * In-process event bus for domain event communication
 * 
 * Features:
 * - Type-safe publishing and subscription
 * - Synchronous in-process delivery
 * - Error isolation (one handler failure doesn't affect others)
 * - Automatic audit logging
 */
export class EventBus {
  private handlers: Map<string, Subscription[]> = new Map();
  private auditHandler?: (event: DomainEvent) => void | Promise<void>;

  /**
   * Set up audit handler for compliance/logging
   */
  setAuditHandler(handler: (event: DomainEvent) => void | Promise<void>): void {
    this.auditHandler = handler;
  }

  /**
   * Subscribe to events of a specific type
   * @returns Unsubscribe function
   */
  subscribe<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>,
    options: { once?: boolean } = {}
  ): () => void {
    const subscription: Subscription = {
      id: `${eventType}-${Date.now()}-${Math.random()}`,
      handler: handler as EventHandler<DomainEvent>,
      once: options.once ?? false,
    };

    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, subscription]);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType) || [];
      this.handlers.set(
        eventType,
        handlers.filter((h) => h.id !== subscription.id)
      );
    };
  }

  /**
   * Subscribe to a single event, then auto-unsubscribe
   */
  once<T extends DomainEvent>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): void {
    this.subscribe(eventType, handler, { once: true });
  }

  /**
   * Publish an event to all subscribers
   * Handlers are called synchronously in order
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const eventType = event.type;
    const handlers = this.handlers.get(eventType) || [];

    logger.debug(
      { eventType, eventId: event.id, handlerCount: handlers.length },
      'Publishing event'
    );

    // Call audit handler
    if (this.auditHandler) {
      try {
        await this.auditHandler(event);
      } catch (error) {
        // Audit failure shouldn't stop event processing
        logger.error({ error, event }, 'Audit handler failed');
      }
    }

    // Call each handler with error isolation
    const toRemove: string[] = [];

    for (const subscription of handlers) {
      try {
        await subscription.handler(event);

        // Mark once handlers for removal
        if (subscription.once) {
          toRemove.push(subscription.id);
        }
      } catch (error) {
        // Log error but don't stop other handlers
        logger.error(
          { error, eventType, eventId: event.id, handlerId: subscription.id },
          'Event handler failed'
        );

        // Mark once handlers for removal even if they failed
        if (subscription.once) {
          toRemove.push(subscription.id);
        }
      }
    }

    // Clean up once handlers
    if (toRemove.length > 0) {
      this.handlers.set(
        eventType,
        handlers.filter((h) => !toRemove.includes(h.id))
      );
    }
  }

  /**
   * Get count of handlers for an event type (useful for testing)
   */
  handlerCount(eventType: string): number {
    return (this.handlers.get(eventType) || []).length;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance for the application
export const eventBus = new EventBus();
```

### **Step 4: Create Audit Subscriber**

**File**: `artifacts/api-server/src/lib/events/audit-subscriber.ts`

```typescript
import { DomainEvent } from './domain-event';
import { logger } from '../logger';

/**
 * Audit subscriber that logs all domain events
 * In production, this would write to audit_logs table
 */
export async function auditSubscriber(event: DomainEvent): Promise<void> {
  const auditEntry = {
    eventId: event.id,
    eventType: event.type,
    aggregateId: event.aggregateId,
    organizationId: event.organizationId,
    triggeredBy: event.triggeredBy,
    timestamp: event.timestamp,
    data: event.toJSON(),
  };

  // Log to structured logger
  logger.info(auditEntry, `Domain event: ${event.type}`);

  // TODO: In Phase 2, persist to audit_logs table
  // await db.insert(auditLogsTable).values({
  //   id: randomUUID(),
  //   ...auditEntry,
  //   createdAt: new Date(),
  // });
}
```

### **Step 5: Integration with Services**

**File**: `artifacts/api-server/src/services/crm.ts`

```typescript
import { eventBus } from '../lib/events/event-bus';
import { LeadCreated, LeadStageChanged, DealWon } from '../lib/events/events';
import { contactRepository } from '@workspace/db/repositories';
import { Result, ok, err } from 'neverthrow';

export class CRMService {
  async createLead(
    data: CreateLeadInput,
    organizationId: string,
    userId: string
  ): Promise<Result<Lead, DomainError>> {
    // ... validation and creation logic

    const lead = await contactRepository.create({
      ...data,
      stage: 'new',
    }, organizationId);

    // Publish domain event
    await eventBus.publish(
      new LeadCreated(
        lead.id,
        organizationId,
        lead.title,
        lead.email,
        lead.source,
        userId
      )
    );

    return ok(this.toDomainModel(lead));
  }

  async moveLeadStage(
    leadId: string,
    newStage: LeadStage,
    organizationId: string,
    userId: string
  ): Promise<Result<Lead, DomainError>> {
    const lead = await this.getLead(leadId, organizationId);
    if (lead.isErr()) return lead;

    const oldStage = lead.value.stage;

    // Update stage
    const updated = await contactRepository.update(
      leadId,
      { stage: newStage },
      organizationId
    );

    // Publish stage change event
    await eventBus.publish(
      new LeadStageChanged(
        leadId,
        organizationId,
        oldStage,
        newStage,
        userId
      )
    );

    // If won, publish deal won event
    if (newStage === 'closed_won') {
      await eventBus.publish(
        new DealWon(
          leadId,
          organizationId,
          lead.value.value || 0,
          lead.value.contactId,
          userId
        )
      );
    }

    return ok(this.toDomainModel(updated!));
  }
}
```

### **Step 6: Cross-Context Subscribers**

**File**: `artifacts/api-server/src/subscribers/analytics-subscriber.ts`

```typescript
import { eventBus } from '../lib/events/event-bus';
import { 
  LeadCreated, 
  DealWon, 
  InvoicePaid,
  TaskCompleted 
} from '../lib/events/events';
import { logger } from '../lib/logger';

/**
 * Analytics subscribers
 * React to events across contexts for reporting
 */
export function setupAnalyticsSubscribers(): void {
  // Track new leads for dashboard
  eventBus.subscribe('LeadCreated', async (event: LeadCreated) => {
    logger.info(
      { leadId: event.aggregateId, organizationId: event.organizationId },
      'Analytics: Lead created - updating metrics'
    );
    
    // TODO: Update real-time analytics
    // await analyticsService.incrementLeadCount(event.organizationId);
  });

  // Track won deals for revenue reporting
  eventBus.subscribe('DealWon', async (event: DealWon) => {
    logger.info(
      { dealId: event.aggregateId, value: event.value },
      'Analytics: Deal won - updating revenue'
    );
    
    // TODO: Update revenue metrics
    // await analyticsService.addRevenue(event.organizationId, event.value);
  });

  // Track payments for cash flow
  eventBus.subscribe('InvoicePaid', async (event: InvoicePaid) => {
    logger.info(
      { invoiceId: event.aggregateId, amount: event.amount },
      'Analytics: Payment received'
    );
    
    // TODO: Update cash flow metrics
    // await analyticsService.recordPayment(event.organizationId, event.amount);
  });

  // Track project velocity
  eventBus.subscribe('TaskCompleted', async (event: TaskCompleted) => {
    logger.info(
      { taskId: event.aggregateId, projectId: event.projectId },
      'Analytics: Task completed'
    );
    
    // TODO: Update project velocity
    // await analyticsService.recordTaskCompletion(event.projectId);
  });
}
```

**File**: `artifacts/api-server/src/subscribers/notification-subscriber.ts`

```typescript
import { eventBus } from '../lib/events/event-bus';
import { 
  LeadStageChanged,
  AppointmentBooked,
  DocumentSigned 
} from '../lib/events/events';
import { logger } from '../lib/logger';

/**
 * Notification subscribers
 * Send notifications when significant events occur
 */
export function setupNotificationSubscribers(): void {
  // Notify on lead stage changes
  eventBus.subscribe('LeadStageChanged', async (event: LeadStageChanged) => {
    logger.info(
      { 
        leadId: event.aggregateId, 
        from: event.oldStage, 
        to: event.newStage 
      },
      'Notification: Lead stage changed'
    );
    
    // TODO: Send notifications
    // await notificationService.send({
    //   type: 'lead_stage_changed',
    //   recipient: 'sales-team',
    //   data: { leadId: event.aggregateId, newStage: event.newStage },
    // });
  });

  // Notify on appointment bookings
  eventBus.subscribe('AppointmentBooked', async (event: AppointmentBooked) => {
    logger.info(
      { clientEmail: event.clientEmail, startTime: event.startTime },
      'Notification: New appointment booked'
    );
    
    // TODO: Send confirmation email
    // await emailService.sendAppointmentConfirmation({
    //   to: event.clientEmail,
    //   appointmentTime: event.startTime,
    // });
  });

  // Notify on document signatures
  eventBus.subscribe('DocumentSigned', async (event: DocumentSigned) => {
    logger.info(
      { documentName: event.documentName, signedBy: event.signedBy },
      'Notification: Document signed'
    );
    
    // TODO: Send completion notification
    // await notificationService.sendDocumentCompleted({
    //   documentName: event.documentName,
    // });
  });
}
```

### **Step 7: Initialize Event Bus in App**

**File**: `artifacts/api-server/src/app.ts`

```typescript
import { app } from './app';
import { eventBus } from './lib/events/event-bus';
import { auditSubscriber } from './lib/events/audit-subscriber';
import { setupAnalyticsSubscribers } from './subscribers/analytics-subscriber';
import { setupNotificationSubscribers } from './subscribers/notification-subscriber';

// Set up audit logging
eventBus.setAuditHandler(auditSubscriber);

// Set up cross-context subscribers
setupAnalyticsSubscribers();
setupNotificationSubscribers();

// ... rest of app setup
```

### **Step 8: Event Bus Tests**

**File**: `artifacts/api-server/__tests__/lib/events/event-bus.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../../src/lib/events/event-bus';
import { DomainEvent } from '../../../src/lib/events/domain-event';

// Test event class
class TestEvent extends DomainEvent {
  readonly type = 'TestEvent';
  
  constructor(
    aggregateId: string,
    organizationId: string,
    public readonly data: string
  ) {
    super(aggregateId, organizationId);
  }
}

class AnotherEvent extends DomainEvent {
  readonly type = 'AnotherEvent';
  
  constructor(aggregateId: string, organizationId: string) {
    super(aggregateId, organizationId);
  }
}

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should deliver events to subscribers', async () => {
    const handler = vi.fn();
    eventBus.subscribe('TestEvent', handler);

    const event = new TestEvent('agg-1', 'org-1', 'test-data');
    await eventBus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should deliver to multiple subscribers', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    
    eventBus.subscribe('TestEvent', handler1);
    eventBus.subscribe('TestEvent', handler2);

    const event = new TestEvent('agg-1', 'org-1', 'test-data');
    await eventBus.publish(event);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should not deliver to wrong event type subscribers', async () => {
    const testHandler = vi.fn();
    const anotherHandler = vi.fn();
    
    eventBus.subscribe('TestEvent', testHandler);
    eventBus.subscribe('AnotherEvent', anotherHandler);

    await eventBus.publish(new TestEvent('agg-1', 'org-1', 'test'));

    expect(testHandler).toHaveBeenCalled();
    expect(anotherHandler).not.toHaveBeenCalled();
  });

  it('should support once subscriptions', async () => {
    const handler = vi.fn();
    eventBus.once('TestEvent', handler);

    const event1 = new TestEvent('agg-1', 'org-1', 'data1');
    const event2 = new TestEvent('agg-2', 'org-1', 'data2');
    
    await eventBus.publish(event1);
    await eventBus.publish(event2);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event1);
  });

  it('should support unsubscribing', async () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.subscribe('TestEvent', handler);

    await eventBus.publish(new TestEvent('agg-1', 'org-1', 'data'));
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();

    await eventBus.publish(new TestEvent('agg-2', 'org-1', 'data'));
    expect(handler).toHaveBeenCalledTimes(1); // Still 1
  });

  it('should isolate handler errors', async () => {
    const errorHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
    const successHandler = vi.fn();
    
    eventBus.subscribe('TestEvent', errorHandler);
    eventBus.subscribe('TestEvent', successHandler);

    const event = new TestEvent('agg-1', 'org-1', 'data');
    
    // Should not throw
    await expect(eventBus.publish(event)).resolves.not.toThrow();
    
    // Both handlers should have been called
    expect(errorHandler).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
  });

  it('should call audit handler', async () => {
    const auditHandler = vi.fn();
    eventBus.setAuditHandler(auditHandler);

    const event = new TestEvent('agg-1', 'org-1', 'data');
    await eventBus.publish(event);

    expect(auditHandler).toHaveBeenCalledWith(event);
  });

  it('should continue if audit handler fails', async () => {
    const failingAudit = vi.fn().mockRejectedValue(new Error('Audit failed'));
    const eventHandler = vi.fn();
    
    eventBus.setAuditHandler(failingAudit);
    eventBus.subscribe('TestEvent', eventHandler);

    const event = new TestEvent('agg-1', 'org-1', 'data');
    
    // Should not throw
    await expect(eventBus.publish(event)).resolves.not.toThrow();
    
    // Event handler should still be called
    expect(eventHandler).toHaveBeenCalled();
  });
});
```

## Event Patterns

### **Event Publishing in Aggregates**

```typescript
class Lead {
  private events: DomainEvent[] = [];

  moveToStage(newStage: LeadStage, userId: string): void {
    const oldStage = this.stage;
    this.stage = newStage;
    
    // Record event
    this.events.push(
      new LeadStageChanged(
        this.id,
        this.organizationId,
        oldStage,
        newStage,
        userId
      )
    );
  }

  getUncommittedEvents(): DomainEvent[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }
}
```

### **Event Handler Best Practices**

```typescript
// Good: Idempotent handler
async function onLeadCreated(event: LeadCreated): Promise<void> {
  // Check if already processed
  const exists = await analyticsRepo.leadEventExists(event.id);
  if (exists) return;
  
  // Process
  await analyticsRepo.recordLead(event);
}

// Good: Async without blocking
async function onInvoicePaid(event: InvoicePaid): Promise<void> {
  // Don't wait for email to send
  emailService.sendReceipt(event).catch(err => {
    logger.error({ err, event }, 'Failed to send receipt');
  });
}

// Bad: Blocking synchronous work
async function onInvoicePaid(event: InvoicePaid): Promise<void> {
  await emailService.sendReceipt(event); // Blocks event processing
  await reportService.updateReports(event); // More blocking
}
```

## Verification Commands

```bash
# Test event bus
pnpm vitest run artifacts/api-server/__tests__/lib/events/

# Check event coverage
grep -r "eventBus.publish" artifacts/api-server/src/ | wc -l

# Verify subscriber setup
grep -r "eventBus.subscribe" artifacts/api-server/src/subscribers/
```

## Event Bus Benefits

1. **Decoupling**: Contexts don't depend on each other
2. **Extensibility**: New subscribers without changing publishers
3. **Audit Trail**: All significant changes logged
4. **Testing**: Easy to mock and verify events
5. **Performance**: In-process, no network overhead

## Future Enhancements (Post-MVP)

- **Outbox Pattern**: For reliable event delivery with transactions
- **Message Queue**: For distributed systems
- **Event Sourcing**: Full state reconstruction from events
- **Event Replay**: Reprocess events for recovery
