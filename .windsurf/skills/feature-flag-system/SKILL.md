---
name: feature-flag-system
description: Implement a comprehensive feature flag system with real-time toggles, A/B testing, and gradual rollout capabilities for the Apex Unified Suite.
---

# Feature Flag System Skill

## Overview
This skill guides the implementation of a production-ready feature flag system with real-time configuration, A/B testing capabilities, and gradual rollout features for controlled feature deployment.

## Architecture Components

### 1. Flag Management Service
- Flag definition and storage
- Real-time flag updates
- Rollout strategies
- A/B testing framework

### 2. Evaluation Engine
- Fast flag evaluation
- User targeting
- Context-aware decisions
- Performance optimization

### 3. Frontend SDK
- Client-side flag evaluation
- Real-time updates
- Fallback mechanisms
- Analytics integration

### 4. Admin Dashboard
- Flag management UI
- Rollout controls
- Analytics and reporting
- A/B test results

## Implementation Steps

### 1. Backend Flag Service

#### Install Dependencies
```bash
pnpm --filter @workspace/api-server add redis ioredis @types/ioredis crypto-js @types/crypto-js
```

#### Create Flag Models
```typescript
// artifacts/api-server/src/models/feature-flag.model.ts
import { pgTable, text, boolean, json, timestamp, integer } from 'drizzle-orm/pg-core';

export const featureFlags = pgTable('feature_flags', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  enabled: boolean('enabled').default(false),
  rolloutPercentage: integer('rollout_percentage').default(100),
  targetingRules: json('targeting_rules'),
  variants: json('variants'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

export const featureFlagEvaluations = pgTable('feature_flag_evaluations', {
  id: serial('id').primaryKey(),
  flagKey: text('flag_key').notNull(),
  userId: text('user_id'),
  context: json('context'),
  variant: text('variant'),
  enabled: boolean('enabled').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const featureFlagRollouts = pgTable('feature_flag_rollouts', {
  id: serial('id').primaryKey(),
  flagKey: text('flag_key').notNull(),
  strategy: text('strategy').notNull(), // gradual, a_b_test, targeted
  config: json('config').notNull(),
  status: text('status').notNull(), // active, paused, completed
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### Create Flag Service
```typescript
// artifacts/api-server/src/services/feature-flag.service.ts
import { Result, ok, err } from 'neverthrow';
import { DomainError } from '@workspace/shared/src/errors/domain-error';
import Redis from 'ioredis';
import crypto from 'crypto-js';

export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetingRules?: TargetingRule[];
  variants?: Variant[];
  metadata?: Record<string, any>;
}

export interface TargetingRule {
  type: 'user_id' | 'user_property' | 'environment' | 'custom';
  operator: 'equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  attribute: string;
  value: any;
}

export interface Variant {
  key: string;
  name: string;
  weight: number;
  payload?: Record<string, any>;
}

export interface EvaluationContext {
  userId?: string;
  userProperties?: Record<string, any>;
  environment?: string;
  timestamp?: Date;
  customAttributes?: Record<string, any>;
}

export interface EvaluationResult {
  enabled: boolean;
  variant?: string;
  payload?: Record<string, any>;
  reason: string;
}

export class FeatureFlagService {
  private redis: Redis;
  private flagCache = new Map<string, FeatureFlag>();
  private cacheTimeout = 60000; // 1 minute

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  async createFlag(flag: Omit<FeatureFlag, 'key'> & { key?: string }): Promise<Result<FeatureFlag, DomainError>> {
    try {
      const key = flag.key || this.generateKey(flag.name);
      
      // Validate flag configuration
      const validation = this.validateFlag({ ...flag, key });
      if (validation.isErr()) {
        return validation;
      }

      // Save to database
      const savedFlag = await this.saveFlagToDatabase({ ...flag, key });
      
      // Update cache
      await this.updateCache(savedFlag);
      
      // Clear evaluation cache
      await this.clearEvaluationCache(key);

      return ok(savedFlag);
    } catch (error) {
      return err(new DomainError('FLAG_ERROR', 'Failed to create feature flag'));
    }
  }

