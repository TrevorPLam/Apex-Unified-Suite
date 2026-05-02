---
trigger: model_decision
description: Defines valid status transitions: draft → sent → paid, draft → void, sent → overdue, etc. Any other transition must be rejected with InvalidInvoiceStatusTransition.
---

# Invoice Status Transitions Rule

## Purpose

Enforce strict invoice status transition rules to maintain financial data integrity. Only predefined status transitions are allowed, and any invalid transition must result in an `InvalidInvoiceStatusTransition` error.

## Allowed Status Transitions

### Accounts Receivable (AR) Invoices

**Valid transitions:**
- `draft` → `sent`
- `draft` → `void`
- `sent` → `paid`
- `sent` → `overdue`
- `sent` → `void`
- `overdue` → `paid`
- `overdue` → `void`
- `paid` → `void` (with reversal)
- `void` → `draft` (with reversal)

### Accounts Payable (AP) Invoices

**Valid transitions:**
- `draft` → `sent`
- `draft` → `void`
- `sent` → `paid`
- `sent` → `void`
- `paid` → `void` (with reversal)

### Terminal States

**Final states (no further transitions allowed):**
- `paid`
- `void`

## Implementation Requirements

### Service Layer Validation

```typescript
// src/services/InvoiceService.ts
export class InvoiceService {
  constructor(private db: Database) {}

  async updateInvoiceStatus(
    invoiceId: string,
    newStatus: string,
    tenantId: string,
    updatedBy: string,
    reason?: string
  ): Promise<Invoice> {
    return await this.db.transaction(async (tx) => {
      // Get current invoice
      const currentInvoice = await tx
        .select()
        .from(invoices)
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.tenant_id, tenantId)
        ))
        .limit(1);

      if (!currentInvoice[0]) {
        throw new InvoiceNotFoundError('Invoice not found');
      }

      const currentStatus = currentInvoice[0].status;
      const invoiceType = currentInvoice[0].invoice_type;

      // Validate status transition
      this.validateStatusTransition(
        invoiceType,
        currentStatus,
        newStatus
      );

      // Update invoice status
      const updatedInvoice = await tx
        .update(invoices)
        .set({
          status: newStatus,
          updatedAt: new Date(),
          updatedBy,
          // Set specific timestamps for certain transitions
          ...(newStatus === 'sent' && { sentAt: new Date() }),
          ...(newStatus === 'paid' && { paidAt: new Date(), lastPaymentDate: new Date() }),
          ...(newStatus === 'overdue' && { becameOverdueAt: new Date() }),
          ...(newStatus === 'void' && { voidedAt: new Date(), voidReason: reason })
        })
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.tenant_id, tenantId)
        ))
        .returning();

      // Handle side effects for specific transitions
      await this.handleStatusTransitionEffects(
        tx,
        updatedInvoice[0],
        currentStatus,
        newStatus,
        tenantId,
        updatedBy
      );

      // Emit domain event
      await this.emitEvent('InvoiceStatusChanged', {
        invoiceId,
        invoiceType,
        previousStatus: currentStatus,
        newStatus,
        updatedBy,
        reason
      });

      return updatedInvoice[0];
    });
  }

  private validateStatusTransition(
    invoiceType: string,
    currentStatus: string,
    newStatus: string
  ): void {
    const validTransitions = this.getValidTransitions(invoiceType);
    
    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new InvalidInvoiceStatusTransitionError(
        `Invalid invoice status transition: ${currentStatus} → ${newStatus} for ${invoiceType} invoice`
      );
    }
  }

  private getValidTransitions(invoiceType: string): Record<string, string[]> {
    const arTransitions = {
      'draft': ['sent', 'void'],
      'sent': ['paid', 'overdue', 'void'],
      'overdue': ['paid', 'void'],
      'paid': ['void'],
      'void': ['draft'] // With reversal capability
    };

    const apTransitions = {
      'draft': ['sent', 'void'],
      'sent': ['paid', 'void'],
      'paid': ['void'], // With reversal capability
      'void': ['draft'] // With reversal capability
    };

    return invoiceType === 'ar' ? arTransitions : apTransitions;
  }

  private async handleStatusTransitionEffects(
    tx: Database,
    invoice: Invoice,
    previousStatus: string,
    newStatus: string,
    tenantId: string,
    updatedBy: string
  ): Promise<void> {
    // Handle payment allocation when invoice is marked as paid
    if (newStatus === 'paid' && previousStatus !== 'paid') {
      await this.processPaymentCompletion(tx, invoice, tenantId);
    }

    // Update client financial metrics
    if (['sent', 'paid', 'overdue'].includes(newStatus)) {
      await this.updateClientFinancialMetrics(
        tx,
        invoice.client_id,
        tenantId
      );
    }

    // Send notifications for specific transitions
    if (newStatus === 'sent' && previousStatus === 'draft') {
      await this.sendInvoiceNotification(tx, invoice, 'invoice_sent');
    } else if (newStatus === 'overdue') {
      await this.sendInvoiceNotification(tx, invoice, 'invoice_overdue');
    } else if (newStatus === 'paid') {
      await this.sendInvoiceNotification(tx, invoice, 'invoice_paid');
    }
  }

  private async processPaymentCompletion(
    tx: Database,
    invoice: Invoice,
    tenantId: string
  ): Promise<void> {
    // Update related payment records
    await tx
      .update(payments)
      .set({
        status: 'completed',
        completedAt: new Date()
      })
      .where(and(
        eq(payments.invoice_id, invoice.id),
        eq(payments.tenant_id, tenantId),
        eq(payments.status, 'processing')
      ));

    // Update project financial metrics if applicable
    if (invoice.project_id) {
      await this.updateProjectFinancialMetrics(
        tx,
        invoice.project_id,
        tenantId
      );
    }
  }

  private async updateClientFinancialMetrics(
    client: string,
    tenantId: string
  ): Promise<void> {
    // Update client's total outstanding, paid amounts, etc.
    const metrics = await this.db
      .select({
        totalInvoiced: sql<number>`SUM(CASE WHEN status IN ('sent', 'overdue') THEN amount ELSE 0 END)`,
        totalPaid: sql<number>`SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)`,
        totalOverdue: sql<number>`SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.client_id, client),
        eq(invoices.tenant_id, tenantId),
        eq(invoices.is_active, true)
      ));

    await this.db
      .update(clients)
      .set({
        totalInvoiced: metrics[0]?.totalInvoiced || 0,
        totalPaid: metrics[0]?.totalPaid || 0,
        totalOverdue: metrics[0]?.totalOverdue || 0,
        updatedAt: new Date()
      })
      .where(eq(clients.id, client));
  }

  private async updateProjectFinancialMetrics(
    project: string,
    tenantId: string
  ): Promise<void> {
    // Update project's financial metrics
    const metrics = await this.db
      .select({
        totalInvoiced: sql<number>`SUM(CASE WHEN status IN ('sent', 'overdue') THEN amount ELSE 0 END)`,
        totalPaid: sql<number>`SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)`,
        totalOverdue: sql<number>`SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.project_id, project),
        eq(invoices.tenant_id, tenantId),
        eq(invoices.is_active, true)
      ));

    await this.db
      .update(projects)
      .set({
        totalInvoiced: metrics[0]?.totalInvoiced || 0,
        totalPaid: metrics[0]?.totalPaid || 0,
        totalOverdue: metrics[0]?.totalOverdue || 0,
        updatedAt: new Date()
      })
      .where(eq(projects.id, project));
  }

  private async sendInvoiceNotification(
    tx: Database,
    invoice: Invoice,
    notificationType: string
  ): Promise<void> {
    // Create notification record
    await tx.insert(notifications).values({
      tenantId: invoice.tenant_id,
      clientId: invoice.client_id,
      type: 'invoice',
      title: `Invoice ${notificationType}`,
      message: `Invoice #${invoice.invoice_number} ${notificationType.replace('_', ' ')}`,
      entityId: invoice.id,
      entityType: 'invoice',
      status: 'pending',
      data: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.total_amount,
        dueDate: invoice.due_date
      },
      createdAt: new Date(),
      scheduledFor: new Date()
    });
  }
}
```

### Domain Error Classes

```typescript
export class InvalidInvoiceStatusTransitionError extends DomainError {
  constructor(
    message: string,
    public readonly details: {
      invoiceId: string;
      invoiceType: string;
      currentStatus: string;
      newStatus: string;
      validTransitions: string[];
    }
  ) {
    super('INVALID_INVOICE_STATUS_TRANSITION', message, details);
  }
}

