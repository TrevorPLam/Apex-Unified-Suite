---
name: payment-allocation-service
description: Implement financial payment processing service with atomic invoice updates, payment allocation logic, and automatic invoice status transitions when balance reaches zero.
---

# Payment Allocation Service Implementation

## Overview

This skill guides the implementation of a robust payment allocation system that handles payment processing, distributes payments across multiple invoices, maintains atomic consistency, and automatically updates invoice statuses based on remaining balances.

## Core Architecture

### 1. Database Schema Design

#### Payments Table
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded')),
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('invoice_payment', 'prepayment', 'credit_payment')),
  reference_number VARCHAR(100), -- External payment processor reference
  processor_response JSONB, -- Response from payment processor
  failure_reason TEXT,
  allocated_amount DECIMAL(12,2) DEFAULT 0,
  unallocated_amount DECIMAL(12,2) GENERATED ALWAYS AS (amount - allocated_amount) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_reference ON payments(reference_number);
```

#### Payment Allocations Table
```sql
CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  allocation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  allocation_type VARCHAR(20) NOT NULL DEFAULT 'automatic' CHECK (allocation_type IN ('automatic', 'manual')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);
CREATE INDEX idx_payment_allocations_tenant ON payment_allocations(tenant_id);
CREATE UNIQUE INDEX idx_payment_allocations_unique ON payment_allocations(payment_id, invoice_id);
```

#### Invoices Table (Enhanced)
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number VARCHAR(50) NOT NULL,
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('ar', 'ap')), -- Accounts Receivable/Payable
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'void', 'partially_paid')),
  last_payment_date TIMESTAMPTZ,
  payment_terms VARCHAR(50),
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_invoices_tenant_number ON invoices(tenant_id, invoice_number);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
```

### 2. Payment Allocation Service

