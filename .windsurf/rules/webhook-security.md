---
trigger: model_decision
description: Phase 4 has a SignWell webhook receiver. A rule must enforce HMAC signature verification and webhook-idempotency (store processed webhook IDs).
---

# Webhook Security Rule

## Purpose

Enforce strict security for all webhook endpoints, particularly the SignWell webhook receiver. Must enforce HMAC signature verification and implement webhook-idempotency by storing processed webhook IDs to prevent duplicate processing.

## Core Security Requirements

### HMAC Signature Verification

**All webhook endpoints must:**

1. **Verify Signature**: Validate HMAC signature using shared secret
2. **Check Timestamp**: Ensure request is within acceptable time window
3. **Validate Body**: Ensure body content matches signature
4. **Replay Attack Prevention**: Prevent replay attacks with timestamp checks

### Webhook ID Management

**Idempotency requirements:**

1. **Store Processed IDs**: Track all successfully processed webhook IDs
2. **Duplicate Prevention**: Reject duplicate webhook IDs with 409 status
3. **Cleanup**: Clean up old processed IDs periodically
4. **Audit Trail**: Log all webhook processing attempts

## Implementation Requirements

### Webhook Signature Verification Service

```typescript
// src/services/WebhookSecurityService.ts
export class WebhookSecurityService {
  constructor(
    private webhookConfig: WebhookConfig
  ) {}

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    algorithm: string,
    timestamp: string,
    nonce?: string
  ): Promise<boolean> {
    try {
      // Get the appropriate secret for the algorithm
      const secret = this.getSecret(algorithm);
      
      // Create the expected signature
      const expectedSignature = crypto
        .createHmac(secret, payload, algorithm)
        .digest('hex');

      // Compare signatures
      const providedSignature = Buffer.from(signature, 'hex');
      const expectedSignatureHex = Buffer.from(expectedSignature, 'hex');

      return crypto.timingSafeEqual(
        providedSignature,
        expectedSignatureHex
      );
    } catch (error) {
      return false;
    }
  }

  private getSecret(algorithm: string): string {
    const secrets = this.webhookConfig.secrets;
    
    switch (algorithm) {
      case 'sha256':
        return secrets.sha256;
      case 'sha1':
        return secrets.sha1;
      case 'hmac-sha256':
        return secrets.hmacSha256;
      default:
        throw new Error(`Unsupported signature algorithm: ${algorithm}`);
    }
  }

  async validateTimestamp(
    timestamp: string,
    maxAgeSeconds: number = 300 // 5 minutes default
  ): Promise<boolean> {
    try {
      const requestTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      
      const timeDiff = Math.abs(currentTime - requestTime);
      
      return timeDiff <= maxAgeSeconds;
    } catch (error) {
      return false;
    }
  }

  async validateBodyIntegrity(
    payload: string,
    signature: string,
    algorithm: string,
    timestamp: string
  ): Promise<boolean> {
    try {
      // Recreate the signature to validate body integrity
      const expectedSignature = crypto
        .createHmac(this.getSecret(algorithm), payload, algorithm)
        .digest('hex');

      const providedSignature = Buffer.from(signature, 'hex');
      const expectedSignatureHex = Buffer.from(expectedSignature, 'hex');

      return crypto.timingSafeEqual(
        providedSignature,
        expectedSignatureHex
      );
    } catch (error) {
      return false;
    }
  }
}
```

### Webhook ID Management Service

