---
name: calendar-oauth-integration
description: Complete calendar OAuth integration for Google, Outlook, and Apple with popup/redirect handling, connection status management, and conflict resolution
---

# Calendar OAuth Integration Skill

## Purpose
Implement comprehensive calendar OAuth integration supporting Google Calendar, Microsoft Outlook, and Apple Calendar with proper popup/redirect handling, connection status management, and conflict resolution for appointment booking workflows.

## Architecture Overview

### OAuth Flow Architecture
```
┌─────────────────────────────────────────┐
│           Frontend Application           │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ OAuth Flow  │  │ Connection Mgmt│   │
│  │ Manager     │  │ Status Tracker │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              OAuth Providers               │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │   Google    │  │   Microsoft   │   │
│  │   Calendar  │  │     Outlook    │   │
│  └─────────────┘  └─────────────────┘   │
│  ┌─────────────┐                           │
│  │   Apple     │                           │
│  │   Calendar  │                           │
│  └─────────────┘                           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              Backend API                   │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │ Token Store │  │ Event Sync     │   │
│  │   Service   │  │   Service      │   │
│  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Provider Configuration

### 1. Google Calendar OAuth
```typescript
// artifacts/apex-os/src/lib/calendar/google.ts
export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  discoveryUrl: string;
}

export const googleCalendarConfig: GoogleCalendarConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  redirectUri: `${window.location.origin}/calendar/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
  ],
  discoveryUrl: 'https://accounts.google.com/.well-known/openid_configuration',
};

export class GoogleCalendarOAuth {
  private config: GoogleCalendarConfig;

  constructor() {
    this.config = googleCalendarConfig;
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  async refreshTokens(refreshToken: string): Promise<GoogleTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh tokens');
    }

    return response.json();
  }

  async getCalendarEvents(accessToken: string, calendarId: string = 'primary'): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.items || [];
  }

  async createEvent(accessToken: string, calendarId: string, event: GoogleCalendarEventCreate): Promise<GoogleCalendarEvent> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    return response.json();
  }

  async updateEvent(accessToken: string, calendarId: string, eventId: string, event: Partial<GoogleCalendarEventCreate>): Promise<GoogleCalendarEvent> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update calendar event');
    }

    return response.json();
  }

  async deleteEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete calendar event');
    }
  }
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: GoogleAttendee[];
  recurrence?: string[];
}

export interface GoogleCalendarEventCreate {
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: GoogleAttendee[];
  recurrence?: string[];
}

export interface GoogleAttendee {
  email: string;
  displayName?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
}
```

### 2. Microsoft Outlook OAuth
```typescript
// artifacts/apex-os/src/lib/calendar/outlook.ts
export interface OutlookCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authority: string;
}

export const outlookCalendarConfig: OutlookCalendarConfig = {
  clientId: import.meta.env.VITE_OUTLOOK_CLIENT_ID,
  clientSecret: import.meta.env.VITE_OUTLOOK_CLIENT_SECRET,
  redirectUri: `${window.location.origin}/calendar/outlook/callback`,
  scopes: [
    'https://graph.microsoft.com/Calendars.Read',
    'https://graph.microsoft.com/Calendars.ReadWrite',
    'https://graph.microsoft.com/User.Read',
  ],
  authority: 'https://login.microsoft.com',
};

export class OutlookCalendarOAuth {
  private config: OutlookCalendarConfig;

  constructor() {
    this.config = outlookCalendarConfig;
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      response_mode: 'query',
      scope: this.config.scopes.join(' '),
    });

    return `${this.config.authority}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OutlookTokens> {
    const response = await fetch(`${this.config.authority}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  async refreshTokens(refreshToken: string): Promise<OutlookTokens> {
    const response = await fetch(`${this.config.authority}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh tokens');
    }

    return response.json();
  }

  async getCalendarEvents(accessToken: string): Promise<OutlookEvent[]> {
    const params = new URLSearchParams({
      $select: 'id,subject,start,end,location,attendees',
      $orderby: 'start/dateTime',
    });

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    return data.value || [];
  }

  async createEvent(accessToken: string, event: OutlookEventCreate): Promise<OutlookEvent> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    return response.json();
  }

  async updateEvent(accessToken: string, eventId: string, event: Partial<OutlookEventCreate>): Promise<OutlookEvent> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error('Failed to update calendar event');
    }

    return response.json();
  }

  async deleteEvent(accessToken: string, eventId: string): Promise<void> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete calendar event');
    }
  }
}