export class InvoiceNotFoundError extends DomainError {
  constructor(invoiceId: string) {
    super('INVOICE_NOT_FOUND', `Invoice not found: ${invoiceId}`);
  }
}
```

### API Layer Implementation

```typescript
// src/routes/invoices.ts
router.patch('/:id/status', validateRequest(updateStatusSchema), async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    
    const invoice = await invoiceService.updateInvoiceStatus(
      req.params.id,
      status,
      req.tenant.id,
      req.user.id,
      reason
    );

    res.json({ invoice });
  } catch (error) {
    if (error instanceof InvalidInvoiceStatusTransitionError) {
      return res.status(422).json({
        error: error.message,
        code: error.code,
        details: {
          invoiceId: error.details.invoiceId,
          invoiceType: error.details.invoiceType,
          currentStatus: error.details.currentStatus,
          newStatus: error.details.newStatus,
          validTransitions: error.details.validTransitions
        },
        suggestions: [
          'Check the current invoice status',
          'Verify the intended status transition',
          'Contact support for status clarification'
        ],
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});

// GET /api/invoices/:id/transitions
router.get('/:id/transitions', async (req, res, next) => {
  try {
    const invoice = await invoiceService.findById(req.params.id, req.tenant.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const validTransitions = invoiceService.getValidTransitions(invoice.invoice_type);
    
    res.json({
      currentStatus: invoice.status,
      validTransitions,
      canVoid: invoice.status !== 'void',
      canReverse: invoice.status !== 'draft'
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for invoice status management
export const InvoiceStatusManager: ReactFC<{ invoice: Invoice }> = ({ invoice }) => {
  const [updating, setUpdating] = useState(false);
  const [availableTransitions, setAvailableTransitions] = useState<string[]>([]);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    // Load available transitions
    loadAvailableTransitions();
  }, [invoice.id]);

  const loadAvailableTransitions = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/transitions`);
      const data = await response.json();
      setAvailableTransitions(data.validTransitions);
    } catch (error) {
      console.error('Failed to load transitions:', error);
    }
  };

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    setUpdating(true);
    setStatusError(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        onStatusUpdated(updatedInvoice);
        await loadAvailableTransitions(); // Refresh transitions
      }
    } catch (error) {
      if (error instanceof ResponseError && error.status === 422) {
        const errorData = await error.response.json();
        setStatusError(errorData.error);
      } else {
        setStatusError('Failed to update invoice status');
      }
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      draft: 'gray',
      sent: 'blue',
      paid: 'green',
      overdue: 'red',
      void: 'black'
    };
    return colors[status as keyof typeof colors] || 'gray';
  };

  const getStatusIcon = (status: string): string => {
    const icons = {
      draft: 'file-text',
      sent: 'send',
      paid: 'check-circle',
      overdue: 'alert-triangle',
      void: 'x-circle'
    };
    return icons[status as keyof typeof icons] || 'file-text';
  };

  return (
    <div className="invoice-status-manager">
      <div className="status-display">
        <span className={`status-indicator ${getStatusColor(invoice.status)}`}>
          {getStatusIcon(invoice.status)}
        </span>
        <span className="status-text">{invoice.status.toUpperCase()}</span>
      </div>

      <div className="status-actions">
        <StatusDropdown
          currentStatus={invoice.status}
          availableTransitions={availableTransitions}
          onStatusChange={handleStatusChange}
          disabled={updating}
        />
      </div>

      {statusError && (
        <div className="error-message">
          {statusError}
        </div>
      )}

      {updating && (
        <div className="updating-indicator">
          Updating...
        </div>
      )}
    </div>
  );
};

// Status dropdown component
const StatusDropdown: React.FC<{
  currentStatus: string;
  availableTransitions: string[];
  onStatusChange: (status: string, reason?: string) => void;
  disabled: boolean;
}> = ({ 
  currentStatus, 
  availableTransitions, 
  onStatusChange, 
  disabled 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown open={isOpen} onOpenChange={setIsOpen}>
      <DropdownTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {currentStatus.toUpperCase()} <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end">
        {availableTransitions.map(status => (
          <DropdownItem
            key={status}
            onClick={() => {
              onStatusChange(status);
              setIsOpen(false);
            }}
          >
            {status.toUpperCase()}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
};
```

### Database Schema Constraints

```sql
-- Invoices table with status constraints
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number VARCHAR(50) NOT NULL,
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('ar', 'ap')),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'paid', 'overdue', 'void')
  ),
  
  -- Timestamps for status transitions
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  became_overdue_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  last_payment_date TIMESTAMPTZ,
  
  metadata JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Unique constraint for invoice numbers
CREATE UNIQUE INDEX idx_invoices_tenant_number ON invoices(tenant_id, invoice_number);

-- Indexes for status queries
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_project ON invoices(project_id);

-- Check constraint for status transitions
CREATE OR REPLACE FUNCTION validate_invoice_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the old and new status
  DECLARE old_status TEXT;
  DECLARE new_status TEXT;
  DECLARE invoice_type TEXT;
  
  SELECT status INTO old_status FROM invoices WHERE id = NEW.id;
  SELECT invoice_type INTO invoice_type FROM invoices WHERE id = NEW.id;
  SELECT NEW.status INTO new_status;
  
  -- Check if transition is valid
  IF NOT EXISTS (
    SELECT 1 FROM valid_transitions 
    WHERE invoice_type = invoice_type 
      AND current_status = old_status 
      AND next_status = new_status
  ) THEN
    RAISE EXCEPTION 'Invalid invoice status transition: % → %', old_status, new_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_invoice_status_transition
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION validate_invoice_status_transition();
```

## Testing Requirements

### Unit Tests

**Test status transition validation:**

```typescript
describe('Invoice Status Transitions', () => {
  test('should allow valid AR transitions', async () => {
    const invoice = await createInvoice({ status: 'draft', invoice_type: 'ar' });
    
    // draft → sent
    const updated = await invoiceService.updateInvoiceStatus(
      invoice.id,
      'sent',
      tenantId,
      userId
    );
    expect(updated.status).toBe('sent');
    
    // sent → paid
    const paid = await invoiceService.updateInvoiceStatus(
      invoice.id,
      'paid',
      tenantId,
      userId
    );
    expect(paid.status).toBe('paid');
  });

  test('should reject invalid transitions', async () => {
    const invoice = await createInvoice({ status: 'sent', invoice_type: 'ar' });
    
    // sent → draft (invalid)
    await expect(
      invoiceService.updateInvoiceStatus(invoice.id, 'draft', tenantId, userId)
    ).rejects.toThrow(InvalidInvoiceStatusTransitionError);
    
    // paid → sent (invalid)
    await expect(
      invoiceService.updateInvoiceStatus(invoice.id, 'sent', tenantId, userId)
    ).rejects.toThrow(InvalidInvoiceStatusTransitionError);
  });

  test('should allow void → draft reversal with proper permissions', async () => {
    const invoice = await createInvoice({ status: 'void', invoice_type: 'ar' });
    
    const updated = await invoiceService.updateInvoiceStatus(
      invoice.id,
      'draft',
      tenantId,
      userId,
      'Reversal requested'
    );
    expect(updated.status).toBe('draft');
  });
});
```

### Integration Tests

**Test end-to-end status workflows:**

1. **Invoice Lifecycle**: Complete invoice from draft to paid
2. **Payment Processing**: Status updates trigger payment allocation
3. **Notification System**: Proper notifications sent for status changes
4. **Financial Metrics**: Client and project metrics updated correctly

### Edge Cases

**Test these scenarios:**

1. **Concurrent Updates**: Handle simultaneous status changes
2. **Status Reversal**: Reversal permissions and audit trail
3. **Cross-Tenant Access**: Prevent cross-tenant status changes
4. **Database Constraints**: Database enforces transition rules

## Performance Considerations

### Efficient Status Queries

```typescript
// Optimized query for status-based filtering
private async getInvoicesByStatus(
  tenantId: string,
  status: string,
  limit: number = 50
): Promise<Invoice[]> {
  return await this.db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.tenant_id, tenantId),
      eq(invoices.status, status),
      eq(invoices.is_active, true)
    ))
    .orderBy(desc(invoices.created_at))
    .limit(limit);
}
```

### Database Indexes

```sql
-- Optimize status-based queries
CREATE INDEX idx_invoices_status_tenant ON invoices(status, tenant_id);
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX idx_invoices_due_date_status ON invoices(due_date, status);
CREATE INDEX idx_invoices_amount_status ON invoices(total_amount, status);
```

## Enforcement Checklist

- [ ] Status transitions are validated before database update
- [ ] Database constraints prevent invalid transitions
- **[ ] All API endpoints enforce transition rules**
- [ ] Frontend shows only valid transition options
- [ ] Comprehensive test coverage for all transition scenarios
- [ ] Side effects are handled for specific transitions
- [ ] Audit trail tracks all status changes
- [ ] Error handling prevents invalid transitions
- [ ] Performance optimization for status-based queries
- [ **[ ] Database triggers enforce constraints at database level**
- [ ] Client and project metrics updated automatically
- [ ] Notification system triggers for important transitions
- [ ] Status reversal requires proper authorization
- [ ] Cross-tenant isolation is maintained
