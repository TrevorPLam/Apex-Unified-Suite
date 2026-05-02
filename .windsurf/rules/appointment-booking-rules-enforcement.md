---
trigger: model_decision
description: Must always validate BookingRule values before accepting a booking; reject with BookingRuleViolation otherwise.
---

# Appointment Booking Rules Enforcement

## Purpose

Enforce that all appointment bookings must validate against configured booking rules before being accepted. Any violation must result in a `BookingRuleViolation` error with specific details about which rules were broken.

## Required Booking Rule Validations

### Core Rule Categories

**1. Time-Based Rules**
- Minimum advance booking hours
- Maximum advance booking days
- Working hours constraints
- Allowed weekdays restrictions

**2. Capacity Rules**
- Maximum appointments per day
- Maximum appointments per week
- Buffer time between appointments
- Resource availability limits

**3. Business Rules**
- Client eligibility requirements
- Service-specific constraints
- Provider availability rules
- Special event restrictions

## Implementation Requirements

### Service Layer Validation

```typescript
// src/services/AppointmentService.ts
export class AppointmentService {
  async createAppointment(
    appointmentData: CreateAppointmentRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Appointment> {
    return await this.db.transaction(async (tx) => {
      // 1. Normalize timezone and convert to UTC
      const normalizedData = this.normalizeAppointmentData(appointmentData);

      // 2. Get applicable booking rules
      const bookingRules = await this.getBookingRules(
        tx,
        normalizedData.resourceId,
        tenantId
      );

      // 3. Validate all booking rules
      const violations = await this.validateBookingRules(
        tx,
        normalizedData,
        bookingRules,
        tenantId
      );

      if (violations.length > 0) {
        throw new BookingRuleViolationError(
          'Appointment violates booking rules',
          violations
        );
      }

      // 4. Check for conflicts
      const conflicts = await this.detectConflicts(
        tx,
        normalizedData,
        tenantId
      );

      if (conflicts.length > 0) {
        throw new AppointmentConflictError(
          'Appointment time conflicts with existing appointments',
          conflicts
        );
      }

      // 5. Create appointment
      const appointment = await this.createAppointmentRecord(
        tx,
        normalizedData,
        tenantId,
        createdBy
      );

      // 6. Emit domain event
      await this.emitEvent('AppointmentCreated', {
        appointmentId: appointment.id,
        resourceId: normalizedData.resourceId,
        clientId: normalizedData.clientId,
        startTime: normalizedData.startTime,
        endTime: normalizedData.endTime
      });

      return appointment;
    });
  }

  private async validateBookingRules(
    tx: Database,
    appointmentData: NormalizedAppointmentData,
    bookingRules: BookingRule[],
    tenantId: string
  ): Promise<BookingRuleViolation[]> {
    const violations: BookingRuleViolation[] = [];
    const now = new Date();

    for (const rule of bookingRules) {
      if (!rule.isActive) continue;

      // Validate minimum advance booking
      if (rule.minAdvanceHours > 0) {
        const minAdvanceTime = new Date(
          now.getTime() + (rule.minAdvanceHours * 60 * 60 * 1000)
        );

        if (appointmentData.startTime < minAdvanceTime) {
          violations.push({
            ruleType: 'min_advance_hours',
            ruleId: rule.id,
            message: `Appointment must be booked at least ${rule.minAdvanceHours} hours in advance`,
            currentValue: Math.floor(
              (appointmentData.startTime.getTime() - now.getTime()) / (60 * 60 * 1000)
            ),
            requiredValue: rule.minAdvanceHours,
            severity: 'error'
          });
        }
      }

      // Validate maximum advance booking
      if (rule.maxAdvanceDays > 0) {
        const maxAdvanceTime = new Date(
          now.getTime() + (rule.maxAdvanceDays * 24 * 60 * 60 * 1000)
        );

        if (appointmentData.startTime > maxAdvanceTime) {
          violations.push({
            ruleType: 'max_advance_days',
            ruleId: rule.id,
            message: `Appointment cannot be booked more than ${rule.maxAdvanceDays} days in advance`,
            currentValue: Math.floor(
              (appointmentData.startTime.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
            ),
            requiredValue: rule.maxAdvanceDays,
            severity: 'error'
          });
        }
      }

      // Validate working hours
      if (rule.workingHoursStart && rule.workingHoursEnd) {
        const appointmentHour = appointmentData.startTime.getUTCHours();
        const startHour = parseInt(rule.workingHoursStart.split(':')[0]);
        const endHour = parseInt(rule.workingHoursEnd.split(':')[0]);

        if (appointmentHour < startHour || appointmentHour >= endHour) {
          violations.push({
            ruleType: 'working_hours',
            ruleId: rule.id,
            message: `Appointment must be within working hours (${rule.workingHoursStart} - ${rule.workingHoursEnd})`,
            currentValue: `${appointmentHour}:00`,
            requiredValue: `${rule.workingHoursStart} - ${rule.workingHoursEnd}`,
            severity: 'error'
          });
        }
      }

      // Validate allowed weekdays
      if (rule.allowedWeekdays && rule.allowedWeekdays.length > 0) {
        const appointmentDay = appointmentData.startTime.getUTCDay();
        
        if (!rule.allowedWeekdays.includes(appointmentDay)) {
          violations.push({
            ruleType: 'allowed_weekdays',
            ruleId: rule.id,
            message: `Appointment not allowed on this day of week`,
            currentValue: this.getDayName(appointmentDay),
            requiredValue: rule.allowedWeekdays.map(d => this.getDayName(d)).join(', '),
            severity: 'error'
          });
        }
      }

      // Validate maximum appointments per day
      if (rule.maxPerDay > 0) {
        const dayStart = new Date(appointmentData.startTime);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        const dayAppointments = await tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(appointments)
          .where(and(
            eq(appointments.resource_id, appointmentData.resourceId),
            eq(appointments.tenant_id, tenantId),
            gte(appointments.start_time, dayStart),
            lt(appointments.start_time, dayEnd),
            sql`${appointments.status} IN ('requested', 'confirmed')`
          ));

        const currentCount = dayAppointments[0].count;

        if (currentCount >= rule.maxPerDay) {
          violations.push({
            ruleType: 'max_per_day',
            ruleId: rule.id,
            message: `Maximum ${rule.maxPerDay} appointments per day allowed`,
            currentValue: currentCount + 1,
            requiredValue: rule.maxPerDay,
            severity: 'error'
          });
        }
      }

      // Validate maximum appointments per week
      if (rule.maxPerWeek > 0) {
        const weekStart = this.getWeekStart(appointmentData.startTime);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

        const weekAppointments = await tx
          .select({ count: sql<number>`COUNT(*)` })
          .from(appointments)
          .where(and(
            eq(appointments.resource_id, appointmentData.resourceId),
            eq(appointments.tenant_id, tenantId),
            gte(appointments.start_time, weekStart),
            lt(appointments.start_time, weekEnd),
            sql`${appointments.status} IN ('requested', 'confirmed')`
          ));

        const currentCount = weekAppointments[0].count;

        if (currentCount >= rule.maxPerWeek) {
          violations.push({
            ruleType: 'max_per_week',
            ruleId: rule.id,
            message: `Maximum ${rule.maxPerWeek} appointments per week allowed`,
            currentValue: currentCount + 1,
            requiredValue: rule.maxPerWeek,
            severity: 'error'
          });
        }
      }

      // Validate buffer time between appointments
      if (rule.bufferMinutes > 0) {
        const bufferStart = new Date(
          appointmentData.startTime.getTime() - (rule.bufferMinutes * 60 * 1000)
        );
        const bufferEnd = new Date(
          appointmentData.endTime.getTime() + (rule.bufferMinutes * 60 * 1000)
        );

        const conflictingAppointments = await tx
          .select()
          .from(appointments)
          .where(and(
            eq(appointments.resource_id, appointmentData.resourceId),
            eq(appointments.tenant_id, tenantId),
            sql`${appointments.status} IN ('requested', 'confirmed')`,
            sql`(${appointments.start_time} < ${bufferEnd} AND ${appointments.end_time} > ${bufferStart})`
          ));

        if (conflictingAppointments.length > 0) {
          violations.push({
            ruleType: 'buffer_time',
            ruleId: rule.id,
            message: `Appointment must have ${rule.bufferMinutes} minutes buffer from other appointments`,
            currentValue: 'No buffer',
            requiredValue: `${rule.bufferMinutes} minutes`,
            severity: 'error',
            conflictingAppointments: conflictingAppointments.map(a => ({
              id: a.id,
              startTime: a.start_time,
              endTime: a.end_time
            }))
          });
        }
      }
    }

    return violations;
  }

  private normalizeAppointmentData(data: CreateAppointmentRequest): NormalizedAppointmentData {
    // Convert all times to UTC for consistent storage
    const startTime = this.convertToUTC(data.startTime, data.timezone);
    const endTime = this.convertToUTC(data.endTime, data.timezone);

    return {
      ...data,
      startTime,
      endTime,
      timezone: data.timezone || 'UTC'
    };
  }

  private convertToUTC(date: Date, timezone: string): Date {
    // Convert from tenant timezone to UTC
    return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  }

  private getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    return weekStart;
  }
}
```

