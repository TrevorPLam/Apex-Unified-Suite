---
trigger: model_decision
description: All stored times must be in UTC; conversion to tenant timezone only at the presentation layer. Essential to avoid scheduling chaos.
---

# Appointment Timezone Normalization Rule

## Purpose

Enforce that all appointment times are stored in UTC in the database, with timezone conversion only happening at the presentation layer. This prevents scheduling chaos and ensures consistent time handling across different timezones.

## Core Requirements

### Storage Standard

**All time data must be stored as:**

- Database columns: `TIMESTAMPTZ` (UTC)
- API payloads: ISO 8601 strings with timezone information
- Internal processing: UTC Date objects
- Timezone information: Stored as separate metadata field

### Conversion Points

**UTC → Tenant Timezone (Presentation):**
- API responses to frontend
- Email notifications
- Calendar exports
- User interface display

**Tenant Timezone → UTC (Storage):**
- API request processing
- Form submissions
- Calendar imports
- External integrations

## Implementation Requirements

### Database Schema

```sql
-- Appointments table with timezone support
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  resource_id UUID NOT NULL REFERENCES resources(id),
  
  -- Time fields (always stored in UTC)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Timezone metadata
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  original_start_time TIMESTAMPTZ, -- Store original local time for reference
  original_end_time TIMESTAMPTZ,
  
  status VARCHAR(20) NOT NULL DEFAULT 'requested',
  notes TEXT,
  created_by UUID REFERENCES users(id)
);

-- Indexes for time-based queries
CREATE INDEX idx_appointments_resource_time ON appointments(resource_id, start_time, end_time);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
```

### Service Layer Implementation

```typescript
// src/services/TimezoneService.ts
export class TimezoneService {
  /**
   * Convert local time to UTC for storage
   */
  toUTC(localDate: Date, timezone: string): Date {
    // Create a date string in the local timezone
    const localString = localDate.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse it as if it's in the local timezone, then convert to UTC
    const utcDate = new Date(localString + ' UTC');
    return utcDate;
  }

  /**
   * Convert UTC time to local timezone for display
   */
  fromUTC(utcDate: Date, timezone: string): Date {
    // Create a date string representing the UTC time
    const utcString = utcDate.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse it as UTC and display in local timezone
    const localDate = new Date(utcString);
    return localDate;
  }

  /**
   * Validate timezone string
   */
  isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get timezone offset in minutes
   */
  getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    const utcDate = new Date(date.toISOString());
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    
    return (localDate.getTime() - utcDate.getTime()) / (60 * 1000);
  }

  /**
   * Format time for display in tenant timezone
   */
  formatForDisplay(utcDate: Date, timezone: string, format: 'full' | 'date' | 'time' = 'full'): string {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: format === 'full' || format === 'date' ? 'numeric' : undefined,
      month: format === 'full' || format === 'date' ? 'long' : undefined,
      day: format === 'full' || format === 'date' ? 'numeric' : undefined,
      hour: format === 'full' || format === 'time' ? 'numeric' : undefined,
      minute: format === 'full' || format === 'time' ? 'numeric' : undefined,
      hour12: true
    };

    return utcDate.toLocaleString('en-US', options);
  }
}

// src/services/AppointmentService.ts
export class AppointmentService {
  constructor(
    private db: Database,
    private timezoneService: TimezoneService
  ) {}

  async createAppointment(
    appointmentData: CreateAppointmentRequest,
    tenantId: string,
    createdBy: string
  ): Promise<Appointment> {
    // Validate timezone
    if (!this.timezoneService.isValidTimezone(appointmentData.timezone)) {
      throw new InvalidTimezoneError(`Invalid timezone: ${appointmentData.timezone}`);
    }

    // Convert times to UTC for storage
    const utcStartTime = this.timezoneService.toUTC(
      appointmentData.startTime,
      appointmentData.timezone
    );
    const utcEndTime = this.timezoneService.toUTC(
      appointmentData.endTime,
      appointmentData.timezone
    );

    // Validate time logic in UTC
    if (utcEndTime <= utcStartTime) {
      throw new InvalidTimeRangeError('End time must be after start time');
    }

    return await this.db.transaction(async (tx) => {
      // Store appointment with UTC times and timezone metadata
      const appointment = await tx.insert(appointments).values({
        tenantId,
        clientId: appointmentData.clientId,
        resourceId: appointmentData.resourceId,
        startTime: utcStartTime,
        endTime: utcEndTime,
        timezone: appointmentData.timezone,
        originalStartTime: appointmentData.startTime,
        originalEndTime: appointmentData.endTime,
        status: 'requested',
        notes: appointmentData.notes,
        createdBy
      }).returning();

      return appointment[0];
    });
  }

  async getAppointmentsForDate(
    resourceId: string,
    date: Date,
    tenantId: string,
    timezone: string
  ): Promise<AppointmentWithLocalTimes[]> {
    // Convert the requested date to UTC range
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // Query appointments in UTC
    const appointments = await this.db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.resource_id, resourceId),
        eq(appointments.tenant_id, tenantId),
        gte(appointments.start_time, startOfDay),
        lt(appointments.start_time, endOfDay),
        sql`${appointments.status} IN ('requested', 'confirmed')`
      ))
      .orderBy(appointments.start_time);

    // Convert back to local times for display
    return appointments.map(apt => ({
      ...apt,
      localStartTime: this.timezoneService.fromUTC(apt.start_time, timezone),
      localEndTime: this.timezoneService.fromUTC(apt.end_time, timezone),
      formattedStartTime: this.timezoneService.formatForDisplay(apt.start_time, timezone, 'time'),
      formattedEndTime: this.timezoneService.formatForDisplay(apt.end_time, timezone, 'time')
    }));
  }

  async updateAppointmentTime(
    appointmentId: string,
    newStartTime: Date,
    newEndTime: Date,
    timezone: string,
    tenantId: string,
    updatedBy: string
  ): Promise<Appointment> {
    // Convert to UTC
    const utcStartTime = this.timezoneService.toUTC(newStartTime, timezone);
    const utcEndTime = this.timezoneService.toUTC(newEndTime, timezone);

    return await this.db.transaction(async (tx) => {
      const updated = await tx
        .update(appointments)
        .set({
          startTime: utcStartTime,
          endTime: utcEndTime,
          timezone,
          originalStartTime: newStartTime,
          originalEndTime: newEndTime,
          updatedAt: new Date(),
          updatedBy
        })
        .where(and(
          eq(appointments.id, appointmentId),
          eq(appointments.tenant_id, tenantId)
        ))
        .returning();

      return updated[0];
    });
  }
}
```

