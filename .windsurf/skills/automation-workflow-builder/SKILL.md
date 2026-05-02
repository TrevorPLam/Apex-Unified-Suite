---
name: automation-workflow-builder
description: Implement a visual workflow automation system with drag-and-drop node editor, trigger-based execution, and integration with external services.
---

# Automation Workflow Builder Skill

## Overview
This skill guides the implementation of a comprehensive workflow automation system with a visual node-based editor, trigger mechanisms, and integration capabilities for the Apex Unified Suite.

## Architecture Components

### 1. Frontend Visual Editor
- React-based node editor with drag-and-drop
- Real-time workflow validation
- Visual node library
- Connection management
- Workflow execution preview

### 2. Backend Engine
- Workflow execution engine
- Trigger management
- Action processors
- State management
- Error handling and retry logic

### 3. Database Schema
- Workflow definitions
- Execution history
- Node configurations
- Trigger schedules
- Integration credentials

## Implementation Steps

### 1. Frontend Visual Editor

#### Install Dependencies
```bash
pnpm --filter @workspace/apex-os add reactflow @types/reactflow react-beautiful-dnd @types/react-beautiful-dnd
```

#### Create Workflow Editor Component
```typescript
// artifacts/apex-os/src/components/workflows/WorkflowEditor.tsx
import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import TransformNode from './nodes/TransformNode';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  transform: TransformNode,
};

interface WorkflowEditorProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onWorkflowChange?: (nodes: Node[], edges: Edge[]) => void;
}

export function WorkflowEditor({ 
  initialNodes = [], 
  initialEdges = [],
  onWorkflowChange 
}: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeChange = useCallback((changes: any) => {
    onNodesChange(changes);
    onWorkflowChange?.(nodes, edges);
  }, [nodes, edges, onNodesChange, onWorkflowChange]);

  const onEdgeChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    onWorkflowChange?.(nodes, edges);
  }, [nodes, edges, onEdgesChange, onWorkflowChange]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodeChange}
        onEdgesChange={onEdgeChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

#### Create Node Components
```typescript
// artifacts/apex-os/src/components/workflows/nodes/TriggerNode.tsx
import { Handle, Position } from 'reactflow';
import { Clock, Webhook, Mail } from 'lucide-react';

interface TriggerNodeProps {
  data: {
    label: string;
    type: 'schedule' | 'webhook' | 'event';
    config: Record<string, any>;
  };
}

export function TriggerNode({ data }: TriggerNodeProps) {
  const getIcon = () => {
    switch (data.type) {
      case 'schedule': return <Clock className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      case 'event': return <Mail className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-blue-500 min-w-[200px]">
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center space-x-2">
        {getIcon()}
        <div>
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.type}</div>
        </div>
      </div>
    </div>
  );
}

// artifacts/apex-os/src/components/workflows/nodes/ActionNode.tsx
import { Handle, Position } from 'reactflow';
import { Database, Send, FileText } from 'lucide-react';

interface ActionNodeProps {
  data: {
    label: string;
    type: 'api_call' | 'database' | 'email' | 'webhook';
    config: Record<string, any>;
  };
}

