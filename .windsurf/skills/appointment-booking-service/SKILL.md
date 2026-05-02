---
name: appointment-booking-service
description: Implement comprehensive appointment scheduling service with availability windows, booking rules validation, conflict detection, timezone normalization, and state machine management for requested → confirmed → cancelled transitions.
---

# Appointment Booking Service Implementation

## Overview

This skill guides the implementation of a robust appointment booking system that handles complex scheduling logic, including availability calculation, booking rule validation, conflict detection, and proper state management with timezone support.

## Core Components

### 1. Database Schema Design

#### Availability Windows Table
```sql
CREATE TABLE availability_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  recurrence_rule TEXT, -- RRULE format for recurring availability
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_availability_resource_time ON availability_windows(resource_id, start_time, end_time);
CREATE INDEX idx_availability_tenant ON availability_windows(tenant_id);
```

#### Booking Rules Table
```sql
CREATE TABLE booking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  resource_id UUID REFERENCES resources(id),
  min_advance_hours INTEGER DEFAULT 0, -- Minimum hours in advance required
  max_advance_days INTEGER DEFAULT 365, -- Maximum days in advance allowed
  buffer_minutes INTEGER DEFAULT 0, -- Buffer time between appointments
  max_per_day INTEGER DEFAULT 8, -- Maximum appointments per day
  max_per_week INTEGER DEFAULT 40, -- Maximum appointments per week
  allowed_weekdays INTEGER[], -- Array of allowed weekdays (0=Sunday, 6=Saturday)
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '17:00:00',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Appointments Table
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  resource_id UUID NOT NULL REFERENCES resources(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  status VARCHAR(20) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  booking_rule_violations JSONB, -- Store any rule violations that were overridden
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id)
);

CREATE INDEX idx_appointments_resource_time ON appointments(resource_id, start_time, end_time);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
```

### 2. Service Implementation

#### AppointmentService Core Methods