### API Layer Implementation

```typescript
// src/routes/appointments.ts
router.post('/', validateRequest(createAppointmentSchema), async (req, res, next) => {
  try {
    // Request should include timezone
    const { timezone = 'UTC', ...appointmentData } = req.body;

    // Validate timezone
    if (!timezoneService.isValidTimezone(timezone)) {
      return res.status(400).json({
        error: 'Invalid timezone provided',
        code: 'INVALID_TIMEZONE',
        supportedTimezones: getSupportedTimezones()
      });
    }

    const appointment = await appointmentService.createAppointment(
      {
        ...appointmentData,
        timezone
      },
      req.tenant.id,
      req.user.id
    );

    // Return appointment with both UTC and local times
    res.status(201).json({
      appointment: {
        ...appointment,
        localStartTime: timezoneService.fromUTC(appointment.start_time, timezone),
        localEndTime: timezoneService.fromUTC(appointment.end_time, timezone),
        formattedTimeRange: `${timezoneService.formatForDisplay(appointment.start_time, timezone, 'time')} - ${timezoneService.formatForDisplay(appointment.end_time, timezone, 'time')}`
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res, next) => {
  try {
    const appointment = await appointmentService.findById(req.params.id, req.tenant.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Get user's preferred timezone (from user profile or request header)
    const timezone = req.headers['x-timezone'] || req.user.timezone || 'UTC';

    res.json({
      appointment: {
        ...appointment,
        localStartTime: timezoneService.fromUTC(appointment.start_time, timezone),
        localEndTime: timezoneService.fromUTC(appointment.end_time, timezone),
        timezone,
        formattedDate: timezoneService.formatForDisplay(appointment.start_time, timezone, 'date'),
        formattedTimeRange: `${timezoneService.formatForDisplay(appointment.start_time, timezone, 'time')} - ${timezoneService.formatForDisplay(appointment.end_time, timezone, 'time')}`
      }
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for appointment booking
export const AppointmentBookingForm: React.FC = () => {
  const [timezone, setTimezone] = useState(getUserTimezone());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // Fetch available slots for the selected date
    fetchAvailableSlots(selectedDate, timezone);
  }, [selectedDate, timezone]);

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    // Refresh available slots for new timezone
    fetchAvailableSlots(selectedDate, newTimezone);
  };

  const handleBooking = async (slot: TimeSlot) => {
    try {
      // Send booking request with local times and timezone
      const appointment = await createAppointment({
        resourceId: slot.resourceId,
        clientId: selectedClient.id,
        startTime: slot.startTime, // Local time
        endTime: slot.endTime, // Local time
        timezone: timezone
      });

      onBookingSuccess(appointment);
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  return (
    <div>
      <div className="timezone-selector">
        <label htmlFor="timezone">Timezone:</label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => handleTimezoneChange(e.target.value)}
        >
          {getSupportedTimezones().map(tz => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      <div className="date-picker">
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          timeZone={timezone}
        />
      </div>

      <div className="time-slots">
        <h3>Available Times - {formatDate(selectedDate, timezone)}</h3>
        {availableSlots.map(slot => (
          <TimeSlotCard
            key={slot.id}
            slot={slot}
            timezone={timezone}
            onBook={handleBooking}
          />
        ))}
      </div>
    </div>
  );
};

// Utility function for formatting dates
function formatDate(date: Date, timezone: string): string {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
```