### Domain Error Classes

```typescript
export class BookingRuleViolationError extends DomainError {
  constructor(
    message: string,
    public readonly violations: BookingRuleViolation[]
  ) {
    super('BOOKING_RULE_VIOLATION', message, { violations });
  }
}

export interface BookingRuleViolation {
  ruleType: string;
  ruleId: string;
  message: string;
  currentValue: any;
  requiredValue: any;
  severity: 'warning' | 'error';
  conflictingAppointments?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
  }>;
}
```

### API Endpoint Implementation

```typescript
// src/routes/appointments.ts
router.post('/', validateRequest(createAppointmentSchema), async (req, res, next) => {
  try {
    const appointment = await appointmentService.createAppointment(
      req.body,
      req.tenant.id,
      req.user.id
    );

    res.status(201).json({ appointment });
  } catch (error) {
    if (error instanceof BookingRuleViolationError) {
      return res.status(422).json({
        error: error.message,
        code: error.code,
        violations: error.violations.map(violation => ({
          type: violation.ruleType,
          message: violation.message,
          currentValue: violation.currentValue,
          requiredValue: violation.requiredValue,
          severity: violation.severity,
          conflictingAppointments: violation.conflictingAppointments
        })),
        suggestions: [
          'Choose a different time slot',
          'Adjust booking parameters to meet requirements',
          'Contact support for rule exceptions'
        ],
        timestamp: new Date().toISOString()
      });
    }
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for booking with rule validation
export const AppointmentBookingForm: React.FC = () => {
  const [bookingData, setBookingData] = useState<CreateAppointmentRequest>({});
  const [ruleViolations, setRuleViolations] = useState<BookingRuleViolation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setRuleViolations([]);

    try {
      const appointment = await createAppointment(bookingData);
      onBookingSuccess(appointment);
    } catch (error) {
      if (error instanceof BookingRuleViolationError) {
        setRuleViolations(error.violations);
        showRuleViolationsDialog(error.violations);
      } else {
        showGenericError('Failed to book appointment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableTimeSlots = async () => {
    try {
      const slots = await getAvailableSlots({
        resourceId: bookingData.resourceId,
        startDate: bookingData.startTime,
        endDate: bookingData.endTime,
        timezone: bookingData.timezone
      });

      setAvailableTimeSlots(slots.filter(slot => !slot.hasViolations));
    } catch (error) {
      console.error('Failed to get available slots:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {ruleViolations.length > 0 && (
        <div className="rule-violations">
          <h3>Booking Rule Violations</h3>
          {ruleViolations.map((violation, index) => (
            <div key={index} className={`violation ${violation.severity}`}>
              <p>{violation.message}</p>
              <small>
                Current: {violation.currentValue} | Required: {violation.requiredValue}
              </small>
              {violation.conflictingAppointments && (
                <div className="conflicts">
                  <p>Conflicting appointments:</p>
                  {violation.conflictingAppointments.map(apt => (
                    <div key={apt.id}>
                      {formatDateTime(apt.startTime)} - {formatDateTime(apt.endTime)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Booking...' : 'Book Appointment'}
      </button>
    </form>
  );
};
```

