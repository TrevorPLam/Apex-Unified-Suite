---
trigger: model_decision
description: Portal messages are scoped by portal_client_id; firm users can read client messages but never vice-versa unless message is addressed to the client.
---

# Portal Message Access Rule

## Purpose

Enforce strict access control for portal messages where firm users can read all client messages, but clients can only read messages specifically addressed to them. This maintains proper communication boundaries while allowing firm oversight.

## Core Access Requirements

### Message Scoping Rules

**Message access by user type:**

1. **Firm Users**: Can read all messages (both sent and received)
2. **Portal Clients**: Can only read messages where `portal_client_id` matches their ID
3. **Message Direction**: Access depends on message direction and addressing

### Direction-Based Access

**Message direction determines access:**

- **firm_to_client**: Client can read + Firm users can read
- **client_to_firm**: Only firm users can read (unless addressed to specific client)
- **general_announcement**: Both firm users and all clients can read

## Implementation Requirements

### Database Schema Support

```sql
-- Portal messages table with direction and addressing
CREATE TABLE portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  portal_client_id UUID NOT NULL REFERENCES portal_clients(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'general' CHECK (message_type IN ('general', 'document_share', 'appointment_reminder', 'invoice_notification')),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('firm_to_client', 'client_to_firm')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  reply_to_id UUID REFERENCES portal_messages(id), -- For message threads
  attachments JSONB, -- Array of attachment metadata
  addressed_to_client_id UUID REFERENCES portal_clients(id), -- For specific client addressing
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient message queries
CREATE INDEX idx_portal_messages_client ON portal_messages(portal_client_id);
CREATE INDEX idx_portal_messages_tenant ON portal_messages(tenant_id);
CREATE INDEX idx_portal_messages_direction ON portal_messages(direction);
CREATE INDEX idx_portal_messages_unread ON portal_messages(portal_client_id, is_read);
CREATE INDEX idx_portal_messages_thread ON portal_messages(reply_to_id);
CREATE INDEX idx_portal_messages_addressed ON portal_messages(addressed_to_client_id);
```

### Service Layer Implementation