  async updateFlag(key: string, updates: Partial<FeatureFlag>): Promise<Result<FeatureFlag, DomainError>> {
    try {
      const existingFlag = await this.getFlagFromDatabase(key);
      if (!existingFlag) {
        return err(new DomainError('FLAG_NOT_FOUND', 'Feature flag not found'));
      }

      const updatedFlag = { ...existingFlag, ...updates };
      
      // Validate updated configuration
      const validation = this.validateFlag(updatedFlag);
      if (validation.isErr()) {
        return validation;
      }

      // Save to database
      const savedFlag = await this.saveFlagToDatabase(updatedFlag);
      
      // Update cache
      await this.updateCache(savedFlag);
      
      // Clear evaluation cache
      await this.clearEvaluationCache(key);

      return ok(savedFlag);
    } catch (error) {
      return err(new DomainError('FLAG_ERROR', 'Failed to update feature flag'));
    }
  }

  async evaluateFlag(key: string, context: EvaluationContext): Promise<Result<EvaluationResult, DomainError>> {
    try {
      const flag = await this.getFlag(key);
      if (!flag) {
        return ok({
          enabled: false,
          reason: 'flag_not_found',
        });
      }

      // Check if flag is globally disabled
      if (!flag.enabled) {
        return ok({
          enabled: false,
          reason: 'flag_disabled',
        });
      }

      // Check targeting rules
      const targetingResult = this.evaluateTargetingRules(flag, context);
      if (targetingResult.isErr()) {
        return targetingResult;
      }

      if (!targetingResult.value.matches) {
        return ok({
          enabled: false,
          reason: 'targeting_rules_failed',
        });
      }

      // Check rollout percentage
      const rolloutResult = this.evaluateRollout(flag, context);
      if (rolloutResult.isErr()) {
        return rolloutResult;
      }

      if (!rolloutResult.value.inRollout) {
        return ok({
          enabled: false,
          reason: 'not_in_rollout',
        });
      }

      // Evaluate variants if present
      let variant: string | undefined;
      let payload: Record<string, any> | undefined;
      
      if (flag.variants && flag.variants.length > 0) {
        const variantResult = this.evaluateVariants(flag, context);
        if (variantResult.isOk()) {
          variant = variantResult.value.variant;
          payload = variantResult.value.payload;
        }
      }

      // Record evaluation
      await this.recordEvaluation(key, context, {
        enabled: true,
        variant,
        payload,
        reason: 'enabled',
      });

      return ok({
        enabled: true,
        variant,
        payload,
        reason: 'enabled',
      });
    } catch (error) {
      return err(new DomainError('EVALUATION_ERROR', 'Failed to evaluate feature flag'));
    }
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    // Check memory cache first
    const cached = this.flagCache.get(key);
    if (cached && Date.now() - cached.updatedAt.getTime() < this.cacheTimeout) {
      return cached;
    }

    // Check Redis cache
    const redisCached = await this.redis.get(`flag:${key}`);
    if (redisCached) {
      const flag = JSON.parse(redisCached);
      this.flagCache.set(key, flag);
      return flag;
    }

    // Fetch from database
    const flag = await this.getFlagFromDatabase(key);
    if (flag) {
      await this.updateCache(flag);
    }

    return flag;
  }

  async listFlags(): Promise<FeatureFlag[]> {
    return this.listFlagsFromDatabase();
  }

  async deleteFlag(key: string): Promise<Result<void, DomainError>> {
    try {
      await this.deleteFlagFromDatabase(key);
      await this.clearEvaluationCache(key);
      this.flagCache.delete(key);
      
      return ok(undefined);
    } catch (error) {
      return err(new DomainError('FLAG_ERROR', 'Failed to delete feature flag'));
    }
  }

  private validateFlag(flag: FeatureFlag): Result<void, DomainError> {
    if (!flag.key || !flag.key.match(/^[a-z0-9_-]+$/)) {
      return err(new DomainError('INVALID_FLAG_KEY', 'Flag key must contain only lowercase letters, numbers, hyphens, and underscores'));
    }

    if (!flag.name || flag.name.trim().length === 0) {
      return err(new DomainError('INVALID_FLAG_NAME', 'Flag name is required'));
    }

    if (flag.rolloutPercentage < 0 || flag.rolloutPercentage > 100) {
      return err(new DomainError('INVALID_ROLLOUT', 'Rollout percentage must be between 0 and 100'));
    }

    if (flag.variants) {
      const totalWeight = flag.variants.reduce((sum, variant) => sum + variant.weight, 0);
      if (totalWeight !== 100) {
        return err(new DomainError('INVALID_VARIANTS', 'Variant weights must sum to 100'));
      }
    }

    return ok(undefined);
  }