### Database Schema Support

```sql
-- Booking rules table
CREATE TABLE booking_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  resource_id UUID REFERENCES resources(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Time-based rules
  min_advance_hours INTEGER DEFAULT 0,
  max_advance_days INTEGER DEFAULT 365,
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '17:00:00',
  allowed_weekdays INTEGER[], -- Array of weekday numbers (0=Sunday)
  
  -- Capacity rules
  max_per_day INTEGER DEFAULT 8,
  max_per_week INTEGER DEFAULT 40,
  buffer_minutes INTEGER DEFAULT 0,
  
  -- Business rules
  client_eligibility JSONB,
  service_constraints JSONB,
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_booking_rules_resource ON booking_rules(resource_id);
CREATE INDEX idx_booking_rules_tenant ON booking_rules(tenant_id);
CREATE INDEX idx_booking_rules_active ON booking_rules(is_active);
```

## Testing Requirements

### Unit Tests

**Test rule validation logic:**

```typescript
describe('Booking Rules Validation', () => {
  test('should reject appointment outside working hours', async () => {
    const rules = [createWorkingHoursRule('09:00', '17:00')];
    const appointmentData = {
      startTime: new Date('2026-01-01T20:00:00Z'),
      endTime: new Date('2026-01-01T21:00:00Z')
    };

    const violations = await validateBookingRules(appointmentData, rules);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleType).toBe('working_hours');
    expect(violations[0].severity).toBe('error');
  });

  test('should reject appointment with insufficient advance time', async () => {
    const rules = [createMinAdvanceRule(24)]; // 24 hours minimum
    const appointmentData = {
      startTime: new Date(Date.now() + (12 * 60 * 60 * 1000)), // 12 hours from now
      endTime: new Date(Date.now() + (13 * 60 * 60 * 1000))
    };

    const violations = await validateBookingRules(appointmentData, rules);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleType).toBe('min_advance_hours');
  });

  test('should reject appointment exceeding daily capacity', async () => {
    const rules = [createMaxPerDayRule(3)];
    
    // Mock existing appointments for the day
    mockExistingAppointments(3); // Already at capacity

    const appointmentData = {
      startTime: new Date('2026-01-01T10:00:00Z'),
      endTime: new Date('2026-01-01T11:00:00Z')
    };

    const violations = await validateBookingRules(appointmentData, rules);
    
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleType).toBe('max_per_day');
  });
});
```