```typescript
// src/services/AppointmentService.ts
import { Database } from 'drizzle-orm';
import { appointments, availabilityWindows, bookingRules } from '../db/schema';
import { eq, and, gte, lte, between, sql } from 'drizzle-orm';
import { ConflictError, BookingRuleViolationError } from '../domain/errors';

export class AppointmentService {
  constructor(private db: Database) {}

  /**
   * Calculate available slots for a resource within a date range
   */
  async calculateAvailableSlots(
    resourceId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
    timezone: string = 'UTC'
  ): Promise<AvailableSlot[]> {
    // 1. Get availability windows for the period
    const availability = await this.getAvailabilityWindows(
      resourceId,
      startDate,
      endDate,
      tenantId
    );

    // 2. Get existing appointments to find conflicts
    const existingAppointments = await this.getExistingAppointments(
      resourceId,
      startDate,
      endDate,
      tenantId
    );

    // 3. Get booking rules for validation
    const rules = await this.getBookingRules(resourceId, tenantId);

    // 4. Generate slots and filter by conflicts and rules
    return this.generateAndFilterSlots(
      availability,
      existingAppointments,
      rules,
      timezone
    );
  }

  /**
   * Create a new appointment with full validation
   */
  async createAppointment(
    data: CreateAppointmentRequest,
    tenantId: string,
    requestedBy: string
  ): Promise<Appointment> {
    // 1. Validate timezone and normalize to UTC
    const startTime = this.normalizeToUTC(data.startTime, data.timezone);
    const endTime = this.normalizeToUTC(data.endTime, data.timezone);

    // 2. Check booking rules
    const ruleViolations = await this.validateBookingRules(
      data.resourceId,
      startTime,
      endTime,
      tenantId
    );

    if (ruleViolations.length > 0) {
      throw new BookingRuleViolationError('Booking rules violated', ruleViolations);
    }

    // 3. Check for conflicts
    const conflicts = await this.detectConflicts(
      data.resourceId,
      startTime,
      endTime,
      tenantId,
      null // Exclude current appointment (none yet)
    );

    if (conflicts.length > 0) {
      throw new ConflictError('Time slot conflicts with existing appointments', conflicts);
    }

    // 4. Create appointment in 'requested' state
    const appointment = await this.db.insert(appointments).values({
      tenantId,
      clientId: data.clientId,
      resourceId: data.resourceId,
      startTime,
      endTime,
      timezone: data.timezone,
      status: 'requested',
      notes: data.notes,
      createdBy: requestedBy
    }).returning();

    // 5. Emit domain event
    await this.emitEvent('AppointmentRequested', {
      appointmentId: appointment[0].id,
      resourceId: data.resourceId,
      clientId: data.clientId,
      startTime,
      endTime
    });

    return appointment[0];
  }

  /**
   * Confirm an appointment (state transition: requested → confirmed)
   */
  async confirmAppointment(
    appointmentId: string,
    tenantId: string,
    confirmedBy: string
  ): Promise<Appointment> {
    const appointment = await this.db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.tenantId, tenantId)
      ))
      .limit(1);

    if (!appointment[0]) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment[0].status !== 'requested') {
      throw new InvalidStateError('Only requested appointments can be confirmed');
    }

    // Double-check for conflicts just before confirmation
    const conflicts = await this.detectConflicts(
      appointment[0].resourceId,
      appointment[0].startTime,
      appointment[0].endTime,
      tenantId,
      appointmentId
    );

    if (conflicts.length > 0) {
      throw new ConflictError('Cannot confirm: time slot now has conflicts', conflicts);
    }

    const updated = await this.db
      .update(appointments)
      .set({
        status: 'confirmed',
        confirmedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Emit domain event
    await this.emitEvent('AppointmentConfirmed', {
      appointmentId,
      resourceId: appointment[0].resourceId,
      clientId: appointment[0].clientId
    });

    return updated[0];
  }

  /**
   * Cancel an appointment (state transition: requested/confirmed → cancelled)
   */
  async cancelAppointment(
    appointmentId: string,
    tenantId: string,
    cancelledBy: string,
    reason?: string
  ): Promise<Appointment> {
    const appointment = await this.db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.tenantId, tenantId)
      ))
      .limit(1);

    if (!appointment[0]) {
      throw new NotFoundError('Appointment not found');
    }

    if (!['requested', 'confirmed'].includes(appointment[0].status)) {
      throw new InvalidStateError('Only requested or confirmed appointments can be cancelled');
    }

    const updated = await this.db
      .update(appointments)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy,
        notes: reason ? `${appointment[0].notes || ''}\n\nCancellation reason: ${reason}`.trim() : appointment[0].notes,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Emit domain event
    await this.emitEvent('AppointmentCancelled', {
      appointmentId,
      previousStatus: appointment[0].status,
      resourceId: appointment[0].resourceId,
      clientId: appointment[0].clientId,
      reason
    });

    return updated[0];
  }

  /**
   * Validate booking rules against proposed appointment time
   */
  private async validateBookingRules(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    tenantId: string
  ): Promise<RuleViolation[]> {
    const rules = await this.getBookingRules(resourceId, tenantId);
    const violations: RuleViolation[] = [];
    const now = new Date();

    // Check minimum advance booking
    if (rules.minAdvanceHours > 0) {
      const minAdvance = new Date(now.getTime() + (rules.minAdvanceHours * 60 * 60 * 1000));
      if (startTime < minAdvance) {
        violations.push({
          rule: 'min_advance_hours',
          message: `Appointment must be booked at least ${rules.minAdvanceHours} hours in advance`,
          required: rules.minAdvanceHours,
          actual: Math.floor((startTime.getTime() - now.getTime()) / (60 * 60 * 1000))
        });
      }
    }

    // Check maximum advance booking
    if (rules.maxAdvanceDays > 0) {
      const maxAdvance = new Date(now.getTime() + (rules.maxAdvanceDays * 24 * 60 * 60 * 1000));
      if (startTime > maxAdvance) {
        violations.push({
          rule: 'max_advance_days',
          message: `Appointment cannot be booked more than ${rules.maxAdvanceDays} days in advance`,
          required: rules.maxAdvanceDays,
          actual: Math.floor((startTime.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        });
      }
    }

    // Check working hours
    const appointmentTime = new Date(startTime);
    const appointmentHour = appointmentTime.getUTCHours();
    if (rules.workingHoursStart && rules.workingHoursEnd) {
      const startHour = parseInt(rules.workingHoursStart.split(':')[0]);
      const endHour = parseInt(rules.workingHoursEnd.split(':')[0]);
      if (appointmentHour < startHour || appointmentHour >= endHour) {
        violations.push({
          rule: 'working_hours',
          message: `Appointment must be within working hours (${rules.workingHoursStart} - ${rules.workingHoursEnd})`,
          required: `${rules.workingHoursStart} - ${rules.workingHoursEnd}`,
          actual: `${appointmentHour}:00`
        });
      }
    }

    // Check allowed weekdays
    if (rules.allowedWeekdays && rules.allowedWeekdays.length > 0) {
      const dayOfWeek = appointmentTime.getUTCDay();
      if (!rules.allowedWeekdays.includes(dayOfWeek)) {
        violations.push({
          rule: 'allowed_weekdays',
          message: `Appointment not allowed on this day of week`,
          required: rules.allowedWeekdays.join(', '),
          actual: dayOfWeek.toString()
        });
      }
    }

    // Check maximum appointments per day
    if (rules.maxPerDay > 0) {
      const dayStart = new Date(startTime);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const dayAppointments = await this.db
        .select()
        .from(appointments)
        .where(and(
          eq(appointments.resourceId, resourceId),
          eq(appointments.tenantId, tenantId),
          gte(appointments.startTime, dayStart),
          lt(appointments.startTime, dayEnd),
          sql`status IN ('requested', 'confirmed')`
        ));

      if (dayAppointments.length >= rules.maxPerDay) {
        violations.push({
          rule: 'max_per_day',
          message: `Maximum ${rules.maxPerDay} appointments per day allowed`,
          required: rules.maxPerDay,
          actual: dayAppointments.length + 1
        });
      }
    }

    return violations;
  }

  /**
   * Detect conflicting appointments for the same resource and time
   */
  private async detectConflicts(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    tenantId: string,
    excludeAppointmentId?: string
  ): Promise<Conflict[]> {
    const conflicts = await this.db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.resourceId, resourceId),
        eq(appointments.tenantId, tenantId),
        sql`status IN ('requested', 'confirmed')`,
        // Check for overlapping time ranges
        sql`(start_time < ${endTime} AND end_time > ${startTime})`,
        // Exclude current appointment if updating
        excludeAppointmentId ? sql`id != ${excludeAppointmentId}` : sql`1=1`
      ));

    return conflicts.map(apt => ({
      appointmentId: apt.id,
      startTime: apt.startTime,
      endTime: apt.endTime,
      status: apt.status,
      clientId: apt.clientId
    }));
  }

  /**
   * Normalize datetime to UTC for storage
   */
  private normalizeToUTC(date: Date, timezone: string): Date {
    // Convert from tenant timezone to UTC
    return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  }

  /**
   * Convert UTC datetime to tenant timezone for display
   */
  private convertFromUTC(date: Date, timezone: string): Date {
    return new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  }
}
```