  private evaluateTargetingRules(flag: FeatureFlag, context: EvaluationContext): Result<{ matches: boolean }, DomainError> {
    if (!flag.targetingRules || flag.targetingRules.length === 0) {
      return ok({ matches: true });
    }

    for (const rule of flag.targetingRules) {
      const result = this.evaluateRule(rule, context);
      if (result.isErr()) {
        return result;
      }

      if (!result.value) {
        return ok({ matches: false });
      }
    }

    return ok({ matches: true });
  }

  private evaluateRule(rule: TargetingRule, context: EvaluationContext): Result<boolean, DomainError> {
    let value: any;

    switch (rule.type) {
      case 'user_id':
        value = context.userId;
        break;
      case 'user_property':
        value = context.userProperties?.[rule.attribute];
        break;
      case 'environment':
        value = context.environment;
        break;
      case 'custom':
        value = context.customAttributes?.[rule.attribute];
        break;
      default:
        return err(new DomainError('INVALID_RULE', 'Unknown targeting rule type'));
    }

    switch (rule.operator) {
      case 'equals':
        return ok(value === rule.value);
      case 'contains':
        return ok(typeof value === 'string' && value.includes(rule.value));
      case 'in':
        return ok(Array.isArray(rule.value) && rule.value.includes(value));
      case 'not_in':
        return ok(Array.isArray(rule.value) && !rule.value.includes(value));
      case 'greater_than':
        return ok(typeof value === 'number' && value > rule.value);
      case 'less_than':
        return ok(typeof value === 'number' && value < rule.value);
      default:
        return err(new DomainError('INVALID_OPERATOR', 'Unknown targeting operator'));
    }
  }

  private evaluateRollout(flag: FeatureFlag, context: EvaluationContext): Result<{ inRollout: boolean }, DomainError> {
    if (flag.rolloutPercentage >= 100) {
      return ok({ inRollout: true });
    }

    if (flag.rolloutPercentage <= 0) {
      return ok({ inRollout: false });
    }

    // Generate consistent hash for user
    const hash = this.generateHash(flag.key, context.userId || 'anonymous');
    const hashValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;

    return ok({ inRollout: hashValue * 100 < flag.rolloutPercentage });
  }

  private evaluateVariants(flag: FeatureFlag, context: EvaluationContext): Result<{ variant: string; payload?: Record<string, any> }, DomainError> {
    if (!flag.variants || flag.variants.length === 0) {
      return err(new DomainError('NO_VARIANTS', 'No variants defined'));
    }

    const hash = this.generateHash(`${flag.key}:variant`, context.userId || 'anonymous');
    const hashValue = parseInt(hash.substring(0, 8), 16) / 0xffffffff;

    let cumulativeWeight = 0;
    for (const variant of flag.variants) {
      cumulativeWeight += variant.weight / 100;
      if (hashValue <= cumulativeWeight) {
        return ok({
          variant: variant.key,
          payload: variant.payload,
        });
      }
    }

    // Fallback to first variant
    const firstVariant = flag.variants[0];
    return ok({
      variant: firstVariant.key,
      payload: firstVariant.payload,
    });
  }

  private generateHash(...inputs: string[]): string {
    const input = inputs.join(':');
    return crypto.SHA256(input).toString();
  }