### Integration Tests

**Test end-to-end booking flow:**

1. **Rule Application**: Test that rules are properly applied during booking
2. **Multiple Rules**: Test interaction between multiple rule types
3. **Resource-Specific Rules**: Test rules vary by resource
4. **Timezone Handling**: Test timezone conversion in rule validation

### Edge Cases

**Test these scenarios:**

1. **Conflicting Rules**: When multiple rules conflict, most restrictive wins
2. **Rule Overrides**: Admin users can override certain rules
3. **Grace Periods**: Rules with warning severity vs error severity
4. **Bulk Bookings**: Multiple appointments in single transaction

## Performance Considerations

### Efficient Rule Validation

```typescript
// Cache frequently accessed rules
private ruleCache = new Map<string, BookingRule[]>();

private async getCachedRules(resourceId: string, tenantId: string): Promise<BookingRule[]> {
  const cacheKey = `${tenantId}:${resourceId}`;
  
  if (!this.ruleCache.has(cacheKey)) {
    const rules = await this.getBookingRules(resourceId, tenantId);
    this.ruleCache.set(cacheKey, rules);
    
    // Cache for 5 minutes
    setTimeout(() => this.ruleCache.delete(cacheKey), 5 * 60 * 1000);
  }
  
  return this.ruleCache.get(cacheKey)!;
}
```

### Database Optimization

- Indexes on rule queries for performance
- Efficient date range queries for capacity checks
- Batch rule validation for multiple appointments

## Enforcement Checklist

- [ ] All booking rules are validated before appointment creation
- [ ] BookingRuleViolationError includes detailed violation information
- [ ] API endpoints return structured violation responses
- [ ] Frontend displays clear rule violation messages
- [ ] Database schema supports flexible rule configuration
- [ ] Timezone normalization is applied consistently
- [ ] Rule caching improves performance
- [ ] Comprehensive test coverage for all rule types
- [ ] Audit logging for rule violations
- [ ] Support for rule severity levels (warning vs error)
- [ ] Resource-specific rule inheritance
- [ ] Monitoring for rule validation performance