```typescript
// src/services/PaymentAllocationService.ts
import { Database } from 'drizzle-orm';
import { payments, paymentAllocations, invoices, clients } from '../db/schema';
import { eq, and, gte, lte, sql, lt, gt, desc } from 'drizzle-orm';
import { PaymentProcessingError, InsufficientFundsError, InvoiceAlreadyPaidError } from '../domain/errors';

export interface CreatePaymentRequest {
  clientId: string;
  amount: number;
  currency?: string;
  paymentType: 'invoice_payment' | 'prepayment' | 'credit_payment';
  paymentMethodId: string;
  invoiceIds?: string[]; // For specific invoice payments
  allocationStrategy?: 'oldest_first' | 'newest_first' | 'proportional' | 'manual';
  notes?: string;
  referenceNumber?: string;
}

export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
  invoiceBalance: number;
  willBeFullyPaid: boolean;
}

export class PaymentAllocationService {
  constructor(private db: Database) {}

  /**
   * Process a payment with automatic allocation to invoices
   */
  async processPayment(
    request: CreatePaymentRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Payment> {
    return await this.db.transaction(async (tx) => {
      // 1. Validate client exists and belongs to tenant
      const client = await tx
        .select()
        .from(clients)
        .where(and(
          eq(clients.id, request.clientId),
          eq(clients.tenant_id, tenantId)
        ))
        .limit(1);

      if (!client[0]) {
        throw new PaymentProcessingError('Client not found or does not belong to tenant');
      }

      // 2. Create payment record
      const payment = await tx.insert(payments).values({
        tenantId,
        clientId: request.clientId,
        paymentMethodId: request.paymentMethodId,
        amount: request.amount,
        currency: request.currency || 'USD',
        paymentType: request.paymentType,
        referenceNumber: request.referenceNumber,
        notes: request.notes,
        status: 'processing',
        createdBy
      }).returning();

      const paymentRecord = payment[0];

      // 3. Determine allocation strategy
      const strategy = request.allocationStrategy || 'oldest_first';

      // 4. Calculate allocations
      const allocations = await this.calculateAllocations(
        tx,
        paymentRecord.id,
        request.clientId,
        request.amount,
        request.invoiceIds,
        strategy,
        tenantId
      );

      // 5. Apply allocations
      if (allocations.length > 0) {
        await this.applyAllocations(tx, paymentRecord.id, allocations, createdBy);
        
        // Update payment with allocated amount
        const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
        await tx.update(payments)
          .set({
            allocatedAmount: totalAllocated,
            status: totalAllocated >= request.amount ? 'completed' : 'partially_allocated',
            updatedAt: new Date()
          })
          .where(eq(payments.id, paymentRecord.id));
      }

      // 6. Emit domain events
      await this.emitEvent('PaymentProcessed', {
        paymentId: paymentRecord.id,
        clientId: request.clientId,
        amount: request.amount,
        allocatedAmount: allocations.reduce((sum, alloc) => sum + alloc.amount, 0),
        allocationCount: allocations.length
      });

      return paymentRecord;
    });
  }

  /**
   * Calculate how to allocate a payment across invoices
   */
  private async calculateAllocations(
    tx: Database,
    paymentId: string,
    clientId: string,
    paymentAmount: number,
    specificInvoiceIds?: string[],
    strategy: 'oldest_first' | 'newest_first' | 'proportional' | 'manual' = 'oldest_first',
    tenantId: string = ''
  ): Promise<PaymentAllocation[]> {
    let query = tx
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoice_number,
        totalAmount: invoices.total_amount,
        paidAmount: invoices.paid_amount,
        balanceAmount: invoices.balance_amount,
        dueDate: invoices.due_date,
        status: invoices.status
      })
      .from(invoices)
      .where(and(
        eq(invoices.client_id, clientId),
        eq(invoices.tenant_id, tenantId),
        gt(invoices.balance_amount, 0), -- Only invoices with remaining balance
        sql`${invoices.status} IN ('sent', 'partially_paid')` -- Only active invoices
      ));

    // Filter to specific invoices if provided
    if (specificInvoiceIds && specificInvoiceIds.length > 0) {
      query = query.where(and(
        query.getSQL().where,
        sql`${invoices.id} IN ${specificInvoiceIds}`
      ));
    }

    // Apply ordering based on strategy
    switch (strategy) {
      case 'oldest_first':
        query = query.orderBy(invoices.due_date, invoices.issue_date);
        break;
      case 'newest_first':
        query = query.orderBy(desc(invoices.due_date), desc(invoices.issue_date));
        break;
      case 'proportional':
        // For proportional, we'll handle in the allocation logic
        query = query.orderBy(invoices.due_date);
        break;
      case 'manual':
        // Manual allocation relies on specificInvoiceIds
        break;
    }

    const outstandingInvoices = await query;

    if (outstandingInvoices.length === 0) {
      return []; // No invoices to allocate to
    }

    return this.performAllocation(outstandingInvoices, paymentAmount, strategy);
  }

  /**
   * Perform the actual allocation calculation
   */
  private performAllocation(
    invoices: any[],
    paymentAmount: number,
    strategy: string
  ): PaymentAllocation[] {
    const allocations: PaymentAllocation[] = [];
    let remainingAmount = paymentAmount;

    switch (strategy) {
      case 'oldest_first':
      case 'newest_first':
      case 'manual':
        // Sequential allocation
        for (const invoice of invoices) {
          if (remainingAmount <= 0) break;

          const allocationAmount = Math.min(remainingAmount, invoice.balanceAmount);
          allocations.push({
            invoiceId: invoice.id,
            amount: allocationAmount,
            invoiceBalance: invoice.balanceAmount,
            willBeFullyPaid: allocationAmount >= invoice.balanceAmount
          });

          remainingAmount -= allocationAmount;
        }
        break;

      case 'proportional':
        // Proportional allocation across all invoices
        const totalBalance = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
        
        for (const invoice of invoices) {
          if (remainingAmount <= 0) break;

          const proportionalAmount = (invoice.balanceAmount / totalBalance) * paymentAmount;
          const allocationAmount = Math.min(proportionalAmount, invoice.balanceAmount);
          
          allocations.push({
            invoiceId: invoice.id,
            amount: allocationAmount,
            invoiceBalance: invoice.balanceAmount,
            willBeFullyPaid: allocationAmount >= invoice.balanceAmount
          });

          remainingAmount -= allocationAmount;
        }
        break;
    }

    return allocations.filter(alloc => alloc.amount > 0);
  }

  /**
   * Apply allocations to invoices and update their status
   */
  private async applyAllocations(
    tx: Database,
    paymentId: string,
    allocations: PaymentAllocation[],
    createdBy: string
  ): Promise<void> {
    for (const allocation of allocations) {
      // Create allocation record
      await tx.insert(paymentAllocations).values({
        paymentId,
        invoiceId: allocation.invoiceId,
        amount: allocation.amount,
        allocationType: 'automatic',
        createdBy
      });

      // Update invoice paid amount
      await tx.execute(sql`
        UPDATE invoices 
        SET 
          paid_amount = paid_amount + ${allocation.amount},
          updated_at = now(),
          last_payment_date = now()
        WHERE id = ${allocation.invoiceId}
      `);

      // Check if invoice is now fully paid and update status
      if (allocation.willBeFullyPaid) {
        await tx.execute(sql`
          UPDATE invoices 
          SET status = 'paid',
              updated_at = now()
          WHERE id = ${allocation.invoiceId}
            AND balance_amount - ${allocation.amount} <= 0
        `);

        // Emit domain event for fully paid invoice
        await this.emitEvent('InvoicePaid', {
          invoiceId: allocation.invoiceId,
          paymentId,
          amount: allocation.amount
        });
      } else {
        // Update status to partially_paid if it wasn't already
        await tx.execute(sql`
          UPDATE invoices 
          SET status = 'partially_paid',
              updated_at = now()
          WHERE id = ${allocation.invoiceId}
            AND status = 'sent'
        `);

        // Emit domain event for partial payment
        await this.emitEvent('InvoicePartialPayment', {
          invoiceId: allocation.invoiceId,
          paymentId,
          amount: allocation.amount,
          remainingBalance: allocation.invoiceBalance - allocation.amount
        });
      }
    }
  }

  /**
   * Manually allocate payment to specific invoices
   */
  async manualAllocation(
    paymentId: string,
    allocations: { invoiceId: string; amount: number }[],
    tenantId: string,
    createdBy: string
  ): Promise<void> {
    return await this.db.transaction(async (tx) => {
      // Verify payment exists and belongs to tenant
      const payment = await tx
        .select()
        .from(payments)
        .where(and(
          eq(payments.id, paymentId),
          eq(payments.tenant_id, tenantId)
        ))
        .limit(1);

      if (!payment[0]) {
        throw new PaymentProcessingError('Payment not found');
      }

      if (payment[0].status !== 'processing') {
        throw new PaymentProcessingError('Payment cannot be modified in current status');
      }

      const unallocatedAmount = payment[0].amount - payment[0].allocatedAmount;
      const totalAllocationAmount = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

      if (totalAllocationAmount > unallocatedAmount) {
        throw new InsufficientFundsError('Allocation amount exceeds available funds');
      }

      // Apply each allocation
      for (const allocation of allocations) {
        // Verify invoice exists and has sufficient balance
        const invoice = await tx
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, allocation.invoiceId),
            eq(invoices.tenant_id, tenantId),
            gt(invoices.balance_amount, 0)
          ))
          .limit(1);

        if (!invoice[0]) {
          throw new PaymentProcessingError(`Invoice ${allocation.invoiceId} not found or already paid`);
        }

        const maxAllocation = Math.min(allocation.amount, invoice[0].balanceAmount);
        
        await this.applyAllocations(tx, paymentId, [{
          invoiceId: allocation.invoiceId,
          amount: maxAllocation,
          invoiceBalance: invoice[0].balanceAmount,
          willBeFullyPaid: maxAllocation >= invoice[0].balanceAmount
        }], createdBy);
      }

      // Update payment status
      const newAllocatedAmount = payment[0].allocatedAmount + totalAllocationAmount;
      await tx.update(payments)
        .set({
          allocatedAmount: newAllocatedAmount,
          status: newAllocatedAmount >= payment[0].amount ? 'completed' : 'partially_allocated',
          updatedAt: new Date()
        })
        .where(eq(payments.id, paymentId));
    });
  }

  /**
   * Get payment allocation details
   */
  async getPaymentAllocations(paymentId: string, tenantId: string): Promise<PaymentAllocationDetail[]> {
    const allocations = await this.db
      .select({
        id: paymentAllocations.id,
        invoiceId: paymentAllocations.invoice_id,
        invoiceNumber: invoices.invoice_number,
        amount: paymentAllocations.amount,
        allocationDate: paymentAllocations.allocation_date,
        allocationType: paymentAllocations.allocation_type,
        invoiceStatus: invoices.status,
        invoiceTotalAmount: invoices.total_amount,
        invoicePaidAmount: invoices.paid_amount,
        invoiceBalanceAmount: invoices.balance_amount
      })
      .from(paymentAllocations)
      .leftJoin(invoices, eq(paymentAllocations.invoice_id, invoices.id))
      .where(and(
        eq(paymentAllocations.payment_id, paymentId),
        eq(paymentAllocations.tenant_id, tenantId)
      ))
      .orderBy(paymentAllocations.allocation_date);

    return allocations.map(alloc => ({
      id: alloc.id,
      invoiceId: alloc.invoiceId,
      invoiceNumber: alloc.invoiceNumber,
      amount: alloc.amount,
      allocationDate: alloc.allocationDate,
      allocationType: alloc.allocationType,
      invoiceStatus: alloc.invoiceStatus,
      invoiceTotalAmount: alloc.invoiceTotalAmount,
      invoicePaidAmount: alloc.invoicePaidAmount,
      invoiceBalanceAmount: alloc.invoiceBalanceAmount
    }));
  }

  /**
   * Get client payment summary
   */
  async getClientPaymentSummary(
    clientId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ClientPaymentSummary> {
    let paymentsQuery = this.db
      .select({
        totalPaid: sql<number>`SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END)`,
        totalPending: sql<number>`SUM(CASE WHEN status = 'pending' OR status = 'processing' THEN amount ELSE 0 END)`,
        paymentCount: sql<number>`COUNT(*)`
      })
      .from(payments)
      .where(and(
        eq(payments.client_id, clientId),
        eq(payments.tenant_id, tenantId)
      ));

    if (startDate) {
      paymentsQuery = paymentsQuery.where(and(
        paymentsQuery.getSQL().where,
        gte(payments.payment_date, startDate)
      ));
    }

    if (endDate) {
      paymentsQuery = paymentsQuery.where(and(
        paymentsQuery.getSQL().where,
        lte(payments.payment_date, endDate)
      ));
    }

    const paymentsResult = await paymentsQuery;

    // Get outstanding invoices
    const outstandingInvoices = await this.db
      .select({
        totalOutstanding: sql<number>`SUM(balance_amount)`,
        invoiceCount: sql<number>`COUNT(*)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.client_id, clientId),
        eq(invoices.tenant_id, tenantId),
        gt(invoices.balance_amount, 0),
        sql`${invoices.status} IN ('sent', 'partially_paid')`
      ));

    return {
      totalPaid: paymentsResult[0]?.totalPaid || 0,
      totalPending: paymentsResult[0]?.totalPending || 0,
      paymentCount: paymentsResult[0]?.paymentCount || 0,
      totalOutstanding: outstandingInvoices[0]?.totalOutstanding || 0,
      outstandingInvoiceCount: outstandingInvoices[0]?.invoiceCount || 0
    };
  }

  /**
   * Emit domain events (implementation depends on your event system)
   */
  private async emitEvent(eventName: string, data: any): Promise<void> {
    // Implementation depends on your event bus system
    // This could be using EventEmitter, DomainEventBus, etc.
    console.log(`Emitting event: ${eventName}`, data);
  }
}
```

### 3. API Endpoints

```typescript
// src/routes/payments.ts
import { Router } from 'express';
import { PaymentAllocationService } from '../services/PaymentAllocationService';
import { validateRequest } from '../middleware/validation';
import { createPaymentSchema, manualAllocationSchema } from '../schemas/payments';