export function ActionNode({ data }: ActionNodeProps) {
  const getIcon = () => {
    switch (data.type) {
      case 'database': return <Database className="w-4 h-4" />;
      case 'email': return <Send className="w-4 h-4" />;
      case 'webhook': return <FileText className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className="px-4 py-3 shadow-lg rounded-lg bg-white border-2 border-green-500 min-w-[200px]">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <div>
            <div className="font-semibold text-sm">{data.label}</div>
            <div className="text-xs text-gray-500 capitalize">{data.type}</div>
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
```

#### Create Node Library
```typescript
// artifacts/apex-os/src/components/workflows/NodeLibrary.tsx
import { Clock, Webhook, Database, Send, FileText, GitBranch } from 'lucide-react';

interface NodeTemplate {
  type: string;
  label: string;
  icon: React.ReactNode;
  category: 'trigger' | 'action' | 'logic';
  defaultConfig: Record<string, any>;
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'schedule',
    label: 'Scheduled Trigger',
    icon: <Clock className="w-4 h-4" />,
    category: 'trigger',
    defaultConfig: { schedule: '0 9 * * 1', timezone: 'UTC' },
  },
  {
    type: 'webhook',
    label: 'Webhook Trigger',
    icon: <Webhook className="w-4 h-4" />,
    category: 'trigger',
    defaultConfig: { endpoint: '/webhook', method: 'POST' },
  },
  {
    type: 'api_call',
    label: 'API Call',
    icon: <Send className="w-4 h-4" />,
    category: 'action',
    defaultConfig: { url: '', method: 'GET', headers: {} },
  },
  {
    type: 'database_query',
    label: 'Database Query',
    icon: <Database className="w-4 h-4" />,
    category: 'action',
    defaultConfig: { query: '', parameters: {} },
  },
  {
    type: 'send_email',
    label: 'Send Email',
    icon: <Send className="w-4 h-4" />,
    category: 'action',
    defaultConfig: { to: '', subject: '', template: '' },
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: <GitBranch className="w-4 h-4" />,
    category: 'logic',
    defaultConfig: { condition: '', truePath: '', falsePath: '' },
  },
];

interface NodeLibraryProps {
  onNodeDragStart?: (nodeType: string, config: Record<string, any>) => void;
}

export function NodeLibrary({ onNodeDragStart }: NodeLibraryProps) {
  const categories = ['trigger', 'action', 'logic'] as const;

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Node Library</h3>
      
      {categories.map((category) => (
        <div key={category} className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
            {category}s
          </h4>
          <div className="space-y-2">
            {nodeTemplates
              .filter((template) => template.category === category)
              .map((template) => (
                <div
                  key={template.type}
                  className="bg-white p-3 rounded-lg border border-gray-200 cursor-move hover:border-blue-300 transition-colors"
                  draggable
                  onDragStart={() => onNodeDragStart?.(template.type, template.defaultConfig)}
                >
                  <div className="flex items-center space-x-2">
                    {template.icon}
                    <span className="text-sm font-medium">{template.label}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2. Backend Workflow Engine

#### Create Workflow Service
```typescript
// artifacts/api-server/src/services/workflow.service.ts
import { Result, ok, err } from 'neverthrow';
import { DomainError } from '@workspace/shared/src/errors/domain-error';
import { Workflow, WorkflowExecution, NodeExecution } from '@workspace/db/src/schema';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: WorkflowTrigger[];
  isActive: boolean;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'webhook' | 'event';
  config: Record<string, any>;
  nodeId: string;
}

export class WorkflowService {
  async createWorkflow(definition: WorkflowDefinition): Promise<Result<Workflow, DomainError>> {
    try {
      // Validate workflow structure
      const validation = this.validateWorkflow(definition);
      if (validation.isErr()) {
        return validation;
      }

      // Save workflow to database
      const workflow = await this.saveWorkflow(definition);
      
      // Register triggers
      await this.registerTriggers(workflow.id, definition.triggers);

      return ok(workflow);
    } catch (error) {
      return err(new DomainError('WORKFLOW_ERROR', 'Failed to create workflow'));
    }
  }

  async executeWorkflow(workflowId: string, triggerData?: any): Promise<Result<WorkflowExecution, DomainError>> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        return err(new DomainError('WORKFLOW_NOT_FOUND', 'Workflow not found'));
      }

      const execution = await this.createExecution(workflowId, triggerData);
      
      // Execute workflow nodes in order
      await this.executeNodes(workflow, execution);

      return ok(execution);
    } catch (error) {
      return err(new DomainError('WORKFLOW_EXECUTION_ERROR', 'Failed to execute workflow'));
    }
  }

  private validateWorkflow(definition: WorkflowDefinition): Result<void, DomainError> {
    // Check for required trigger nodes
    const triggerNodes = definition.nodes.filter(node => 
      node.type.startsWith('trigger_')
    );
    
    if (triggerNodes.length === 0) {
      return err(new DomainError('INVALID_WORKFLOW', 'Workflow must have at least one trigger'));
    }

    // Validate node connections
    const nodeIds = new Set(definition.nodes.map(node => node.id));
    for (const edge of definition.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        return err(new DomainError('INVALID_WORKFLOW', 'Invalid edge connection'));
      }
    }

    // Check for circular dependencies
    if (this.hasCircularDependency(definition.nodes, definition.edges)) {
      return err(new DomainError('INVALID_WORKFLOW', 'Workflow contains circular dependencies'));
    }

    return ok(undefined);
  }

  private async executeNodes(workflow: Workflow, execution: WorkflowExecution): Promise<void> {
    const executionOrder = this.getExecutionOrder(workflow.nodes, workflow.edges);
    const context: Record<string, any> = { triggerData: execution.triggerData };

    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      const nodeExecution = await this.executeNode(node, context);
      
      // Update context with node output
      context[nodeId] = nodeExecution.output;
      
      // Save node execution result
      await this.saveNodeExecution(execution.id, nodeId, nodeExecution);
    }
  }

  private async executeNode(node: WorkflowNode, context: Record<string, any>): Promise<NodeExecution> {
    const startTime = new Date();
    
    try {
      let output: any;

      switch (node.type) {
        case 'trigger_schedule':
          output = await this.executeScheduleTrigger(node.data, context);
          break;
        case 'trigger_webhook':
          output = await this.executeWebhookTrigger(node.data, context);
          break;
        case 'action_api_call':
          output = await this.executeApiCall(node.data, context);
          break;
        case 'action_database_query':
          output = await this.executeDatabaseQuery(node.data, context);
          break;
        case 'action_send_email':
          output = await this.executeSendEmail(node.data, context);
          break;
        case 'condition':
          output = await this.executeCondition(node.data, context);
          break;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      return {
        nodeId: node.id,
        status: 'completed',
        input: context,
        output,
        startTime,
        endTime: new Date(),
        error: null,
      };
    } catch (error) {
      return {
        nodeId: node.id,
        status: 'failed',
        input: context,
        output: null,
        startTime,
        endTime: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeApiCall(config: Record<string, any>, context: Record<string, any>): Promise<any> {
    const { url, method, headers, body } = config;
    
    // Process template variables in URL and body
    const processedUrl = this.processTemplate(url, context);
    const processedBody = body ? this.processTemplate(body, context) : undefined;

    const response = await fetch(processedUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: processedBody ? JSON.stringify(processedBody) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async executeDatabaseQuery(config: Record<string, any>, context: Record<string, any>): Promise<any> {
    const { query, parameters } = config;
    
    // Process template variables in query and parameters
    const processedQuery = this.processTemplate(query, context);
    const processedParams = this.processTemplate(parameters, context);

    // Execute database query using your database service
    // This would integrate with your existing database layer
    return { query: processedQuery, parameters: processedParams };
  }

  private async executeSendEmail(config: Record<string, any>, context: Record<string, any>): Promise<any> {
    const { to, subject, template, variables } = config;
    
    // Process template variables
    const processedTo = this.processTemplate(to, context);
    const processedSubject = this.processTemplate(subject, context);
    const processedTemplate = this.processTemplate(template, context);
    const processedVariables = this.processTemplate(variables, context);

    // Send email using your email service
    return {
      to: processedTo,
      subject: processedSubject,
      template: processedTemplate,
      variables: processedVariables,
      sent: true,
    };
  }

  private processTemplate(template: any, context: Record<string, any>): any {
    if (typeof template === 'string') {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = this.getNestedValue(context, path.trim());
        return value !== undefined ? String(value) : match;
      });
    } else if (typeof template === 'object' && template !== null) {
      const processed: any = {};
      for (const [key, value] of Object.entries(template)) {
        processed[key] = this.processTemplate(value, context);
      }
      return processed;
    }
    return template;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private getExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    // Topological sort to determine execution order
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    // Initialize in-degree and adjacency list
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });

    edges.forEach(edge => {
      adjList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // Kahn's algorithm for topological sort
    const queue: string[] = [];
    const result: string[] = [];

    // Find nodes with no incoming edges
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjList.get(current) || [];
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  }

  private hasCircularDependency(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
    // Use DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = edges
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target);

      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    return nodes.some(node => hasCycle(node.id));
  }
}
```

#### Create Workflow Routes
```typescript
// artifacts/api-server/src/routes/workflows.ts
import { Router } from 'express';
import { WorkflowService } from '../services/workflow.service';
import { validateRequest } from '../middleware/validation';

const router = Router();
const workflowService = new WorkflowService();

router.post('/', async (req, res, next) => {
  const result = await workflowService.createWorkflow(req.body);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

router.post('/:id/execute', async (req, res, next) => {
  const { id } = req.params;
  const triggerData = req.body;
  
  const result = await workflowService.executeWorkflow(id, triggerData);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

router.get('/', async (req, res) => {
  // List workflows
  const workflows = await workflowService.listWorkflows();
  res.json(workflows);
});

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const workflow = await workflowService.getWorkflow(id);
  
  if (!workflow) {
    return next(new DomainError('WORKFLOW_NOT_FOUND', 'Workflow not found'));
  }
  
  res.json(workflow);
});

export default router;
```

### 3. Database Schema

#### Add Workflow Tables
```sql
-- Add to your Drizzle schema
export const workflows = pgTable('workflows', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  definition: json('definition').notNull(),
  isActive: boolean('is_active').default(true),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workflowExecutions = pgTable('workflow_executions', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflows.id),
  status: text('status').notNull(), // running, completed, failed
  triggerData: json('trigger_data'),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  error: text('error'),
});

export const workflowNodeExecutions = pgTable('workflow_node_executions', {
  id: serial('id').primaryKey(),
  executionId: integer('execution_id').references(() => workflowExecutions.id),
  nodeId: text('node_id').notNull(),
  status: text('status').notNull(),
  input: json('input'),
  output: json('output'),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  error: text('error'),
});

export const workflowTriggers = pgTable('workflow_triggers', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => workflows.id),
  type: text('type').notNull(), // schedule, webhook, event
  config: json('config').notNull(),
  isActive: boolean('is_active').default(true),
  lastExecuted: timestamp('last_executed'),
  nextExecution: timestamp('next_execution'),
});
```

### 4. Integration Examples

#### CRM Integration
```typescript
// Example: Automated lead follow-up workflow
const leadFollowUpWorkflow: WorkflowDefinition = {
  id: 'lead-followup',
  name: 'Lead Follow-up Automation',
  description: 'Automatically follow up with new leads',
  nodes: [
    {
      id: 'trigger',
      type: 'trigger_event',
      position: { x: 100, y: 100 },
      data: { event: 'lead.created' },
    },
    {
      id: 'check_score',
      type: 'condition',
      position: { x: 300, y: 100 },
      data: { condition: '{{trigger.lead.score}} > 80' },
    },
    {
      id: 'send_email',
      type: 'action_send_email',
      position: { x: 500, y: 50 },
      data: {
        to: '{{trigger.lead.email}}',
        template: 'high-score-lead',
        subject: 'Welcome to our premium service!',
      },
    },
    {
      id: 'assign_agent',
      type: 'action_api_call',
      position: { x: 500, y: 150 },
      data: {
        url: '/api/crm/leads/{{trigger.lead.id}}/assign',
        method: 'POST',
        body: { agentId: 'auto-assign' },
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger', target: 'check_score' },
    { id: 'e2', source: 'check_score', target: 'send_email', sourceHandle: 'true' },
    { id: 'e3', source: 'check_score', target: 'assign_agent', sourceHandle: 'false' },
  ],
  triggers: [
    {
      id: 'lead_trigger',
      type: 'event',
      config: { eventType: 'lead.created' },
      nodeId: 'trigger',
    },
  ],
  isActive: true,
};
```

## Testing

### Unit Tests
```typescript
describe('WorkflowService', () => {
  it('should validate workflow structure', async () => {
    const invalidWorkflow = {
      id: 'invalid',
      name: 'Invalid Workflow',
      nodes: [],
      edges: [],
      triggers: [],
      isActive: true,
    };

    const result = await workflowService.createWorkflow(invalidWorkflow);
    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe('INVALID_WORKFLOW');
  });

  it('should execute simple workflow', async () => {
    const workflow = createTestWorkflow();
    const result = await workflowService.executeWorkflow(workflow.id);
    expect(result.isOk()).toBe(true);
    expect(result.value.status).toBe('completed');
  });
});
```

### Integration Tests
```typescript
describe('Workflow Integration', () => {
  it('should handle webhook trigger', async () => {
    const response = await request(app)
      .post('/webhooks/automation')
      .send({ event: 'lead.created', data: { email: 'test@example.com' } })
      .expect(200);

    // Verify workflow was triggered and executed
    const executions = await WorkflowExecution.findAll();
    expect(executions).toHaveLength(1);
  });
});
```

## Performance Considerations

### Execution Limits
- Maximum workflow execution time: 30 minutes
- Maximum nodes per workflow: 100
- Maximum concurrent executions: 10 per workflow

### Caching
- Cache workflow definitions in memory
- Cache node execution results
- Cache template processing results

### Monitoring
- Track execution success rate
- Monitor execution duration
- Alert on failed executions
- Track resource usage

## Security Considerations

### Input Validation
- Validate all node configurations
- Sanitize template inputs
- Rate limit webhook endpoints

### Access Control
- Role-based workflow access
- Secure credential storage
- Audit trail for executions

### Data Privacy
- Encrypt sensitive workflow data
- Mask sensitive data in logs
- GDPR compliance for personal data

## Deployment Checklist

- [ ] Set up workflow execution queue
- [ ] Configure webhook endpoints
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting
- [ ] Set up backup and recovery
- [ ] Test with sample workflows
- [ ] Document node types and integrations
- [ ] Train users on workflow creation

## Common Issues

### Performance Issues
- Optimize database queries
- Implement proper indexing
- Use connection pooling

### Execution Failures
- Check node configurations
- Verify API endpoints
- Review error logs

### Integration Issues
- Test external API connections
- Verify authentication
- Check data format compatibility