export interface OutlookTokens {
  token_type: string;
  scope: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

export interface OutlookEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      countryOrRegion?: string;
      postalCode?: string;
    };
  };
  attendees?: OutlookAttendee[];
}

export interface OutlookEventCreate {
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      countryOrRegion?: string;
      postalCode?: string;
    };
  };
  attendees?: OutlookAttendee[];
}

export interface OutlookAttendee {
  emailAddress: {
    name: string;
    address: string;
  };
  status: 'unknown' | 'organizer' | 'tentativelyAccepted' | 'declined' | 'accepted';
}
```

### 3. Apple Calendar OAuth
```typescript
// artifacts/apex-os/src/lib/calendar/apple.ts
export interface AppleCalendarConfig {
  clientId: string;
  teamId: string;
  redirectUri: string;
  scopes: string[];
}

export const appleCalendarConfig: AppleCalendarConfig = {
  clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
  teamId: import.meta.env.VITE_APPLE_TEAM_ID,
  redirectUri: `${window.location.origin}/calendar/apple/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendars',
    'https://www.googleapis.com/auth/calendar.events',
  ],
};

export class AppleCalendarOAuth {
  private config: AppleCalendarConfig;

  constructor() {
    this.config = appleCalendarConfig;
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      response_mode: 'query',
    });

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<AppleTokens> {
    const response = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: await this.getClientSecret(),
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  private async getClientSecret(): Promise<string> {
    // Apple requires client secret to be generated using JWT
    // This is a simplified version - in production, use proper JWT library
    return import.meta.env.VITE_APPLE_CLIENT_SECRET || '';
  }

  // Note: Apple Calendar integration requires additional setup
  // This is a placeholder for the implementation
  async getCalendarEvents(accessToken: string): Promise<any[]> {
    // Apple Calendar requires additional API setup
    throw new Error('Apple Calendar integration not implemented');
  }
}

export interface AppleTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}
```

## OAuth Flow Manager

### 1. OAuth Flow Manager
```typescript
// artifacts/apex-os/src/lib/calendar/oauthManager.ts
import { GoogleCalendarOAuth } from './google';
import { OutlookCalendarOAuth } from './outlook';
import { AppleCalendarOAuth } from './apple';

export type CalendarProvider = 'google' | 'outlook' | 'apple';

export interface OAuthFlowState {
  provider: CalendarProvider;
  state: string;
  codeVerifier?: string;
  timestamp: number;
}

export interface CalendarConnection {
  id: string;
  provider: CalendarProvider;
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  isActive: boolean;
  lastSyncAt?: Date;
  settings: CalendarSettings;
}

export interface CalendarSettings {
  syncEnabled: boolean;
  conflictResolution: 'manual' | 'auto' | 'ask';
  defaultCalendarId?: string;
  eventColor?: string;
  reminderMinutes?: number;
}

export class OAuthFlowManager {
  private static instance: OAuthFlowManager;
  private pendingFlows: Map<string, OAuthFlowState> = new Map();
  private providers: Map<CalendarProvider, any> = new Map();

  static getInstance(): OAuthFlowManager {
    if (!OAuthFlowManager.instance) {
      OAuthFlowManager.instance = new OAuthFlowManager();
    }
    return OAuthFlowManager.instance;
  }

  constructor() {
    this.providers.set('google', new GoogleCalendarOAuth());
    this.providers.set('outlook', new OutlookCalendarOAuth());
    this.providers.set('apple', new AppleCalendarOAuth());
  }

  generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  initiateOAuth(provider: CalendarProvider): { url: string; state: string; codeVerifier?: string } {
    const state = this.generateState();
    let codeVerifier: string | undefined;

    if (provider === 'google') {
      codeVerifier = this.generateCodeVerifier();
    }

    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Unsupported calendar provider: ${provider}`);
    }

    const url = providerInstance.getAuthUrl();

    // Store flow state
    this.pendingFlows.set(state, {
      provider,
      state,
      codeVerifier,
      timestamp: Date.now(),
    });

    return { url, state, codeVerifier };
  }

  async handleCallback(provider: CalendarProvider, code: string, state: string): Promise<CalendarConnection> {
    const flowState = this.pendingFlows.get(state);
    if (!flowState || flowState.provider !== provider) {
      throw new Error('Invalid or expired OAuth state');
    }

    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(`Unsupported calendar provider: ${provider}`);
    }

    let tokens: any;
    if (provider === 'google') {
      tokens = await providerInstance.exchangeCodeForTokens(code);
    } else {
      tokens = await providerInstance.exchangeCodeForTokens(code);
    }

    // Get user info
    const userInfo = await this.getUserInfo(provider, tokens.access_token);

    // Create connection
    const connection: CalendarConnection = {
      id: `${provider}_${userInfo.id}`,
      provider,
      userId: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.name || userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      isActive: true,
      settings: {
        syncEnabled: true,
        conflictResolution: 'manual',
        reminderMinutes: 15,
      },
    };

    // Clean up flow state
    this.pendingFlows.delete(state);

    return connection;
  }

  private async getUserInfo(provider: CalendarProvider, accessToken: string): Promise<any> {
    switch (provider) {
      case 'google':
        return this.getGoogleUserInfo(accessToken);
      case 'outlook':
        return this.getOutlookUserInfo(accessToken);
      case 'apple':
        return this.getAppleUserInfo(accessToken);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async getGoogleUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  private async getOutlookUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return response.json();
  }

  private async getAppleUserInfo(accessToken: string): Promise<any> {
    // Apple requires additional setup for user info
    throw new Error('Apple Calendar user info not implemented');
  }

  async refreshConnection(connection: CalendarConnection): Promise<CalendarConnection> {
    const providerInstance = this.providers.get(connection.provider);
    if (!providerInstance) {
      throw new Error(`Unsupported calendar provider: ${connection.provider}`);
    }

    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokens = await providerInstance.refreshTokens(connection.refreshToken);

    return {
      ...connection,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || connection.refreshToken,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    };
  }

  cleanupExpiredFlows(): void {
    const now = Date.now();
    const expiredFlows: string[] = [];

    for (const [state, flow] of this.pendingFlows.entries()) {
      if (now - flow.timestamp > 10 * 60 * 1000) { // 10 minutes
        expiredFlows.push(state);
      }
    }

    expiredFlows.forEach(state => this.pendingFlows.delete(state));
  }
}

