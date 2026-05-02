---
name: stripe-payment-integration
description: Complete Stripe payment integration implementation with secure checkout flows, webhook handling, and subscription management for the Apex Unified Suite.
---

# Stripe Payment Integration Skill

## Overview
This skill guides the implementation of a production-ready Stripe payment system with secure checkout flows, webhook processing, and subscription management capabilities.

## Prerequisites
- Stripe account with API keys
- Node.js backend with Express
- React frontend with TypeScript
- PostgreSQL database for payment records
- SSL certificate for production

## Implementation Steps

### 1. Backend Setup

#### Install Dependencies
```bash
pnpm --filter @workspace/api-server add stripe @types/stripe
pnpm --filter @workspace/api-client-react add @stripe/stripe-js
```

#### Create Stripe Service
```typescript
// artifacts/api-server/src/services/stripe.service.ts
import Stripe from 'stripe';
import { Result, ok, err } from 'neverthrow';
import { DomainError } from '@workspace/shared/src/errors/domain-error';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-01',
    });
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Result<Stripe.Checkout.Session, DomainError>> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: params.customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: params.priceId,
          quantity: 1,
        }],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: params.metadata,
        payment_intent_data: {
          setup_future_usage: 'on_session',
        },
      });

      return ok(session);
    } catch (error) {
      return err(new DomainError('STRIPE_ERROR', 'Failed to create checkout session'));
    }
  }

  async createSubscription(params: {
    customerId: string;
    priceId: string;
    trialPeriodDays?: number;
    metadata?: Record<string, string>;
  }): Promise<Result<Stripe.Subscription, DomainError>> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.priceId }],
        trial_period_days: params.trialPeriodDays,
        metadata: params.metadata,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      return ok(subscription);
    } catch (error) {
      return err(new DomainError('STRIPE_ERROR', 'Failed to create subscription'));
    }
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<Result<Stripe.Customer, DomainError>> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      });

      return ok(customer);
    } catch (error) {
      return err(new DomainError('STRIPE_ERROR', 'Failed to create customer'));
    }
  }

  async constructWebhookEvent(payload: string, signature: string): Promise<Stripe.Event> {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }
}
```

#### Create Payment Routes
```typescript
// artifacts/api-server/src/routes/payments.ts
import { Router } from 'express';
import { StripeService } from '../services/stripe.service';
import { validateRequest } from '../middleware/validation';
import { createCheckoutSchema, createSubscriptionSchema } from '@workspace/api-zod';

const router = Router();
const stripeService = new StripeService();

router.post('/checkout', validateRequest(createCheckoutSchema), async (req, res, next) => {
  const result = await stripeService.createCheckoutSession(req.body);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json({ sessionId: result.value.id, url: result.value.url });
});

router.post('/subscribe', validateRequest(createSubscriptionSchema), async (req, res, next) => {
  const result = await stripeService.createSubscription(req.body);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json({ subscriptionId: result.value.id, clientSecret: result.value.latest_invoice.payment_intent.client_secret });
});

router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  
  try {
    const event = await stripeService.constructWebhookEvent(req.body, signature);
    
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break;
      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;
      case 'invoice.payment_failed':
        // Handle failed payment
        break;
      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook signature' });
  }
});

export default router;
```

### 2. Frontend Implementation

#### Create Payment Components
```typescript
// artifacts/apex-os/src/components/payments/CheckoutButton.tsx
import { loadStripe } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CheckoutButtonProps {
  priceId: string;
  customerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CheckoutButton({ priceId, customerId, onSuccess, onCancel }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const checkoutMutation = useMutation({
    mutationFn: async (data: { priceId: string; customerId: string }) => {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: async (data) => {
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) {
          console.error('Stripe redirect error:', error);
        } else {
          onSuccess?.();
        }
      }
    },
    onError: (error) => {
      console.error('Checkout error:', error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleCheckout = () => {
    setIsLoading(true);
    checkoutMutation.mutate({ priceId, customerId });
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || checkoutMutation.isPending}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {isLoading ? 'Processing...' : 'Pay Now'}
    </button>
  );
}
```

#### Create Subscription Component
```typescript
// artifacts/apex-os/src/components/payments/SubscriptionForm.tsx
import { loadStripe } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface SubscriptionFormProps {
  priceId: string;
  customerId: string;
  onSuccess?: (subscriptionId: string) => void;
}

export function SubscriptionForm({ priceId, customerId, onSuccess }: SubscriptionFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const subscriptionMutation = useMutation({
    mutationFn: async (data: { priceId: string; customerId: string }) => {
      const response = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: async (data) => {
      if (stripe) {
        const { error } = await stripe.confirmCardPayment(data.clientSecret);
        if (error) {
          console.error('Payment confirmation error:', error);
        } else {
          onSuccess?.(data.subscriptionId);
        }
      }
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    subscriptionMutation.mutate({ priceId, customerId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <CardElement />
      </div>
      <button
        type="submit"
        disabled={!stripe || isLoading || subscriptionMutation.isPending}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full"
      >
        {isLoading ? 'Processing...' : 'Subscribe'}
      </button>
    </form>
  );
}
```

### 3. Database Schema

#### Create Payment Tables
```sql
-- Add to your Drizzle schema
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
  customerId: text('customer_id').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('usd'),
  status: text('status').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  customerId: text('customer_id').notNull(),
  priceId: text('price_id').notNull(),
  status: text('status').notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  trialEnd: timestamp('trial_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 4. Security Best Practices

#### Environment Variables
```bash
# Required environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Security Headers
```typescript
// Add to your Express middleware
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

## Testing

### Unit Tests
```typescript
describe('StripeService', () => {
  it('should create checkout session', async () => {
    const result = await stripeService.createCheckoutSession({
      customerId: 'cus_test',
      priceId: 'price_test',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    expect(result.isOk()).toBe(true);
    expect(result.value).toHaveProperty('id');
  });
});
```

### Integration Tests
```typescript
describe('Payment Flow', () => {
  it('should complete full checkout flow', async () => {
    // Test the complete payment flow from frontend to backend
  });
});
```

## Deployment Checklist

- [ ] Verify Stripe webhook endpoints are accessible
- [ ] Test with Stripe test cards
- [ ] Set up webhook monitoring
- [ ] Configure payment failure handling
- [ ] Set up subscription management UI
- [ ] Implement refund handling
- [ ] Add payment method management
- [ ] Set up billing notifications

## Monitoring

### Key Metrics
- Payment success rate
- Checkout conversion rate
- Subscription churn rate
- Webhook delivery success
- Failed payment recovery rate

### Error Tracking
- Stripe API errors
- Webhook processing failures
- Payment method declines
- Subscription payment failures

## Common Issues

### Payment Failures
- Check card validity
- Verify 3D Secure requirements
- Review currency support
- Check rate limits

### Webhook Issues
- Verify webhook signature
- Check endpoint accessibility
- Review timeout settings
- Monitor delivery logs

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Best Practices](https://stripe.com/docs/best-practices)