  private generateKey(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  private async updateCache(flag: FeatureFlag): Promise<void> {
    this.flagCache.set(flag.key, flag);
    await this.redis.setex(`flag:${flag.key}`, 300, JSON.stringify(flag)); // 5 minutes
  }

  private async clearEvaluationCache(key: string): Promise<void> {
    const pattern = `evaluation:${key}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private async recordEvaluation(key: string, context: EvaluationContext, result: EvaluationResult): Promise<void> {
    // Record evaluation for analytics
    await this.redis.lpush('evaluations', JSON.stringify({
      flagKey: key,
      context,
      result,
      timestamp: new Date().toISOString(),
    }));

    // Keep only last 10000 evaluations
    await this.redis.ltrim('evaluations', 0, 9999);
  }

  // Database methods (implement with your ORM)
  private async saveFlagToDatabase(flag: FeatureFlag): Promise<FeatureFlag> {
    // Implementation depends on your database layer
    // This would use Drizzle ORM or similar
    return flag;
  }

  private async getFlagFromDatabase(key: string): Promise<FeatureFlag | null> {
    // Implementation depends on your database layer
    return null;
  }

  private async listFlagsFromDatabase(): Promise<FeatureFlag[]> {
    // Implementation depends on your database layer
    return [];
  }

  private async deleteFlagFromDatabase(key: string): Promise<void> {
    // Implementation depends on your database layer
  }
}
```

#### Create Flag Routes
```typescript
// artifacts/api-server/src/routes/feature-flags.ts
import { Router } from 'express';
import { FeatureFlagService } from '../services/feature-flag.service';
import { validateRequest } from '../middleware/validation';

const router = Router();
const flagService = new FeatureFlagService();

router.post('/', async (req, res, next) => {
  const result = await flagService.createFlag(req.body);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

router.get('/', async (req, res) => {
  const flags = await flagService.listFlags();
  res.json(flags);
});

router.get('/:key', async (req, res, next) => {
  const { key } = req.params;
  const flag = await flagService.getFlag(key);
  
  if (!flag) {
    return next(new DomainError('FLAG_NOT_FOUND', 'Feature flag not found'));
  }
  
  res.json(flag);
});

router.put('/:key', async (req, res, next) => {
  const { key } = req.params;
  const result = await flagService.updateFlag(key, req.body);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

router.delete('/:key', async (req, res, next) => {
  const { key } = req.params;
  const result = await flagService.deleteFlag(key);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(204).send();
});

router.post('/:key/evaluate', async (req, res, next) => {
  const { key } = req.params;
  const context = req.body;
  
  const result = await flagService.evaluateFlag(key, context);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

export default router;
```

### 2. Frontend SDK

#### Create React Hook
```typescript
// artifacts/apex-os/src/hooks/useFeatureFlags.ts
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface FeatureFlagContext {
  userId?: string;
  userProperties?: Record<string, any>;
  environment?: string;
  customAttributes?: Record<string, any>;
}

export interface FeatureFlagResult {
  enabled: boolean;
  variant?: string;
  payload?: Record<string, any>;
  loading: boolean;
  error?: Error;
}

export function useFeatureFlag(
  key: string,
  context?: FeatureFlagContext
): FeatureFlagResult {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['feature-flag', key, context],
    queryFn: async () => {
      const response = await fetch(`/api/feature-flags/${key}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context || {}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to evaluate feature flag');
      }
      
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
  });

  return {
    enabled: data?.enabled || false,
    variant: data?.variant,
    payload: data?.payload,
    loading: isLoading,
    error,
  };
}

export function useFeatureFlags(
  keys: string[],
  context?: FeatureFlagContext
): Record<string, FeatureFlagResult> {
  const results: Record<string, FeatureFlagResult> = {};
  
  keys.forEach(key => {
    results[key] = useFeatureFlag(key, context);
  });
  
  return results;
}

export function useFeatureFlagToggle(
  key: string,
  context?: FeatureFlagContext
): [boolean, (enabled: boolean) => void] {
  const { enabled, loading } = useFeatureFlag(key, context);
  const queryClient = useQueryClient();

  const toggle = useCallback((newEnabled: boolean) => {
    // This would require an admin endpoint to update the flag
    queryClient.invalidateQueries(['feature-flag', key, context]);
  }, [key, context, queryClient]);

  return [enabled && !loading, toggle];
}
```

#### Create Feature Flag Provider
```typescript
// artifacts/apex-os/src/components/FeatureFlagProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { FeatureFlagContext } from '../hooks/useFeatureFlags';

interface FeatureFlagProviderProps {
  children: ReactNode;
  context?: FeatureFlagContext;
}

const FeatureFlagContextValue = createContext<FeatureFlagContext | undefined>(undefined);