### 3. API Endpoints

Create corresponding API endpoints in Express:

```typescript
// src/routes/appointments.ts
import { Router } from 'express';
import { AppointmentService } from '../services/AppointmentService';
import { validateRequest } from '../middleware/validation';
import { createAppointmentSchema, updateAppointmentSchema } from '../schemas/appointments';

const router = Router();

// GET /api/appointments/available-slots
router.get('/available-slots', async (req, res, next) => {
  try {
    const { resourceId, startDate, endDate, timezone } = req.query;
    
    const slots = await appointmentService.calculateAvailableSlots(
      resourceId as string,
      new Date(startDate as string),
      new Date(endDate as string),
      req.tenant.id,
      timezone as string
    );

    res.json({ slots });
  } catch (error) {
    next(error);
  }
});

// POST /api/appointments
router.post('/', validateRequest(createAppointmentSchema), async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/appointments/:id/confirm
router.patch('/:id/confirm', async (req, res, next) => {
  try {
    const appointment = await appointmentService.confirmAppointment(
      req.params.id,
      req.tenant.id,
      req.user.id
    );

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.tenant.id,
      req.user.id,
      req.body.reason
    );

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
});
```

## Implementation Checklist

- [ ] Create database schema with proper indexes
- [ ] Implement AppointmentService with all core methods
- [ ] Add timezone normalization utilities
- [ ] Create booking rule validation logic
- [ ] Implement conflict detection algorithm
- [ ] Add state machine validation for transitions
- [ ] Create API endpoints with proper validation
- [ ] Add domain events for appointment lifecycle
- [ ] Implement integration tests for all scenarios
- [ ] Add error handling for booking violations
- [ ] Create monitoring and logging for appointment operations

## Testing Requirements

### Unit Tests
- Test timezone conversion accuracy
- Test booking rule validation logic
- Test conflict detection algorithm
- Test state machine transitions

### Integration Tests
- Test appointment creation flow end-to-end
- Test concurrent booking scenarios
- Test timezone handling across different regions
- Test booking rule enforcement

### Edge Cases
- Test daylight saving time transitions
- Test recurring availability windows
- Test resource capacity limits
- Test appointment cancellation policies

## Security Considerations

- All time data stored in UTC
- Tenant isolation enforced at database level
- Rate limiting on booking endpoints
- Audit trail for all appointment changes
- Input validation for all datetime fields

## Performance Optimizations

- Database indexes on time-based queries
- Caching for availability calculations
- Efficient conflict detection using time range queries
- Batch processing for recurring availability

## Monitoring

- Track booking success/failure rates
- Monitor conflict detection performance
- Alert on booking rule violations
- Track timezone conversion errors