```typescript
// src/services/PortalMessageService.ts
export class PortalMessageService {
  constructor(private db: Database) {}

  async getClientMessages(
    clientContext: ClientContext,
    options: MessageOptions = {}
  ): Promise<PortalMessage[]> {
    let query = this.db
      .select({
        id: portal_messages.id,
        subject: portal_messages.subject,
        content: portal_messages.content,
        messageType: portal_messages.message_type,
        direction: portal_messages.direction,
        isRead: portal_messages.is_read,
        readAt: portal_messages.read_at,
        sentAt: portal_messages.sent_at,
        replyToId: portal_messages.reply_to_id,
        attachments: portal_messages.attachments,
        createdBy: portal_messages.created_by,
        addressedToClientId: portal_messages.addressed_to_client_id
      })
      .from(portal_messages)
      .where(and(
        eq(portal_messages.portal_client_id, clientContext.clientId),
        eq(portal_messages.tenant_id, clientContext.tenantId)
      ));

    // Apply filters
    if (options.unreadOnly) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.is_read, false)
      ));
    }

    if (options.messageType) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.message_type, options.messageType)
      ));
    }

    // Apply client access rules
    query = query.where(
      sql`(
        (${portal_messages.direction} = 'firm_to_client') OR 
        (${portal_messages.direction} = 'client_to_firm' AND ${portal_messages.addressed_to_client_id} = ${clientContext.clientId}) OR
        (${portal_messages.direction} = 'client_to_firm' AND ${portal_messages.addressed_to_client_id} IS NULL)
      )`
    );

    return await query
      .orderBy(portal_messages.sent_at)
      .limit(options.limit || 50)
      .offset(options.offset || 0);
  }

  async getFirmMessages(
    tenantId: string,
    userId?: string,
    options: MessageOptions = {}
  ): Promise<PortalMessage[]> {
    let query = this.db
      .select({
        id: portal_messages.id,
        portalClientId: portal_messages.portal_client_id,
        subject: portal_messages.subject,
        content: portal_messages.content,
        messageType: portal_messages.message_type,
        direction: portal_messages.direction,
        isRead: portal_messages.is_read,
        readAt: portal_messages.read_at,
        sentAt: portal_messages.sent_at,
        replyToId: portal_messages.reply_to_id,
        attachments: portal_messages.attachments,
        addressedToClientId: portal_messages.addressed_to_client_id,
        createdBy: portal_messages.created_by,
        clientName: portal_clients.name
      })
      .from(portal_messages)
      .leftJoin(
        portal_clients,
        eq(portal_clients.id, portal_messages.portal_client_id)
      )
      .where(eq(portal_messages.tenant_id, tenantId));

    // Firm users can see all messages
    if (options.clientId) {
      // Filter by specific client
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.portal_client_id, options.clientId)
      ));
    }

    // Apply filters
    if (options.unreadOnly) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.is_read, false)
      ));
    }

    if (options.messageType) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.message_type, options.messageType)
      ));
    }

    return await query
      .orderBy(desc(portal_messages.sent_at))
      .limit(options.limit || 50)
      .offset(options.offset || 0);
  }

  async sendMessageToClient(
    tenantId: string,
    clientId: string,
    subject: string,
    content: string,
    messageType: string = 'general',
    createdBy: string,
    attachments?: any[],
    addressedToClientId?: string
  ): Promise<PortalMessage> {
    return await this.db.transaction(async (tx) => {
      const message = await tx.insert(portal_messages).values({
        tenantId,
        portalClientId: clientId,
        subject,
        content,
        messageType,
        direction: 'firm_to_client',
        attachments: attachments || [],
        addressedToClientId: addressedToClientId || clientId, // Default to client
        createdBy
      }).returning();

      // Emit domain event
      await this.emitEvent('PortalMessageSent', {
        messageId: message[0].id,
        clientId,
        direction: 'firm_to_client',
        messageType,
        createdBy
      });

      return message[0];
    });
  }

  async sendMessageFromClient(
    clientContext: ClientContext,
    subject: string,
    content: string,
    attachments?: any[]
  ): Promise<PortalMessage> {
    return await this.db.transaction(async (tx) => {
      const message = await tx.insert(portal_messages).values({
        tenantId: clientContext.tenantId,
        portalClientId: clientContext.clientId,
        subject,
        content,
        messageType: 'general',
        direction: 'client_to_firm',
        attachments: attachments || []
      }).returning();

      // Emit domain event
      await this.emitEvent('PortalMessageReceived', {
        messageId: message[0].id,
        clientId: clientContext.clientId,
        direction: 'client_to_firm'
      });

      return message[0];
    });
  }

  async markAsRead(
    messageIds: string[],
    clientContext: ClientContext
  ): Promise<void> {
    await this.db
      .update(portal_messages)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        inArray(portal_messages.id, messageIds),
        eq(portal_messages.portal_client_id, clientContext.clientId),
        eq(portal_messages.tenant_id, clientContext.tenantId),
        eq(portal_messages.is_read, false)
      ));
  }

  async getUnreadCounts(
    tenantId: string
  ): Promise<{ total: number; byClient: Array<{ clientId: string; clientName: string; count: number }> }> {
    const totalCount = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(portal_messages)
      .where(and(
        eq(portal_messages.tenant_id, tenantId),
        eq(portal_messages.is_read, false)
      ));

    const byClient = await this.db
      .select({
        clientId: portal_messages.portal_client_id,
        clientName: portal_clients.name,
        count: sql<number>`COUNT(*)`
      })
      .from(portal_messages)
      .leftJoin(
        portal_clients,
        eq(portal_clients.id, portal_messages.portal_client_id)
      )
      .where(and(
        eq(portal_messages.tenant_id, tenantId),
        eq(portal_messages.is_read, false)
      ))
      .groupBy(portal_messages.portal_client_id, portal_clients.name)
      .orderBy(sql`COUNT(*) DESC`);

    return {
      total: totalCount[0].count,
      byClient: byClient
    };
  }

  async getMessageThread(
    messageId: string,
    clientContext?: ClientContext,
    tenantId?: string
  ): Promise<PortalMessage[]> {
    let query = this.db
      .select({
        id: portal_messages.id,
        portalClientId: portal_messages.portal_client_id,
        subject: portal_messages.subject,
        content: portal_messages.content,
        messageType: portal_messages.message_type,
        direction: portal_messages.direction,
        isRead: portal_messages.is_read,
        readAt: portal_messages.read_at,
        sentAt: portal_messages.sent_at,
        replyToId: portal_messages.reply_to_id,
        attachments: portal_messages.attachments,
        createdBy: portal_messages.created_by,
        addressedToClientId: portal_messages.addressed_to_client_id,
        clientName: portal_clients.name
      })
      .from(portal_messages)
      .leftJoin(
        portal_clients,
        eq(portal_clients.id, portal_messages.portal_client_id)
      )
      .where(eq(portal_messages.id, messageId));

    // Apply client context filtering if provided
    if (clientContext) {
      query = query.where(and(
        query.getSQL().where,
        eq(portal_messages.tenant_id, clientContext.tenantId),
        sql`(
          (${portal_messages.direction} = 'firm_to_client') OR 
          (${portal_messages.direction} = 'client_to_firm' AND ${portal_messages.addressed_to_client_id} = ${clientContext.clientId}) OR
          (${portal_messages.direction} = 'client_to_firm' AND ${portal_messages.addressed_to_client_id} IS NULL)
        )`
      ));
    } else if (tenantId) {
      query = query.where(eq(portal_messages.tenant_id, tenantId));
    }

    // Get thread messages (including replies)
    const threadMessages = await query.orderBy(portal_messages.sent_at);

    // If we have a client context, filter thread messages for client access
    if (clientContext) {
      return threadMessages.filter(msg => {
        return (
          msg.direction === 'firm_to_client' ||
          (msg.direction === 'client_to_firm' && 
            (msg.addressedToClientId === clientContext.clientId || msg.addressedToClientId === null))
        );
      });
    }

    return threadMessages;
  }
}
```