export function FeatureFlagProvider({ children, context }: FeatureFlagProviderProps) {
  return (
    <FeatureFlagContextValue.Provider value={context}>
      {children}
    </FeatureFlagContextValue.Provider>
  );
}

export function useFeatureFlagContext(): FeatureFlagContext {
  const context = useContext(FeatureFlagContextValue);
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within FeatureFlagProvider');
  }
  return context;
}

export function withFeatureFlags<P extends object>(
  Component: React.ComponentType<P>,
  context?: FeatureFlagContext
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <FeatureFlagProvider context={context}>
        <Component {...props} />
      </FeatureFlagProvider>
    );
  };
}
```

### 3. Admin Dashboard Components

#### Create Flag Management UI
```typescript
// artifacts/apex-os/src/components/admin/FlagManager.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FlagFormData {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export function FlagManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFlag, setEditingFlag] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const response = await fetch('/api/feature-flags');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (flagData: FlagFormData) => {
      const response = await fetch('/api/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flagData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-flags']);
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, data }: { key: string; data: Partial<FlagFormData> }) => {
      const response = await fetch(`/api/feature-flags/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-flags']);
      setEditingFlag(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      await fetch(`/api/feature-flags/${key}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-flags']);
    },
  });

  if (isLoading) {
    return <div>Loading flags...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Feature Flags</h2>
        <Button onClick={() => setIsCreating(true)}>
          Create Flag
        </Button>
      </div>

      {isCreating && (
        <FlagForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setIsCreating(false)}
        />
      )}

      <div className="grid gap-4">
        {flags?.map((flag: any) => (
          <FlagCard
            key={flag.key}
            flag={flag}
            onEdit={() => setEditingFlag(flag.key)}
            onUpdate={(data) => updateMutation.mutate({ key: flag.key, data })}
            onDelete={() => deleteMutation.mutate(flag.key)}
            isEditing={editingFlag === flag.key}
          />
        ))}
      </div>
    </div>
  );
}