const router = Router();

// POST /api/payments - Process new payment
router.post('/', validateRequest(createPaymentSchema), async (req, res, next) => {
  try {
    const payment = await paymentAllocationService.processPayment(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ payment });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:id/allocate - Manual allocation
router.post('/:id/allocate', 
  validateRequest(manualAllocationSchema),
  async (req, res, next) => {
    try {
      await paymentAllocationService.manualAllocation(
        req.params.id,
        req.body.allocations,
        req.tenant.id,
        req.user.id
      );

      res.json({ message: 'Allocation completed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/payments/:id/allocations - Get payment allocations
router.get('/:id/allocations', async (req, res, next) => {
  try {
    const allocations = await paymentAllocationService.getPaymentAllocations(
      req.params.id,
      req.tenant.id
    );

    res.json({ allocations });
  } catch (error) {
    next(error);
  }
});

// GET /api/clients/:clientId/payment-summary - Get client payment summary
router.get('/clients/:clientId/payment-summary', async (req, res, next) => {
  try {
    const summary = await paymentAllocationService.getClientPaymentSummary(
      req.params.clientId,
      req.tenant.id,
      req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      req.query.endDate ? new Date(req.query.endDate as string) : undefined
    );

    res.json({ summary });
  } catch (error) {
    next(error);
  }
});
```

## Implementation Checklist

- [ ] Create payment and allocation database schema
- [ ] Implement PaymentAllocationService with all core methods
- [ ] Add transaction support for atomic operations
- [ ] Create allocation strategies (oldest_first, newest_first, proportional)
- [ ] Implement automatic invoice status updates
- [ ] Create API endpoints with proper validation
- [ ] Add domain events for payment lifecycle
- [ ] Implement manual allocation functionality
- [ ] Add comprehensive error handling
- [ ] Create integration tests for all scenarios
- [ ] Add payment reconciliation reports
- [ ] Implement audit logging for all payment operations

## Testing Requirements

### Unit Tests
- Test allocation calculation algorithms
- Test invoice status transitions
- Test transaction rollback scenarios
- Test payment processing logic

### Integration Tests
- Test end-to-end payment processing
- Test concurrent payment allocations
- Test payment processor integration
- Test manual allocation overrides

### Edge Cases
- Test insufficient funds scenarios
- Test duplicate payment handling
- Test payment refunds and reversals
- Test currency conversion scenarios

## Security Considerations

- All payment operations require proper authorization
- Audit trail for all payment modifications
- Input validation for all monetary values
- Rate limiting on payment endpoints
- Secure handling of payment processor responses
- Tenant isolation enforced at database level

## Performance Optimizations

- Database indexes on payment queries
- Efficient allocation calculations
- Batch processing for bulk payments
- Caching for client payment summaries

## Monitoring

- Track payment processing success rates
- Monitor allocation performance
- Alert on payment failures
- Track invoice payment aging
- Monitor payment processor response times