### API Layer Implementation

```typescript
// src/routes/portal/messages.ts
router.get('/', async (req: PortalRequest, res, next) => {
  try {
    const messages = await portalMessageService.getClientMessages(
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      },
      {
        unreadOnly: req.query.unreadOnly === 'true',
        messageType: req.query.messageType as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      }
    );

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post('/', validateRequest(sendMessageSchema), async (req: PortalRequest, res, next) => {
  try {
    const { subject, content, attachments } = req.body;

    const message = await portalMessageService.sendMessageFromClient(
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      },
      subject,
      content,
      attachments
    );

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req: PortalRequest, res, next) => {
  try {
    const { messageIds } = req.body;
    
    await portalMessageService.markAsRead(
      Array.isArray(messageIds) ? messageIds : [req.params.id],
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
});

router.get('/thread/:messageId', async (req: PortalRequest, res, next) => {
  try {
    const thread = await portalMessageService.getMessageThread(
      req.params.messageId,
      {
        clientId: req.portalClient!.id,
        tenantId: req.portalClient!.tenantId
      }
    );

    res.json({ thread });
  } catch (error) {
    next(error);
  }
});

// Firm user routes (different auth middleware)
router.get('/firm/all', async (req, res, next) => {
  try {
    const messages = await portalMessageService.getFirmMessages(
      req.tenant.id,
      req.user?.id,
      {
        clientId: req.query.clientId as string,
        unreadOnly: req.query.unreadOnly === 'true',
        messageType: req.query.messageType as string,
        limit: parseInt(req.query.limit as string) || 50
      }
    );

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post('/firm/send', validateRequest(firmSendMessageSchema), async (req, res, next) => {
  try {
    const { clientId, subject, content, messageType, attachments, addressedToClientId } = req.body;

    const message = await portalMessageService.sendMessageToClient(
      req.tenant.id,
      clientId,
      subject,
      content,
      messageType,
      req.user.id,
      attachments,
      addressedToClientId
    );

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

router.get('/firm/unread-counts', async (req, res, next) => {
  try {
    const counts = await portalMessageService.getUnreadCounts(req.tenant.id);
    
    res.json(counts);
  } catch (error) {
    next(error);
  }
});
```

### Frontend Integration