function FlagForm({ onSubmit, onCancel }: { onSubmit: (data: FlagFormData) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<FlagFormData>({
    key: '',
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Flag</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="feature-key"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Feature Name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Feature description"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>
          
          <div>
            <Label htmlFor="rollout">Rollout Percentage</Label>
            <Input
              id="rollout"
              type="number"
              min="0"
              max="100"
              value={formData.rolloutPercentage}
              onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
              required
            />
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit">Create</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FlagCard({ flag, onEdit, onUpdate, onDelete, isEditing }: {
  flag: any;
  onEdit: () => void;
  onUpdate: (data: Partial<FlagFormData>) => void;
  onDelete: () => void;
  isEditing: boolean;
}) {
  const [formData, setFormData] = useState<Partial<FlagFormData>>({
    enabled: flag.enabled,
    rolloutPercentage: flag.rolloutPercentage,
  });

  const handleSave = () => {
    onUpdate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{flag.name}</CardTitle>
            <p className="text-sm text-gray-600">{flag.key}</p>
            {flag.description && (
              <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={onEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={onEdit}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={onDelete}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.enabled}
                onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
              />
              <Label>Enabled</Label>
            </div>
            
            <div>
              <Label>Rollout Percentage</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.rolloutPercentage}
                onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${flag.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{flag.enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            
            <div className="text-sm">
              Rollout: {flag.rolloutPercentage}%
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Usage Examples

### Basic Feature Flag Usage
```typescript
// In your React components
function NewFeature() {
  const { enabled, loading } = useFeatureFlag('new-dashboard', {
    userId: 'user-123',
    userProperties: { plan: 'premium' },
    environment: 'production',
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!enabled) {
    return <div>Feature not available</div>;
  }

  return <div>New feature content!</div>;
}

// With variants
function ABTestedComponent() {
  const { enabled, variant, payload } = useFeatureFlag('button-color-test', {
    userId: 'user-123',
  });

  if (!enabled) {
    return <button className="bg-blue-500">Default Button</button>;
  }

  const buttonClass = payload?.buttonClass || 'bg-blue-500';
  return <button className={buttonClass}>Test Button</button>;
}
```

### Server-side Usage
```typescript
// In your API routes
router.get('/api/dashboard', async (req, res) => {
  const context = {
    userId: req.user?.id,
    userProperties: req.user?.properties,
    environment: process.env.NODE_ENV,
  };

  const dashboardFlags = await Promise.all([
    flagService.evaluateFlag('new-dashboard-layout', context),
    flagService.evaluateFlag('advanced-analytics', context),
    flagService.evaluateFlag('real-time-updates', context),
  ]);

  const flags = {};
  dashboardFlags.forEach((result, index) => {
    const flagKeys = ['new-dashboard-layout', 'advanced-analytics', 'real-time-updates'];
    if (result.isOk()) {
      flags[flagKeys[index]] = result.value;
    }
  });

  res.json({ flags, data: getDashboardData(flags) });
});
```

## Testing

### Unit Tests
```typescript
describe('FeatureFlagService', () => {
  it('should evaluate flag correctly', async () => {
    const flag = {
      key: 'test-flag',
      name: 'Test Flag',
      enabled: true,
      rolloutPercentage: 50,
    };

    const context = { userId: 'user-123' };
    const result = await flagService.evaluateFlag('test-flag', context);

    expect(result.isOk()).toBe(true);
    expect(result.value.enabled).toBeDefined();
  });

  it('should respect targeting rules', async () => {
    const flag = {
      key: 'premium-feature',
      name: 'Premium Feature',
      enabled: true,
      rolloutPercentage: 100,
      targetingRules: [
        {
          type: 'user_property',
          attribute: 'plan',
          operator: 'equals',
          value: 'premium',
        },
      ],
    };

    const premiumContext = { userId: 'user-123', userProperties: { plan: 'premium' } };
    const basicContext = { userId: 'user-456', userProperties: { plan: 'basic' } };

    const premiumResult = await flagService.evaluateFlag('premium-feature', premiumContext);
    const basicResult = await flagService.evaluateFlag('premium-feature', basicContext);

    expect(premiumResult.value.enabled).toBe(true);
    expect(basicResult.value.enabled).toBe(false);
  });
});
```

### Integration Tests
```typescript
describe('Feature Flag Integration', () => {
  it('should work end-to-end', async () => {
    // Create flag
    const createResponse = await request(app)
      .post('/api/feature-flags')
      .send({
        key: 'integration-test',
        name: 'Integration Test',
        enabled: true,
        rolloutPercentage: 100,
      })
      .expect(201);

    // Evaluate flag
    const evaluateResponse = await request(app)
      .post('/api/feature-flags/integration-test/evaluate')
      .send({ userId: 'test-user' })
      .expect(200);

    expect(evaluateResponse.body.enabled).toBe(true);
  });
});
```

## Performance Considerations

### Caching Strategy
- Memory cache for frequently accessed flags
- Redis cache for distributed systems
- Cache invalidation on flag updates
- Pre-warm cache for critical flags

### Evaluation Performance
- Hash-based consistent rollout
- Optimized targeting rule evaluation
- Batch evaluation for multiple flags
- Lazy loading of flag definitions

### Monitoring
- Track evaluation latency
- Monitor cache hit rates
- Alert on flag evaluation failures
- Track rollout progress

## Security Considerations

### Access Control
- Role-based flag management
- Audit trail for flag changes
- Secure flag evaluation endpoints
- Rate limiting for evaluation API

### Data Privacy
- Anonymize user IDs in hashes
- Secure storage of targeting rules
- GDPR compliance for user data
- Data retention policies

## Best Practices

### Flag Design
- Use descriptive flag names
- Keep flag keys simple and consistent
- Document flag purposes and usage
- Set appropriate rollout percentages

### Rollout Strategy
- Start with small rollout percentages
- Monitor metrics during rollout
- Have rollback plans ready
- Use gradual rollouts for critical features

### A/B Testing
- Define clear success metrics
- Ensure statistical significance
- Run tests for appropriate duration
- Document test results and decisions

## Deployment Checklist

- [ ] Set up Redis for caching
- [ ] Configure database schema
- [ ] Deploy flag management API
- [ ] Set up monitoring and alerting
- [ ] Create admin dashboard
- [ ] Document flag usage patterns
- [ ] Train team on flag management
- [ ] Establish flag lifecycle policies