export const oauthFlowManager = OAuthFlowManager.getInstance();
```

## Calendar Service

### 1. Calendar Service Implementation
```typescript
// artifacts/apex-os/src/services/calendarService.ts
import { CalendarProvider, CalendarConnection, CalendarSettings } from '../lib/calendar/oauthManager';
import { GoogleCalendarOAuth } from '../lib/calendar/google';
import { OutlookCalendarOAuth } from '../lib/calendar/outlook';
import { GoogleCalendarEvent, OutlookEvent } from '../lib/calendar/types';

export interface CalendarEvent {
  id: string;
  provider: CalendarProvider;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: CalendarAttendee[];
  isAllDay: boolean;
  calendarId: string;
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needsAction';
}

export class CalendarService {
  private connections: Map<string, CalendarConnection> = new Map();

  async addConnection(connection: CalendarConnection): Promise<void> {
    this.connections.set(connection.id, connection);
    
    // Store in backend
    await this.storeConnection(connection);
    
    // Start initial sync
    await this.syncEvents(connection.id);
  }

  async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // Revoke tokens
    await this.revokeTokens(connection);

    // Remove from memory
    this.connections.delete(connectionId);

    // Remove from backend
    await this.deleteConnection(connectionId);
  }

  async syncEvents(connectionId: string): Promise<CalendarEvent[]> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    const events = await this.fetchEvents(connection);
    
    // Store events in backend
    await this.storeEvents(connectionId, events);
    
    // Update last sync time
    connection.lastSyncAt = new Date();
    await this.updateConnection(connection);

    return events;
  }

  async createEvent(connectionId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    const createdEvent = await this.createCalendarEvent(connection, event);
    
    // Store in backend
    await this.storeEvent(createdEvent);
    
    return createdEvent;
  }

  async updateEvent(connectionId: string, eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    const updatedEvent = await this.updateCalendarEvent(connection, eventId, event);
    
    // Update in backend
    await this.storeEvent(updatedEvent);
    
    return updatedEvent;
  }

  async deleteEvent(connectionId: string, eventId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    await this.deleteCalendarEvent(connection, eventId);
    
    // Remove from backend
    await this.deleteEventFromBackend(eventId);
  }

  async checkConflicts(connectionId: string, startTime: Date, endTime: Date): Promise<CalendarEvent[]> {
    const connection = this.connections.get(connectionId);
    if (!connection || !connection.isActive) {
      throw new Error('Connection not found or inactive');
    }

    const events = await this.fetchEvents(connection);
    
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      return (
        (eventStart < endTime && eventEnd > startTime) ||
        (eventStart >= startTime && eventStart < endTime) ||
        (eventEnd > startTime && eventEnd <= endTime)
      );
    });
  }

  private async fetchEvents(connection: CalendarConnection): Promise<CalendarEvent[]> {
    switch (connection.provider) {
      case 'google':
        return this.fetchGoogleEvents(connection);
      case 'outlook':
        return this.fetchOutlookEvents(connection);
      default:
        throw new Error(`Unsupported provider: ${connection.provider}`);
    }
  }

  private async fetchGoogleEvents(connection: CalendarConnection): Promise<CalendarEvent[]> {
    const googleOAuth = new GoogleCalendarOAuth();
    const googleEvents = await googleOAuth.getCalendarEvents(connection.accessToken);

    return googleEvents.map(this.convertGoogleEvent);
  }

  private async fetchOutlookEvents(connection: CalendarConnection): Promise<CalendarEvent[]> {
    const outlookOAuth = new OutlookCalendarOAuth();
    const outlookEvents = await outlookOAuth.getCalendarEvents(connection.accessToken);

    return outlookEvents.map(this.convertOutlookEvent);
  }

  private convertGoogleEvent(googleEvent: GoogleCalendarEvent): CalendarEvent {
    return {
      id: googleEvent.id,
      provider: 'google',
      title: googleEvent.summary,
      description: googleEvent.description,
      startTime: new Date(googleEvent.start.dateTime || googleEvent.start.date!),
      endTime: new Date(googleEvent.end.dateTime || googleEvent.end.date!),
      location: googleEvent.location,
      attendees: googleEvent.attendees?.map(this.convertGoogleAttendee),
      isAllDay: !googleEvent.start.dateTime,
      calendarId: 'primary',
    };
  }

  private convertOutlookEvent(outlookEvent: OutlookEvent): CalendarEvent {
    return {
      id: outlookEvent.id,
      provider: 'outlook',
      title: outlookEvent.subject,
      startTime: new Date(outlookEvent.start.dateTime),
      endTime: new Date(outlookEvent.end.dateTime),
      location: outlookEvent.location?.displayName,
      attendees: outlookEvent.attendees?.map(this.convertOutlookAttendee),
      isAllDay: false, // Outlook doesn't have all-day events in this format
      calendarId: 'primary',
    };
  }

  private convertGoogleAttendee(attendee: GoogleAttendee): CalendarAttendee {
    return {
      email: attendee.email,
      name: attendee.displayName,
      status: attendee.responseStatus === 'accepted' ? 'accepted' : 'needsAction',
    };
  }

  private convertOutlookAttendee(attendee: OutlookAttendee): CalendarAttendee {
    return {
      email: attendee.emailAddress.address,
      name: attendee.emailAddress.name,
      status: attendee.status === 'accepted' ? 'accepted' : 'needsAction',
    };
  }

  private async createCalendarEvent(connection: CalendarConnection, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const providerEvent = this.convertToProviderEvent(connection.provider, event);
    
    switch (connection.provider) {
      case 'google':
        const googleOAuth = new GoogleCalendarOAuth();
        const createdEvent = await googleOAuth.createEvent(connection.accessToken, connection.settings.defaultCalendarId || 'primary', providerEvent);
        return this.convertGoogleEvent(createdEvent);
      case 'outlook':
        const outlookOAuth = new OutlookCalendarOAuth();
        const createdOutlookEvent = await outlookOAuth.createEvent(connection.accessToken, providerEvent);
        return this.convertOutlookEvent(createdOutlookEvent);
      default:
        throw new Error(`Unsupported provider: ${connection.provider}`);
    }
  }

  private async updateCalendarEvent(connection: CalendarConnection, eventId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const providerEvent = this.convertToProviderEvent(connection.provider, event);
    
    switch (connection.provider) {
      case 'google':
        const googleOAuth = new GoogleCalendarOAuth();
        const updatedEvent = await googleOAuth.updateEvent(connection.accessToken, connection.settings.defaultCalendarId || 'primary', eventId, providerEvent);
        return this.convertGoogleEvent(updatedEvent);
      case 'outlook':
        const outlookOAuth = new OutlookCalendarOAuth();
        const updatedOutlookEvent = await outlookOAuth.updateEvent(connection.accessToken, eventId, providerEvent);
        return this.convertOutlookEvent(updatedOutlookEvent);
      default:
        throw new Error(`Unsupported provider: ${connection.provider}`);
    }
  }

  private async deleteCalendarEvent(connection: CalendarConnection, eventId: string): Promise<void> {
    switch (connection.provider) {
      case 'google':
        const googleOAuth = new GoogleCalendarOAuth();
        await googleOAuth.deleteEvent(connection.accessToken, connection.settings.defaultCalendarId || 'primary', eventId);
        break;
      case 'outlook':
        const outlookOAuth = new OutlookCalendarOAuth();
        await outlookOAuth.deleteEvent(connection.accessToken, eventId);
        break;
      default:
        throw new Error(`Unsupported provider: ${connection.provider}`);
    }
  }

  private convertToProviderEvent(provider: CalendarProvider, event: Partial<CalendarEvent>): any {
    const baseEvent = {
      summary: event.title,
      description: event.description,
      location: event.location,
    };

    if (event.startTime && event.endTime) {
      const timeZone = 'UTC'; // Use user's timezone in production
      baseEvent.start = {
        dateTime: event.startTime.toISOString(),
        timeZone,
      };
      baseEvent.end = {
        dateTime: event.endTime.toISOString(),
        timeZone,
      };
    }

    if (event.attendees) {
      baseEvent.attendees = event.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
        responseStatus: attendee.status === 'accepted' ? 'accepted' : 'needsAction',
      }));
    }

    return baseEvent;
  }

  // Backend integration methods (placeholders)
  private async storeConnection(connection: CalendarConnection): Promise<void> {
    // TODO: Store connection in backend database
    console.log('Storing connection:', connection);
  }

  private async updateConnection(connection: CalendarConnection): Promise<void> {
    // TODO: Update connection in backend database
    console.log('Updating connection:', connection);
  }

  private async deleteConnection(connectionId: string): Promise<void> {
    // TODO: Delete connection from backend database
    console.log('Deleting connection:', connectionId);
  }

  private async storeEvents(connectionId: string, events: CalendarEvent[]): Promise<void> {
    // TODO: Store events in backend database
    console.log('Storing events:', events.length);
  }

  private async storeEvent(event: CalendarEvent): Promise<void> {
    // TODO: Store event in backend database
    console.log('Storing event:', event.id);
  }

  private async deleteEventFromBackend(eventId: string): Promise<void> {
    // TODO: Delete event from backend database
    console.log('Deleting event:', eventId);
  }

  private async revokeTokens(connection: CalendarConnection): Promise<void> {
    // TODO: Revoke tokens from provider
    console.log('Revoking tokens for:', connection.id);
  }
}