```typescript
// React component for client portal messages
export const ClientMessageList: ReactFC = () => {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portal/messages');
      const data = await response.json();
      setMessages(data.messages);
      setUnreadCount(data.messages.filter(m => !m.isRead).length);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (subject: string, content: string) => {
    try {
      const response = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject, content })
      });

      if (response.ok) {
        await loadMessages(); // Refresh messages
        showSuccessMessage('Message sent successfully');
      }
    } catch (error) {
      showErrorMessage('Failed to send message');
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/portal/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messageIds: [messageId] })
      });

      await loadMessages(); // Refresh messages
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  return (
    <div className="portal-messages">
      <div className="messages-header">
        <h2>Messages</h2>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount} unread</span>
        )}
      </div>

      <div className="message-list">
        {messages.map(message => (
          <MessageCard
            key={message.id}
            message={message}
            onRead={() => handleMarkAsRead(message.id)}
          />
        ))}
      </div>

      <div className="message-composer">
        <MessageComposer onSend={handleSendMessage} />
      </div>
    </div>
  );
};

// Message card component
const MessageCard: React.FC<{
  message: PortalMessage;
  onRead: () => void;
}> = ({ message, onRead }) => {
  const isFromFirm = message.direction === 'firm_to_client';
  const isUnread = !message.isRead;

  return (
    <div className={`message-card ${isFromFirm ? 'from-firm' : 'from-client'} ${isUnread ? 'unread' : 'read'}`}>
      <div className="message-header">
        <span className="message-direction">
          {isFromFirm ? 'Firm' : 'You'}
        </span>
        <span className="message-time">
          {formatDateTime(message.sentAt)}
        </span>
        {isUnread && (
          <span className="unread-indicator">●</span>
        )}
      </div>

      <div className="message-content">
        <h4>{message.subject}</h4>
        <p>{message.content}</p>
      </div>

      {message.attachments && message.attachments.length > 0 && (
        <div className="message-attachments">
          {message.attachments.map((attachment, index) => (
            <AttachmentItem key={index} attachment={attachment} />
          ))}
        </div>
      )}

      <div className="message-actions">
        {isUnread && (
          <button onClick={() => onRead()} className="mark-read-btn">
            Mark as Read
          </button>
        )}
        {message.replyToId && (
          <button className="reply-btn">
            Reply
          </button>
        )}
      </div>
    </div>
  );
};
```

## Testing Requirements

### Unit Tests

**Test message access control:**

```typescript
describe('Portal Message Access', () => {
  test('should allow client to read their own messages', async () => {
    const clientContext = createMockClientContext();
    const service = new PortalMessageService(db);

    // Create messages for client
    await createMessage({ 
      direction: 'firm_to_client', 
      portalClientId: clientContext.clientId 
    });
    await createMessage({ 
      direction: 'client_to_firm', 
      portalClientId: clientContext.clientId 
    });

    const messages = await service.getClientMessages(clientContext);
    
    expect(messages).toHaveLength(2);
    expect(messages.every(m => 
      m.portalClientId === clientContext.clientId
    ));
  });

  test('should prevent client from reading other client messages', async () => {
    const clientA = createMockClientContext('client-a');
    const clientB = createMockClientContext('client-b');
    const service = new PortalMessageService(db);

    // Create message for client A
    await createMessage({ 
      direction: 'firm_to_client', 
      portalClientId: clientA.clientId 
    });

    // Client B tries to read messages
    const messages = await service.getClientMessages(clientB);
    
    expect(messages).toHaveLength(0);
  });

  test('should allow client to read addressed messages', async () => {
    const clientContext = createMockClientContext();
    const service = new PortalMessageService(db);

    // Create message addressed to specific client
    await createMessage({ 
      direction: 'client_to_firm', 
      portalClientId: clientContext.clientId,
      addressedToClientId: clientContext.clientId 
    });

    const messages = await service.getClientMessages(clientContext);
    
    expect(messages).toHaveLength(1);
    expect(messages[0].addressedToClientId).toBe(clientContext.clientId);
  });
});
```

### Integration Tests

**Test end-to-end message flow:**

1. **Message Creation**: Different message types and directions
2. **Access Control**: Proper permission enforcement
3. **Thread Management**: Reply and conversation flow
4. **Read Status**: Mark as read functionality

### Security Tests

**Test security scenarios:**

1. **Client Isolation**: Clients cannot access each other's messages
2. **Message Spoofing**: Direction and addressing validation
3. **Attachment Security**: Proper access control for attachments
4. **Content Filtering**: XSS prevention in message content

## Enforcement Checklist

- [ ] Client messages are scoped by portal_client_id
- [ ] Firm users can read all messages
- [ ] Clients can only read messages addressed to them
- [ ] Message direction determines access rights
- [ ] Database schema supports addressing and direction
- [ ] API endpoints enforce access rules consistently
- [ ] Frontend respects access control in UI
- [ ] Comprehensive test coverage for access scenarios
- [ ] Message threads maintain proper access control
- [ ] Unread count tracking works correctly
- [ ] Audit logging for message access events
- [ ] Error handling prevents unauthorized access
- [ ] Performance optimization for message queries