```typescript
// src/services/WebhookIdempotencyService.ts
export class WebhookIdempotencyService {
  constructor(
    private db: Database,
    private cleanupDays: number = 30 // Keep records for 30 days
  ) {}

  async isProcessed(
    webhookId: string,
    tenantId: string
  ): Promise<boolean> {
    const record = await this.db
      .select()
      .from(processed_webhooks)
      .where(and(
        eq(processed_webhooks.webhook_id, webhookId),
        eq(processed_webhooks.tenant_id, tenantId),
        eq(processed_webhooks.processed, true)
      ))
      .limit(1);

    return record.length > 0;
  }

  async markAsProcessed(
    webhookId: string,
    tenantId: string,
    requestHeaders: Record<string, string>,
    requestBody: string,
    responseStatus: number,
    responseBody: string
  ): Promise<void> {
    await this.db.insert(processed_webhooks).values({
      webhookId,
      tenantId,
      requestHeaders,
      requestBody: requestBody,
      responseStatus,
      responseBody,
      processedAt: new Date(),
      processed: true
    }).onConflict(() => {
      // Handle duplicate ID gracefully
      console.warn(`Duplicate webhook ID: ${webhookId}`);
    });
  }

  async cleanupOldProcessedIds(
    tenantId: string
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cleanupDays);

    const deletedCount = await this.db
      .delete(processed_webhooks)
      .where(and(
        eq(processed_webhooks.tenant_id, tenantId),
        eq(processed_webhooks.processed, true),
        lt(processed_webhooks.processed_at, cutoffDate)
      ));

    return deletedCount;
  }

  async getProcessedWebhooks(
    tenantId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ProcessedWebhook[]> {
    return await this.db
      .select({
        id: processed_webhooks.id,
        webhookId: processed_webhooks.webhook_id,
        requestHeaders: processed_webhooks.request_headers,
        requestBody: processed_webhooks.request_body,
        responseStatus: processed_webhooks.response_status,
        responseBody: processed_webhooks.response_body,
        processedAt: processed_webhooks.processed_at,
        createdAt: processed_webhooks.created_at
      })
      .where(and(
        eq(processed_webhooks.tenant_id, tenantId),
        eq(processed_webhooks.processed, true)
      ))
      .orderBy(desc(processed_webhooks.processed_at))
      .limit(limit)
      .offset(offset);
  }
}
```

### Webhook Receiver Implementation

```typescript
// src/controllers/WebhookController.ts
export class WebhookController {
  constructor(
    private webhookSecurityService: WebhookService,
    private webhookIdempotencyService: WebhookIdempotencyService,
    private invoiceService: InvoiceService
  ) {}

  async handleSignWellWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const signature = req.headers['x-signature'];
      const timestamp = req.headers['x-timestamp'];
      const algorithm = req.headers['x-algorithm'];
      const body = req.body;

      // Verify signature
      const isValid = await this.webhookSecurityService.verifyWebhookSignature(
        body,
        signature,
        algorithm,
        timestamp
      );

      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }

      // Validate timestamp
      const isTimestampValid = await this.webhookSecurityService.validateTimestamp(
        timestamp
      );

      if (!isTimestampValid) {
        return res.status(401).json({
          error: 'Request timestamp too old',
          code: 'EXPIRED_TIMESTAMP'
        });
      }

      // Validate body integrity
      const isBodyValid = await this.webhookSecurityService.validateBodyIntegrity(
        body,
        signature,
        algorithm,
        timestamp
      );

      if (!isBodyValid) {
        return res.status(400).json({
          error: 'Body integrity check failed',
          code: 'INVALID_BODY'
        }));
      }

      // Check for duplicate webhook ID
      const webhookId = req.headers['x-webhook-id'];
      const isDuplicate = await this.webhookIdempotencyService.isProcessed(
        webhookId,
        req.tenantId
      );

      if (isDuplicate) {
        return res.status(409).json({
          error: 'Webhook already processed',
          code: 'DUPLICATE_WEBHOOK',
          webhookId
        }));
      }

      // Process the webhook
      const result = await this.processSignWellWebhook(
        body,
        req.headers,
        req.ip
      );

      // Mark as processed
      await this.webhookIdempotencyService.markAsProcessed(
        webhookId,
        req.tenantId,
        req.headers,
        body,
        result.status,
        result.body,
        result.headers
      );

      res.status(result.status).json(result.body);

    } catch (error) {
      console.error('Webhook processing failed:', error);
      next(error);
    }
  }

  private async processSignWellWebhook(
    body: string,
    headers: Record<string, string>,
    ipAddress: string
  ): Promise<WebhookResult> {
    try {
      // Parse the invoice data from webhook payload
      const invoiceData = JSON.parse(body);

      // Validate invoice data
      const validation = await this.invoiceService.validateInvoiceData(invoiceData);
      if (!validation.isValid) {
        throw new Error('Invalid invoice data');
      }

      // Create or update invoice
      const invoice = await this.invoiceService.upsertInvoice(invoiceData);

      // Send confirmation email
      await this.sendConfirmationEmail(invoice.id, invoiceData);

      return {
        status: 200,
        body: JSON.stringify({
          id: invoice.id,
          status: invoice.status,
          message: 'Invoice processed successfully'
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': headers['x-webhook-id']
        }
      };
    } catch (error) {
      return {
        status: 400,
        body: JSON.stringify({
          error: 'Webhook processing failed',
          details: error.message
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': headers['x-webhook-id']
        }
      };
    }
  }
}
```