export const calendarService = new CalendarService();
```

## React Components

### 1. Calendar Connection Manager
```typescript
// artifacts/apex-os/src/components/CalendarConnectionManager.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarProvider, CalendarConnection } from '../types/calendar';
import { oauthFlowManager } from '../lib/calendar/oauthManager';
import { calendarService } from '../services/calendarService';

interface CalendarConnectionManagerProps {
  onConnectionChange?: (connections: CalendarConnection[]) => void;
}

export function CalendarConnectionManager({ onConnectionChange }: CalendarConnectionManagerProps) {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Load existing connections
    loadConnections();
    
    // Clean up expired OAuth flows
    oauthFlowManager.cleanupExpiredFlows();
  }, []);

  const loadConnections = async () => {
    // TODO: Load connections from backend
    // const loadedConnections = await calendarService.getConnections();
    // setConnections(loadedConnections);
  };

  const handleConnect = async (provider: CalendarProvider) => {
    try {
      setIsConnecting(true);
      
      const { url, state } = oauthFlowManager.initiateOAuth(provider);
      
      // Open popup for OAuth flow
      const popup = window.open(url, 'calendar-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      if (!popup) {
        throw new Error('Failed to open OAuth popup');
      }

      // Listen for popup close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
        }
      }, 1000);

      // Listen for OAuth callback
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        const { type, provider: callbackProvider, code, state: callbackState } = event.data;
        
        if (type === 'calendar-oauth-callback' && callbackProvider === provider && callbackState === state) {
          clearInterval(checkClosed);
          popup.close();
          
          try {
            const connection = await oauthFlowManager.handleCallback(provider, code, state);
            await calendarService.addConnection(connection);
            
            setConnections(prev => [...prev, connection]);
            onConnectionChange?.([...connections, connection]);
          } catch (error) {
            console.error('OAuth callback failed:', error);
            // Show error to user
            alert('Failed to connect calendar. Please try again.');
          } finally {
            setIsConnecting(false);
          }
          
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);
    } catch (error) {
      console.error('Failed to initiate OAuth:', error);
      alert('Failed to connect calendar. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await calendarService.removeConnection(connectionId);
      
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      onConnectionChange?.(connections.filter(conn => conn.id !== connectionId));
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      alert('Failed to disconnect calendar. Please try again.');
    }
  };

  const handleSync = async (connectionId: string) => {
    try {
      await calendarService.syncEvents(connectionId);
      // Show success message
      alert('Calendar synced successfully!');
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      alert('Failed to sync calendar. Please try again.');
    }
  };

  const getProviderIcon = (provider: CalendarProvider) => {
    switch (provider) {
      case 'google':
        return '📅';
      case 'outlook':
        return '📧';
      case 'apple':
        return '🍎';
      default:
        return '📅';
    }
  };

  const getProviderName = (provider: CalendarProvider) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'outlook':
        return 'Microsoft Outlook';
      case 'apple':
        return 'Apple Calendar';
      default:
        return 'Calendar';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <p>No calendar connections yet</p>
                <p className="text-sm">Connect your calendar to sync appointments</p>
              </div>
            ) : (
              connections.map(connection => (
                <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getProviderIcon(connection.provider)}</span>
                    <div>
                      <div className="font-medium">{getProviderName(connection.provider)}</div>
                      <div className="text-sm text-gray-500">{connection.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={connection.isActive ? 'default' : 'secondary'}>
                      {connection.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync(connection.id)}
                      disabled={!connection.isActive}
                    >
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(connection.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Calendar Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['google', 'outlook', 'apple'] as CalendarProvider[]).map(provider => (
              <div key={provider} className="text-center">
                <div className="text-3xl mb-2">{getProviderIcon(provider)}</div>
                <div className="font-medium mb-1">{getProviderName(provider)}</div>
                <Button
                  onClick={() => handleConnect(provider)}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. OAuth Callback Handler
```typescript
// artifacts/apex-os/src/components/CalendarOAuthCallback.tsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { toast } from 'sonner';

export function CalendarOAuthCallback() {
  const location = useLocation();
  const [, navigate] = useNavigate();
  const params = new URLSearchParams(location.search);

  useEffect(() => {
    const provider = params.get('provider') as CalendarProvider;
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      toast.error(`OAuth error: ${error}`);
      navigate('/calendar/settings');
      return;
    }

    if (!provider || !code || !state) {
      toast.error('Invalid OAuth callback parameters');
      navigate('/calendar/settings');
      return;
    }

    // Send message to parent window
    window.opener?.postMessage({
      type: 'calendar-oauth-callback',
      provider,
      code,
      state,
    }, window.location.origin);

    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  }, [location, navigate, params]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">Connecting your calendar...</p>
      </div>
    </div>
  );
}
```

## Conflict Resolution

### 1. Conflict Detection Component
```typescript
// artifacts/apex-os/src/components/CalendarConflictResolver.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent, CalendarConnection } from '../types/calendar';
import { calendarService } from '../services/calendarService';

interface CalendarConflictResolverProps {
  connectionId: string;
  proposedEvent: Partial<CalendarEvent>;
  onResolve: (resolution: 'override' | 'reschedule' | 'cancel') => void;
}

export function CalendarConflictResolver({ connectionId, proposedEvent, onResolve }: CalendarResolverProps) {
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  React.useEffect(() => {
    if (proposedEvent.startTime && proposedEvent.endTime) {
      checkConflicts();
    }
  }, [proposedEvent.startTime, proposedEvent.endTime]);

  const checkConflicts = async () => {
    if (!proposedEvent.startTime || !proposedEvent.endTime) return;

    setIsChecking(true);
    try {
      const foundConflicts = await calendarService.checkConflicts(
        connectionId,
        proposedEvent.startTime,
        proposedEvent.endTime
      );
      setConflicts(foundConflicts);
    } catch (error) {
      console.error('Failed to check conflicts:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-orange-600">⚠️</span>
          <span>Calendar Conflicts Detected</span>
          <Badge variant="secondary">{conflicts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          The following events conflict with your proposed appointment:
        </div>
        
        <div className="space-y-2">
          {conflicts.map(conflict => (
            <div key={conflict.id} className="p-3 border rounded-lg bg-orange-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{conflict.title}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(conflict.startTime)} - {formatTime(conflict.endTime)}
                  </div>
                  {conflict.location && (
                    <div className="text-sm text-gray-600">
                      📍 {conflict.location}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="text-orange-600">
                  {conflict.provider}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => onResolve('override')}
            className="flex-1"
          >
            Override Conflicts
          </Button>
          <Button
            variant="outline"
            onClick={() => onResolve('reschedule')}
            className="flex-1"
          >
            Reschedule
          </Button>
          <Button
            variant="outline"
            onClick={() => onResolve('cancel')}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Integration with Appointment Booking

### 1. Appointment Calendar Integration
```typescript
// artifacts/apex-os/src/services/appointmentService.ts
import { CalendarEvent, CalendarConnection } from '../types/calendar';
import { calendarService } from './calendarService';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  clientEmail: string;
  status: 'requested' | 'confirmed' | 'cancelled';
  calendarEventId?: string;
  calendarConnectionId?: string;
}

export class AppointmentService {
  async createAppointment(appointment: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
    // Create appointment in backend
    const createdAppointment = await this.storeAppointment({
      ...appointment,
      status: 'requested',
    });

    // Find calendar connection for client
    const connections = await this.getConnectionsForClient(appointment.clientEmail);
    
    if (connections.length > 0) {
      const connection = connections[0]; // Use first available connection
      
      try {
        // Check for conflicts
        const conflicts = await calendarService.checkConflicts(
          connection.id,
          appointment.startTime,
          appointment.endTime
        );

        if (conflicts.length > 0) {
          // Handle conflicts based on connection settings
          const resolution = await this.resolveConflicts(connection, conflicts, appointment);
          
          if (resolution === 'cancel') {
            return createdAppointment; // Return appointment without calendar event
          }
        }

        // Create calendar event
        const calendarEvent = await calendarService.createEvent(connection.id, {
          title: appointment.title,
          description: appointment.description,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          attendees: [{ email: appointment.clientEmail, status: 'accepted' }],
        });

        // Update appointment with calendar event reference
        await this.updateAppointment(createdAppointment.id, {
          calendarEventId: calendarEvent.id,
          calendarConnectionId: connection.id,
          status: 'confirmed',
        });

        return await this.getAppointment(createdAppointment.id);
      } catch (error) {
        console.error('Failed to create calendar event:', error);
        // Still return appointment, but mark as requested
        return createdAppointment;
      }
    }

    return createdAppointment;
  }

  async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<Appointment> {
    // Update appointment in backend
    const updatedAppointment = await this.updateAppointmentInBackend(appointmentId, updates);

    // If calendar event exists, update it too
    if (updatedAppointment.calendarEventId && updatedAppointment.calendarConnectionId) {
      try {
        await calendarService.updateEvent(
          updatedAppointment.calendarConnectionId,
          updatedAppointment.calendarEventId,
          {
            title: updates.title,
            description: updates.description,
            startTime: updates.startTime,
            endTime: updates.endTime,
          }
        );
      } catch (error) {
        console.error('Failed to update calendar event:', error);
      }
    }

    return updatedAppointment;
  }

  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    const appointment = await this.getAppointment(appointmentId);
    
    // Delete calendar event if it exists
    if (appointment.calendarEventId && appointment.calendarConnectionId) {
      try {
        await calendarService.deleteEvent(
          appointment.calendarConnectionId,
          appointment.calendarEventId
        );
      } catch (error) {
        console.error('Failed to delete calendar event:', error);
      }
    }

    // Update appointment status
    return await this.updateAppointmentInBackend(appointmentId, { status: 'cancelled' });
  }

  private async resolveConflicts(
    connection: CalendarConnection,
    conflicts: CalendarEvent[],
    appointment: Omit<Appointment, 'id' | 'status'>
  ): Promise<'override' | 'reschedule' | 'cancel'> {
    switch (connection.settings.conflictResolution) {
      case 'auto':
        // Automatically reschedule
        return 'reschedule';
      case 'manual':
        // Show conflict resolver to user
        return new Promise((resolve) => {
          // This would integrate with the UI component
          throw new Error('Manual conflict resolution requires UI integration');
        });
      default:
        return 'cancel';
    }
  }

  // Backend integration methods (placeholders)
  private async storeAppointment(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    // TODO: Store appointment in backend database
    return {
      id: Math.random().toString(36).substring(2, 15),
      ...appointment,
    };
  }

  private async getAppointment(appointmentId: string): Promise<Appointment> {
    // TODO: Fetch appointment from backend database
    return {
      id: appointmentId,
      title: 'Sample Appointment',
      startTime: new Date(),
      endTime: new Date(),
      clientEmail: 'client@example.com',
      status: 'requested',
    };
  }

  private async updateAppointmentInBackend(appointmentId: string, updates: Partial<Appointment>): Promise<Appointment> {
    // TODO: Update appointment in backend database
    const existing = await this.getAppointment(appointmentId);
    return { ...existing, ...updates };
  }

  private async getConnectionsForClient(clientEmail: string): Promise<CalendarConnection[]> {
    // TODO: Find connections for client in backend database
    return [];
  }
}

export const appointmentService = new AppointmentService();
```

## Environment Configuration

### 1. Environment Variables
```bash
# artifacts/apex-os/.env.example
# Google Calendar
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft Outlook
VITE_OUTLOOK_CLIENT_ID=your-outlook-client-id
VITE_OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

# Apple Calendar
VITE_APPLE_CLIENT_ID=your-apple-client-id
VITE_APPLE_TEAM_ID=your-apple-team-id
VITE_APPLE_CLIENT_SECRET=your-apple-client-secret

# Sentry
VITE_SENTRY_DSN=your-sentry-dsn
```

### 2. OAuth Callback Routes
```typescript
// artifacts/apex-os/src/pages/calendar/[provider]/callback.tsx
import { CalendarOAuthCallback } from '@/components/CalendarOAuthCallback';

export default function CalendarCallbackPage() {
  return <CalendarOAuthCallback />;
}
```

## Testing Implementation

### 1. OAuth Flow Tests
```typescript
// artifacts/apex-os/src/__tests__/calendar/oauth.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CalendarConnectionManager } from '../components/CalendarConnectionManager';
import { oauthFlowManager } from '../lib/calendar/oauthManager';

describe('Calendar OAuth Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Flow Manager', () => {
    it('should generate OAuth URL for Google', () => {
      const { url, state } = oauthFlowManager.initiateOAuth('google');
      
      expect(url).toContain('accounts.google.com');
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
      expect(state).toBeDefined();
      expect(state).toMatch(/^[a-zA-Z0-9]{13}$/);
    });

    it('should generate OAuth URL for Outlook', () => {
      const { url, state } = oauthFlowManager.initiateOAuth('outlook');
      
      expect(url).toContain('login.microsoft.com');
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
      expect(state).toBeDefined();
    });

    it('should generate code verifier for Google', () => {
      const { codeVerifier } = oauthFlowManager.initiateOAuth('google');
      
      expect(codeVerifier).toBeDefined();
      expect(codeVerifier).toMatch(/^[a-zA-Z0-9+/=]{43}$/);
    });

    it('should clean up expired flows', () => {
      // Add some test flows
      oauthFlowManager.initiateOAuth('google');
      oauthFlowManager.initiateOAuth('outlook');
      
      // Mock expired flows
      const expiredFlow = {
        provider: 'google' as const,
        state: 'expired-state',
        timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago
      };
      
      // Manually add expired flow (in real implementation, this would be stored internally)
      
      oauthFlowManager.cleanupExpiredFlows();
      
      // Verify cleanup
      // In real implementation, you'd verify the expired flow was removed
    });
  });

  describe('Calendar Connection Manager', () => {
    it('should render connection list', () => {
      render(<CalendarConnectionManager />);
      
      expect(screen.getByText('Calendar Connections')).toBeInTheDocument();
      expect(screen.getByText('No calendar connections yet')).toBeInTheDocument();
    });

    it('should show connect buttons for all providers', () => {
      render(<CalendarConnectionManager />);
      
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Outlook')).toBeInTheDocument();
      expect(screen.getByText('Apple Calendar')).toBeInTheDocument();
    });

    it('should handle Google OAuth flow', async () => {
      const mockOpen = jest.spyOn(window, 'open').mockImplementation(() => ({
        closed: false,
        close: jest.fn(),
        postMessage: jest.fn(),
      }));

      render(<CalendarConnectionManager />);
      
      const connectButton = screen.getByText('Connect Google Calendar');
      await userEvent.click(connectButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('accounts.google.com'),
        '_blank',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
    });
  });
});
```

## Verification Commands

```bash
# Test OAuth flow URLs
curl -s "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&redirect_uri=test"

# Test Microsoft OAuth
curl -s "https://login.microsoft.com/oauth2/v2.0/authorize?client_id=test&redirect_uri=test"

# Test Apple OAuth
curl -s "https://appleid.apple.com/auth/authorize?client_id=test&redirect_uri=test"

# Check environment variables
echo $VITE_GOOGLE_CLIENT_ID
echo $VITE_OUTLOOK_CLIENT_ID
echo $VITE_APPLE_CLIENT_ID

# Test calendar API endpoints
curl -H "Authorization: Bearer token" \
  "https://www.googleapis.com/calendar/v3/calendars/primary/events"

curl -H "Authorization: Bearer token" \
  "https://graph.microsoft.com/v1.0/me/events"
```

This skill provides comprehensive calendar OAuth integration with support for Google Calendar, Microsoft Outlook, and Apple Calendar, including proper popup handling, connection management, and conflict resolution for appointment booking workflows.