### Domain Error Classes

```typescript
export class InvalidTimezoneError extends DomainError {
  constructor(message: string) {
    super('INVALID_TIMEZONE', message);
  }
}

export class InvalidTimeRangeError extends DomainError {
  constructor(message: string) {
    super('INVALID_TIME_RANGE', message);
  }
}

export class TimezoneConversionError extends DomainError {
  constructor(message: string, public readonly details: any) {
    super('TIMEZONE_CONVERSION_ERROR', message, details);
  }
}
```

## Testing Requirements

### Unit Tests

**Test timezone conversion logic:**

```typescript
describe('TimezoneService', () => {
  describe('toUTC', () => {
    test('should convert EST time to UTC correctly', () => {
      const localTime = new Date('2026-01-15T14:00:00'); // 2 PM EST
      const utcTime = timezoneService.toUTC(localTime, 'America/New_York');
      
      // EST is UTC-5 in January, so 2 PM EST = 7 PM UTC
      expect(utcTime.getUTCHours()).toBe(19);
      expect(utcTime.getUTCDate()).toBe(15);
    });

    test('should handle daylight saving time correctly', () => {
      const localTime = new Date('2026-07-15T14:00:00'); // 2 PM EDT
      const utcTime = timezoneService.toUTC(localTime, 'America/New_York');
      
      // EDT is UTC-4 in July, so 2 PM EDT = 6 PM UTC
      expect(utcTime.getUTCHours()).toBe(18);
    });
  });

  describe('fromUTC', () => {
    test('should convert UTC time to EST correctly', () => {
      const utcTime = new Date('2026-01-15T19:00:00Z'); // 7 PM UTC
      const localTime = timezoneService.fromUTC(utcTime, 'America/New_York');
      
      // Should display as 2 PM local time
      expect(localTime.getHours()).toBe(14);
    });
  });

  describe('formatForDisplay', () => {
    test('should format time correctly for different timezones', () => {
      const utcTime = new Date('2026-01-15T19:00:00Z');
      
      const formatted = timezoneService.formatForDisplay(
        utcTime, 
        'America/New_York', 
        'full'
      );
      
      expect(formatted).toContain('2:00 PM');
      expect(formatted).toContain('January 15, 2026');
    });
  });
});
```

### Integration Tests

**Test end-to-end timezone handling:**

1. **Appointment Creation**: Test appointment creation with different timezones
2. **Time Display**: Verify correct display in user's timezone
3. **Availability Calculation**: Test slot generation respects timezone
4. **Cross-Timezone Queries**: Test appointments spanning timezone boundaries

### Edge Cases

**Test these scenarios:**

1. **Invalid Timezones**: Handle invalid timezone strings gracefully
2. **DST Transitions**: Test appointments during daylight saving time changes
3. **International Date Line**: Test date calculations across date lines
4. **Leap Years**: Test February 29th handling

## Performance Considerations

### Caching Strategy

```typescript
// Cache timezone conversions for performance
private timezoneCache = new Map<string, Map<string, Date>>();

getCachedConversion(utcDate: Date, timezone: string): Date {
  const cacheKey = `${utcDate.toISOString()}-${timezone}`;
  
  if (!this.timezoneCache.has(cacheKey)) {
    const localDate = this.fromUTC(utcDate, timezone);
    this.timezoneCache.set(cacheKey, localDate);
    
    // Cache for 1 hour
    setTimeout(() => this.timezoneCache.delete(cacheKey), 60 * 60 * 1000);
  }
  
  return this.timezoneCache.get(cacheKey)!;
}
```

### Database Optimization

- Use `TIMESTAMPTZ` for all time columns
- Index on UTC time columns for efficient queries
- Avoid timezone conversions in database queries

## Monitoring

**Track timezone-related metrics:**

- Timezone conversion success/failure rates
- Performance of timezone conversion functions
- User timezone distribution
- Appointment booking errors by timezone

## Enforcement Checklist

- [ ] All time data stored in UTC in database
- [ ] Timezone conversion only at presentation layer
- [ ] API accepts timezone information in requests
- [ ] Frontend displays times in user's local timezone
- [ ] Timezone validation prevents invalid values
- [ ] Comprehensive test coverage for timezone scenarios
- [ ] Performance monitoring for conversion operations
- [ ] Error handling for timezone conversion failures
- [ ] Support for daylight saving time transitions
- [ ] Audit logging for timezone-related operations
- [ ] Documentation of timezone handling patterns
- [ ] User preference management for timezone selection