### API Endpoint Implementation

```typescript
// src/routes/webhooks.ts
import { webhookAuthMiddleware } from '../middleware/webhook-auth';
import { webhookSecurityService } from '../services/WebhookService';

// Apply webhook auth to all webhook routes
router.use(webhookAuthMiddleware);

// POST /api/webhooks/signwell
router.post('/signwell', async (req, res, next) => {
  try {
    const result = await webhookController.handleSignWellWebhook(req, res);
    res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

// POST /api/webhooks/quickbooks
router.post('/quickbooks', async (req, res, next) => {
  try {
    const result = await webhookController.handleQuickBooksWebhook(req, res);
    res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
});

// GET /api/webhooks/processed
router.get('/processed', async (req, res, next) => {
  try {
    const processed = await webhookIdempotencyService.getProcessedWebhooks(
      req.tenant.id,
      parseInt(req.query.limit as string) || 50
    );

    res.json({
      processed,
      total: processed.length
    });
  } catch (error) {
    next(error);
  }
});
```

### Domain Error Classes

```typescript
export class WebhookSecurityError extends DomainError {
  constructor(message: string, public readonly details?: any) {
    super('WEBHOOK_SECURITY_ERROR', message, details);
  }
}

export class DuplicateWebhookError extends WebhookSecurityError {
  constructor(webhookId: string) {
    super('DUPLICATE_WEBHOOK', `Webhook ${webhookId} already processed`, {
      webhookId
    });
  }

export class InvalidWebhookSignatureError extends WebhookSecurityError {
  constructor(details: { algorithm: string; timestamp: string }) {
    super('INVALID_WEBHOOK_SIGNATURE', 'Invalid webhook signature', {
      algorithm,
      timestamp
    });
  }

export class ExpiredWebhookError extends WebhookError {
  constructor(timestamp: string, maxAge: number) {
    super('EXPIRED_WEBHOOK', `Webhook timestamp ${timestamp} expired (max age: ${maxAge}s)`);
  }
}
```

### Database Schema Support

```sql
-- Processed webhooks table
CREATE TABLE processed_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  webhook_id VARCHAR(255) NOT NULL UNIQUE,
  request_headers JSONB NOT NULL,
  request_body TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_body TEXT,
  response_headers JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_processed_webhooks_unique ON processed_webhooks(webhook_id, tenant_id);
CREATE INDEX idx_processed_webhooks_tenant ON processed_webhooks(tenant_id);
CREATE INDEX idx_processed_webhooks_processed_at ON processed_webhooks(processed_at);

-- Webhook configuration table
CREATE TABLE webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  webhook_name VARCHAR(255) NOT NULL,
  webhook_url VARCHAR(500) NOT NULL,
  secret_key VARCHAR(255) NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'sha256',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Indexes for efficient webhook queries
CREATE INDEX idx_webhook_configs_tenant_active ON webhook_configs(tenant_id, webhook_name);
CREATE INDEX idx_webhook_configs_name ON webhook_configs(webhook_name, is_active);
```

## Testing Requirements

### Unit Tests

**Test signature verification:**

```typescript
describe('Webhook Security', () => {
  test('should verify valid SignWell signature', async () => {
    const payload = JSON.stringify({
      id: 'inv-123',
      amount: 1250.00,
      date: '2026-01-15T12:00:00Z'
    });

    const signature = crypto
      .createHmac('secret-key', payload, 'sha256')
      .digest('hex');

    const isValid = await webhookSecurityService.verifyWebhookSignature(
      payload,
      signature,
      'sha256',
      '16432176095' // Mock timestamp
    );

    expect(isValid).toBe(true);
  });

  test('should reject expired timestamp', async () => {
    const oldTimestamp = '1643217595';
    const signature = crypto
      .createHmac('secret-key', payload, 'sha256')
      .digest('hex');

    const isValid = await webhookSecurityService.validateTimestamp(oldTimestamp, 60); // 1 minute max age

    expect(isValid).toBe(false);
  });

  test('should reject invalid signature algorithm', async () => {
      const signature = crypto
        .createHmac('wrong-key', payload, 'sha256')
        .digest('hex');

      const isValid = await webhookSecurityService.verifyWebhookSignature(
        payload,
        signature,
        'sha256',
        '16432176095'
      );

    expect(isValid).toBe(false);
  });
});
```

### Integration Tests

**Test end-to-end webhook workflow:**

1. **Signature Verification**: Complete signature validation flow
2. **Idempotency**: Duplicate handling and cleanup
3. **Processing**: End-to-end webhook processing
4. **Error Handling**: Invalid signatures and expired timestamps

### Security Tests

**Test security scenarios:**

1. **Replay Attacks**: Timestamp manipulation prevention
2. **Algorithm Confusion**: Algorithm switching attacks
3. **Body Tampering**: Content modification detection
4. **Cross-Tenant Access**: Cross-tenant webhook access prevention

## Performance Considerations

### Efficient Signature Verification

```typescript
// Cache frequently used secrets
private secretCache = new Map<string, string>();

getCachedSecret(algorithm: string): string {
  if (!this.secretCache.has(algorithm)) {
    this.secretCache.set(algorithm, this.getSecret(algorithm));
  }
  return this.secretCache.get(algorithm)!;
}

// Use timing-safe comparison
private timingSafeEqual(
  a: Buffer,
  b: Buffer
): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] ^ b[i];
    if (diff !== 0) return false;
  }
  
  return true;
}
```

### Database Optimization

```sql
-- Optimized query for duplicate checking
CREATE UNIQUE INDEX idx_processed_webhooks_tenant_webhook_id_unique ON processed_webhooks(webhook_tenant_id, webhook_id);

-- Partition old records for better performance
CREATE TABLE processed_webhooks_2024_01 PARTITION OF processed_webhooks
  INCLUDE (
    PARTITION p2024_01_01
    PARTITION p2024_01_02
    PARTITION p2024_01_03
    PARTITION p2024_01_04
    PARTITION p2024_01_05
  );

CREATE INDEX idx_processed_webhooks_2024_01_01 ON processed_webhooks_tenant_webhook_id WHERE processed_at >= '2024-01-01' AND processed_at < '2024-01-02';
CREATE INDEX idx_processed_webhooks_2024_01_02 ON processed_webhooks_tenant_webhook_id WHERE processed_at >= '2024-01-02' AND processed_at < '2024-01-03';
CREATE INDEX idx_processed_webhooks_2024_01_03 ON processed_webhooks_tenant_webhook_id WHERE processed_at >= '2024-01-03' AND processed_at < '2024-01_04';
```

## Enforcement Checklist

- [ ] All webhook endpoints verify HMAC signatures
- [ ] Timestamp validation prevents replay attacks
- **[ ] Webhook ID tracking prevents duplicate processing**
- [ ] Database constraints enforce unique webhook IDs
- [ ] Comprehensive test coverage for security scenarios
- [ ] Performance optimization for signature verification
- [ ] Error handling for security violations
- [ ] Audit logging for all webhook events
- [ ] Regular cleanup of old processed webhook records
- [ ] Monitoring for security events and anomalies
- [ ] Rate limiting on webhook endpoints
- [ ] Secret key management and rotation
- [ ] Cross-tenant access prevention
