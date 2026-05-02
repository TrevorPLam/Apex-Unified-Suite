---
name: pm-workspace-implementation
description: Implement comprehensive project management workspace with Kanban boards, Gantt charts, resource allocation, and team collaboration features.
---

# Project Management Workspace Implementation Skill

## Overview
This skill guides the implementation of a full-featured project management workspace with Kanban boards, Gantt charts, resource management, and team collaboration capabilities for the Apex Unified Suite.

## Architecture Components

### 1. Project Management Core
- Project and task management
- Team and resource allocation
- Timeline and milestone tracking
- Progress monitoring and reporting

### 2. Visual Planning Tools
- Interactive Kanban boards
- Gantt chart visualization
- Resource allocation charts
- Timeline views and calendars

### 3. Collaboration Features
- Real-time updates
- Comments and mentions
- File attachments
- Activity feeds

### 4. Analytics & Reporting
- Progress metrics
- Resource utilization
- Team performance
- Project health indicators

## Implementation Steps

### 1. Backend Implementation

#### Install Dependencies
```bash
pnpm --filter @workspace/api-server add dayjs @types/dayjs
pnpm --filter @workspace/apex-os add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-beautiful-dnd @types/react-beautiful-dnd recharts date-fns
```

#### Create Project Management Models
```typescript
// artifacts/api-server/src/models/project.model.ts
import { pgTable, text, integer, timestamp, boolean, json, uuid } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull(), // planning, active, on_hold, completed, cancelled
  priority: text('priority').notNull(), // low, medium, high, critical
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  budget: integer('budget'),
  currency: text('currency').default('USD'),
  projectManagerId: text('project_manager_id').notNull(),
  teamId: text('team_id').notNull(),
  tags: json('tags'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: text('created_by').notNull(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(), // todo, in_progress, review, done
  priority: text('priority').notNull(), // low, medium, high, critical
  assigneeId: text('assignee_id'),
  reporterId: text('reporter_id').notNull(),
  storyPoints: integer('story_points'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  startDate: timestamp('start_date'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  parentId: uuid('parent_id').references(() => tasks.id),
  position: integer('position'),
  tags: json('tags'),
  attachments: json('attachments'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  predecessorId: uuid('predecessor_id').references(() => tasks.id),
  successorId: uuid('successor_id').references(() => tasks.id),
  dependencyType: text('dependency_type').notNull(), // finish_to_start, start_to_start, finish_to_finish, start_to_finish
  lagDays: integer('lag_days').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  name: text('name').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date').notNull(),
  status: text('status').notNull(), // upcoming, completed, missed
  progress: integer('progress').default(0), // 0-100
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const projectMembers = pgTable('project_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id),
  userId: text('user_id').notNull(),
  role: text('role').notNull(), // project_manager, developer, designer, tester, analyst
  allocation: integer('allocation').default(100), // percentage
  hourlyRate: integer('hourly_rate'),
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id),
  userId: text('user_id').notNull(),
  description: text('description'),
  hours: integer('hours').notNull(),
  date: timestamp('date').notNull(),
  billable: boolean('billable').default(true),
  hourlyRate: integer('hourly_rate'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id),
  projectId: uuid('project_id').references(() => projects.id),
  userId: text('user_id').notNull(),
  content: text('content').notNull(),
  mentions: json('mentions'), // array of user IDs
  attachments: json('attachments'),
  parentId: uuid('parent_id').references(() => comments.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### Create Project Service
```typescript
// artifacts/api-server/src/services/project.service.ts
import { Result, ok, err } from 'neverthrow';
import { DomainError } from '@workspace/shared/src/errors/domain-error';
import { 
  projects, 
  tasks, 
  taskDependencies, 
  milestones, 
  projectMembers, 
  timeEntries,
  comments 
} from '../models/project.model';

export interface CreateProjectData {
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  currency?: string;
  projectManagerId: string;
  teamId: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  reporterId: string;
  storyPoints?: number;
  estimatedHours?: number;
  startDate?: Date;
  dueDate?: Date;
  parentId?: string;
  tags?: string[];
}

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalHours: number;
  completedHours: number;
  budgetUtilization: number;
  progressPercentage: number;
  teamVelocity: number;
  averageTaskDuration: number;
}

export class ProjectService {
  async createProject(data: CreateProjectData): Promise<Result<any, DomainError>> {
    try {
      // Validate project data
      const validation = this.validateProjectData(data);
      if (validation.isErr()) {
        return validation;
      }

      // Check if project manager exists and has appropriate permissions
      const managerCheck = await this.validateProjectManager(data.projectManagerId);
      if (managerCheck.isErr()) {
        return managerCheck;
      }

      // Create project
      const project = await this.saveProject(data);
      
      // Add project manager as member
      await this.addProjectMember(project.id, data.projectManagerId, 'project_manager', 100);

      return ok(project);
    } catch (error) {
      return err(new DomainError('PROJECT_ERROR', 'Failed to create project'));
    }
  }

  async updateProject(projectId: string, updates: Partial<CreateProjectData>): Promise<Result<any, DomainError>> {
    try {
      const existingProject = await this.getProject(projectId);
      if (!existingProject) {
        return err(new DomainError('PROJECT_NOT_FOUND', 'Project not found'));
      }

      const updatedProject = await this.updateProjectInDatabase(projectId, updates);
      return ok(updatedProject);
    } catch (error) {
      return err(new DomainError('PROJECT_ERROR', 'Failed to update project'));
    }
  }

  async createTask(data: CreateTaskData): Promise<Result<any, DomainError>> {
    try {
      // Validate task data
      const validation = this.validateTaskData(data);
      if (validation.isErr()) {
        return validation;
      }

      // Check if project exists and user has permissions
      const projectCheck = await this.validateProjectAccess(data.projectId, data.reporterId);
      if (projectCheck.isErr()) {
        return projectCheck;
      }

      // Calculate position if not provided
      const position = await this.calculateTaskPosition(data.projectId, data.status);

      // Create task
      const task = await this.saveTask({ ...data, position });

      // Create activity log
      await this.logActivity('task_created', data.projectId, data.reporterId, {
        taskId: task.id,
        taskTitle: task.title,
      });

      return ok(task);
    } catch (error) {
      return err(new DomainError('TASK_ERROR', 'Failed to create task'));
    }
  }

  async updateTaskStatus(taskId: string, status: string, userId: string): Promise<Result<any, DomainError>> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        return err(new DomainError('TASK_NOT_FOUND', 'Task not found'));
      }

      // Validate status transition
      const transitionCheck = this.validateStatusTransition(task.status, status);
      if (transitionCheck.isErr()) {
        return transitionCheck;
      }

      // Check user permissions
      const permissionCheck = await this.validateTaskAccess(taskId, userId);
      if (permissionCheck.isErr()) {
        return permissionCheck;
      }

      // Update task status
      const updatedTask = await this.updateTaskInDatabase(taskId, { 
        status,
        completedAt: status === 'done' ? new Date() : null,
      });

      // Update parent task status if all subtasks are complete
      if (task.parentId) {
        await this.updateParentTaskStatus(task.parentId);
      }

      // Create activity log
      await this.logActivity('task_status_updated', task.projectId, userId, {
        taskId,
        oldStatus: task.status,
        newStatus: status,
      });

      return ok(updatedTask);
    } catch (error) {
      return err(new DomainError('TASK_ERROR', 'Failed to update task status'));
    }
  }

  async getProjectMetrics(projectId: string): Promise<Result<ProjectMetrics, DomainError>> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        return err(new DomainError('PROJECT_NOT_FOUND', 'Project not found'));
      }

      // Get task statistics
      const taskStats = await this.getTaskStatistics(projectId);
      
      // Get time tracking data
      const timeStats = await this.getTimeStatistics(projectId);
      
      // Get budget information
      const budgetInfo = await this.getBudgetInformation(projectId);
      
      // Calculate team velocity
      const teamVelocity = await this.calculateTeamVelocity(projectId);

      const metrics: ProjectMetrics = {
        totalTasks: taskStats.total,
        completedTasks: taskStats.completed,
        inProgressTasks: taskStats.inProgress,
        overdueTasks: taskStats.overdue,
        totalHours: timeStats.total,
        completedHours: timeStats.completed,
        budgetUtilization: budgetInfo.utilization,
        progressPercentage: taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0,
        teamVelocity,
        averageTaskDuration: taskStats.averageDuration,
      };

      return ok(metrics);
    } catch (error) {
      return err(new DomainError('METRICS_ERROR', 'Failed to calculate project metrics'));
    }
  }

  async getKanbanBoard(projectId: string): Promise<Result<any, DomainError>> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        return err(new DomainError('PROJECT_NOT_FOUND', 'Project not found'));
      }

      const tasks = await this.getProjectTasks(projectId);
      
      // Group tasks by status
      const columns = {
        todo: tasks.filter(task => task.status === 'todo').sort((a, b) => a.position - b.position),
        in_progress: tasks.filter(task => task.status === 'in_progress').sort((a, b) => a.position - b.position),
        review: tasks.filter(task => task.status === 'review').sort((a, b) => a.position - b.position),
        done: tasks.filter(task => task.status === 'done').sort((a, b) => a.position - b.position),
      };

      return ok({
        project,
        columns,
        totalTasks: tasks.length,
      });
    } catch (error) {
      return err(new DomainError('BOARD_ERROR', 'Failed to get Kanban board'));
    }
  }

  async getGanttChart(projectId: string): Promise<Result<any, DomainError>> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        return err(new DomainError('PROJECT_NOT_FOUND', 'Project not found'));
      }

      const tasks = await this.getProjectTasks(projectId);
      const dependencies = await this.getTaskDependencies(projectId);
      const milestones = await this.getProjectMilestones(projectId);

      // Build Gantt chart data structure
      const ganttData = {
        project: {
          id: project.id,
          name: project.name,
          startDate: project.startDate,
          endDate: project.endDate,
        },
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          startDate: task.startDate,
          endDate: task.dueDate,
          progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0,
          assignee: task.assigneeId,
          dependencies: dependencies
            .filter(dep => dep.predecessorId === task.id)
            .map(dep => dep.successorId),
        })),
        milestones: milestones.map(milestone => ({
          id: milestone.id,
          name: milestone.name,
          date: milestone.dueDate,
          status: milestone.status,
          progress: milestone.progress,
        })),
      };

      return ok(ganttData);
    } catch (error) {
      return err(new DomainError('GANTT_ERROR', 'Failed to get Gantt chart'));
    }
  }

  async getResourceAllocation(projectId: string): Promise<Result<any, DomainError>> {
    try {
      const members = await this.getProjectMembers(projectId);
      const tasks = await this.getProjectTasks(projectId);
      const timeEntries = await this.getProjectTimeEntries(projectId);

      // Calculate allocation for each member
      const allocationData = members.map(member => {
        const memberTasks = tasks.filter(task => task.assigneeId === member.userId);
        const memberTimeEntries = timeEntries.filter(entry => entry.userId === member.userId);
        
        const totalAllocatedHours = memberTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        const totalActualHours = memberTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
        
        return {
          userId: member.userId,
          role: member.role,
          allocation: member.allocation,
          totalAllocatedHours,
          totalActualHours,
          utilization: totalAllocatedHours > 0 ? (totalActualHours / totalAllocatedHours) * 100 : 0,
          tasks: memberTasks.length,
          completedTasks: memberTasks.filter(task => task.status === 'done').length,
        };
      });

      return ok({
        members: allocationData,
        totalAllocatedHours: allocationData.reduce((sum, member) => sum + member.totalAllocatedHours, 0),
        totalActualHours: allocationData.reduce((sum, member) => sum + member.totalActualHours, 0),
      });
    } catch (error) {
      return err(new DomainError('ALLOCATION_ERROR', 'Failed to get resource allocation'));
    }
  }

  private validateProjectData(data: CreateProjectData): Result<void, DomainError> {
    if (!data.name || data.name.trim().length === 0) {
      return err(new DomainError('INVALID_PROJECT', 'Project name is required'));
    }

    if (!data.projectManagerId) {
      return err(new DomainError('INVALID_PROJECT', 'Project manager is required'));
    }

    if (!data.teamId) {
      return err(new DomainError('INVALID_PROJECT', 'Team is required'));
    }

    if (data.startDate && data.endDate && data.startDate > data.endDate) {
      return err(new DomainError('INVALID_PROJECT', 'Start date must be before end date'));
    }

    return ok(undefined);
  }

  private validateTaskData(data: CreateTaskData): Result<void, DomainError> {
    if (!data.title || data.title.trim().length === 0) {
      return err(new DomainError('INVALID_TASK', 'Task title is required'));
    }

    if (!data.projectId) {
      return err(new DomainError('INVALID_TASK', 'Project is required'));
    }

    if (!data.reporterId) {
      return err(new DomainError('INVALID_TASK', 'Reporter is required'));
    }

    if (data.startDate && data.dueDate && data.startDate > data.dueDate) {
      return err(new DomainError('INVALID_TASK', 'Start date must be before due date'));
    }

    return ok(undefined);
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): Result<void, DomainError> {
    const validTransitions: Record<string, string[]> = {
      'todo': ['in_progress', 'done'],
      'in_progress': ['review', 'todo', 'done'],
      'review': ['in_progress', 'done'],
      'done': ['todo', 'in_progress'], // Allow reopening
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return err(new DomainError('INVALID_TRANSITION', `Cannot transition from ${currentStatus} to ${newStatus}`));
    }

    return ok(undefined);
  }

  private async calculateTaskPosition(projectId: string, status: string): Promise<number> {
    const tasks = await this.getProjectTasksByStatus(projectId, status);
    return tasks.length > 0 ? Math.max(...tasks.map(task => task.position)) + 1 : 0;
  }

  private async updateParentTaskStatus(parentId: string): Promise<void> {
    const subtasks = await this.getSubtasks(parentId);
    const allCompleted = subtasks.every(task => task.status === 'done');
    const anyInProgress = subtasks.some(task => task.status === 'in_progress');

    let newStatus: string;
    if (allCompleted) {
      newStatus = 'done';
    } else if (anyInProgress) {
      newStatus = 'in_progress';
    } else {
      newStatus = 'todo';
    }

    await this.updateTaskInDatabase(parentId, { status: newStatus });
  }

  // Database methods (implement with your ORM)
  private async saveProject(data: CreateProjectData): Promise<any> {
    // Implementation depends on your database layer
    return {};
  }

  private async getProject(projectId: string): Promise<any> {
    // Implementation depends on your database layer
    return null;
  }

  private async updateProjectInDatabase(projectId: string, updates: Partial<CreateProjectData>): Promise<any> {
    // Implementation depends on your database layer
    return {};
  }

  private async saveTask(data: CreateTaskData & { position: number }): Promise<any> {
    // Implementation depends on your database layer
    return {};
  }

  private async getTask(taskId: string): Promise<any> {
    // Implementation depends on your database layer
    return null;
  }

  private async updateTaskInDatabase(taskId: string, updates: Partial<any>): Promise<any> {
    // Implementation depends on your database layer
    return {};
  }

  private async getProjectTasks(projectId: string): Promise<any[]> {
    // Implementation depends on your database layer
    return [];
  }

  private async getProjectTasksByStatus(projectId: string, status: string): Promise<any[]> {
    // Implementation depends on your database layer
    return [];
  }

  private async getSubtasks(parentId: string): Promise<any[]> {
    // Implementation depends on your database layer
    return [];
  }

  private async getTaskStatistics(projectId: string): Promise<any> {
    // Implementation depends on your database layer
    return { total: 0, completed: 0, inProgress: 0, overdue: 0, averageDuration: 0 };
  }

  private async getTimeStatistics(projectId: string): Promise<any> {
    // Implementation depends on your database layer
    return { total: 0, completed: 0 };
  }

  private async getBudgetInformation(projectId: string): Promise<any> {
    // Implementation depends on your database layer
    return { utilization: 0 };
  }

  private async calculateTeamVelocity(projectId: string): Promise<number> {
    // Implementation depends on your database layer
    return 0;
  }

  private async getTaskDependencies(projectId: string): Promise<any[]> {
    // Implementation depends on your database layer
    return [];
  }

  private async getProjectMilestones(projectId: string): Promise<any[]> {
    // Implementation depends on your database layer
    return [];
  }

  private async getProjectMembers(projectId: string): Promise<any[]> {
    // Implementation depends on your database layer
    return [];
  }

  private async getProjectTimeEntries(projectId: string): Promise<any[]> {
    // Implementation depends on your database layer
    return [];
  }

  private async validateProjectManager(managerId: string): Promise<void> {
    // Implementation depends on your user management system
  }

  private async validateProjectAccess(projectId: string, userId: string): Promise<void> {
    // Implementation depends on your permission system
  }

  private async validateTaskAccess(taskId: string, userId: string): Promise<void> {
    // Implementation depends on your permission system
  }

  private async addProjectMember(projectId: string, userId: string, role: string, allocation: number): Promise<void> {
    // Implementation depends on your database layer
  }

  private async logActivity(action: string, projectId: string, userId: string, metadata: any): Promise<void> {
    // Implementation depends on your activity logging system
  }
}
```

#### Create Project Routes
```typescript
// artifacts/api-server/src/routes/projects.ts
import { Router } from 'express';
import { ProjectService } from '../services/project.service';
import { validateRequest } from '../middleware/validation';

const router = Router();
const projectService = new ProjectService();

// Project routes
router.post('/', async (req, res, next) => {
  const result = await projectService.createProject(req.body);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

router.get('/', async (req, res) => {
  const projects = await projectService.listProjects();
  res.json(projects);
});

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const project = await projectService.getProject(id);
  
  if (!project) {
    return next(new DomainError('PROJECT_NOT_FOUND', 'Project not found'));
  }
  
  res.json(project);
});

router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const result = await projectService.updateProject(id, req.body);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

router.get('/:id/metrics', async (req, res, next) => {
  const { id } = req.params;
  const result = await projectService.getProjectMetrics(id);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

router.get('/:id/kanban', async (req, res, next) => {
  const { id } = req.params;
  const result = await projectService.getKanbanBoard(id);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

router.get('/:id/gantt', async (req, res, next) => {
  const { id } = req.params;
  const result = await projectService.getGanttChart(id);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

router.get('/:id/allocation', async (req, res, next) => {
  const { id } = req.params;
  const result = await projectService.getResourceAllocation(id);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

// Task routes
router.post('/:projectId/tasks', async (req, res, next) => {
  const { projectId } = req.params;
  const result = await projectService.createTask({ ...req.body, projectId });
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.status(201).json(result.value);
});

router.put('/tasks/:taskId/status', async (req, res, next) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const userId = req.user?.id; // Assuming auth middleware
  
  const result = await projectService.updateTaskStatus(taskId, status, userId);
  
  if (result.isErr()) {
    return next(result.error);
  }
  
  res.json(result.value);
});

export default router;
```

### 2. Frontend Implementation

#### Create Kanban Board Component
```typescript
// artifacts/apex-os/src/components/projects/KanbanBoard.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, MoreHorizontal } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { CreateTaskDialog } from './CreateTaskDialog';

interface KanbanColumn {
  id: string;
  title: string;
  tasks: any[];
  color: string;
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: boardData, isLoading } = useQuery({
    queryKey: ['kanban-board', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/kanban`);
      return response.json();
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: string }) => {
      const response = await fetch(`/api/projects/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kanban-board', projectId]);
    },
  });

  const handleDrop = (taskId: string, newStatus: string) => {
    updateTaskStatusMutation.mutate({ taskId, newStatus });
  };

  const handleCreateTask = (columnId: string) => {
    setSelectedColumn(columnId);
    setIsCreateTaskOpen(true);
  };

  if (isLoading) {
    return <div>Loading Kanban board...</div>;
  }

  const columns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', tasks: boardData?.columns?.todo || [], color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', tasks: boardData?.columns?.in_progress || [], color: 'bg-blue-50' },
    { id: 'review', title: 'Review', tasks: boardData?.columns?.review || [], color: 'bg-yellow-50' },
    { id: 'done', title: 'Done', tasks: boardData?.columns?.done || [], color: 'bg-green-50' },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{boardData?.project?.name}</h2>
          <Button onClick={() => handleCreateTask('todo')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="flex space-x-6 h-full overflow-x-auto">
          {columns.map((column) => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              onDrop={handleDrop}
              onCreateTask={() => handleCreateTask(column.id)}
            />
          ))}
        </div>

        {isCreateTaskOpen && (
          <CreateTaskDialog
            projectId={projectId}
            initialStatus={selectedColumn || 'todo'}
            open={isCreateTaskOpen}
            onClose={() => setIsCreateTaskOpen(false)}
            onSuccess={() => {
              setIsCreateTaskOpen(false);
              queryClient.invalidateQueries(['kanban-board', projectId]);
            }}
          />
        )}
      </div>
    </DndProvider>
  );
}

function KanbanColumnComponent({ 
  column, 
  onDrop, 
  onCreateTask 
}: { 
  column: KanbanColumn; 
  onDrop: (taskId: string, newStatus: string) => void;
  onCreateTask: () => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('taskId');
    onDrop(taskId, column.id);
  };

  return (
    <div className="flex-shrink-0 w-80">
      <Card className={`h-full ${column.color}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{column.title}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{column.tasks.length}</Badge>
              <Button size="sm" variant="ghost" onClick={onCreateTask}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent 
          className={`space-y-3 min-h-[400px] transition-colors ${
            isDragOver ? 'bg-blue-100 border-2 border-blue-300' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Create Task Card Component
```typescript
// artifacts/apex-os/src/components/projects/TaskCard.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User, MoreHorizontal } from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    assigneeId?: string;
    assignee?: {
      id: string;
      name: string;
      avatar?: string;
    };
    storyPoints?: number;
    dueDate?: string;
    tags?: string[];
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-move transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isOverdue ? 'border-red-300' : ''}`}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-sm leading-tight">{task.title}</h3>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {task.assignee && (
                <div className="flex items-center space-x-1">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback className="text-xs">
                      {task.assignee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-600">{task.assignee.name}</span>
                </div>
              )}
              
              {task.storyPoints && (
                <Badge variant="outline" className="text-xs">
                  {task.storyPoints} pts
                </Badge>
              )}
            </div>

            {task.dueDate && (
              <div className={`flex items-center space-x-1 text-xs ${
                isOverdue ? 'text-red-600' : 'text-gray-500'
              }`}>
                <Clock className="w-3 h-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Create Gantt Chart Component
```typescript
// artifacts/apex-os/src/components/projects/GanttChart.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Calendar } from 'lucide-react';
import { format, addDays, differenceInDays, eachDayOfInterval } from 'date-fns';

interface GanttChartProps {
  projectId: string;
}

export function GanttChart({ projectId }: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: ganttData, isLoading } = useQuery({
    queryKey: ['gantt-chart', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/gantt`);
      return response.json();
    },
  });

  const chartData = useMemo(() => {
    if (!ganttData) return null;

    const projectStart = ganttData.project.startDate;
    const projectEnd = ganttData.project.endDate;
    
    if (!projectStart || !projectEnd) return null;

    const totalDays = differenceInDays(new Date(projectEnd), new Date(projectStart)) + 1;
    const days = eachDayOfInterval({
      start: new Date(projectStart),
      end: new Date(projectEnd),
    });

    return {
      project: ganttData.project,
      tasks: ganttData.tasks.map((task: any) => ({
        ...task,
        startOffset: task.startDate ? differenceInDays(new Date(task.startDate), new Date(projectStart)) : 0,
        duration: task.startDate && task.endDate ? 
          differenceInDays(new Date(task.endDate), new Date(task.startDate)) + 1 : 1,
      })),
      milestones: ganttData.mstones,
      days,
      totalDays,
    };
  }, [ganttData]);

  if (isLoading) {
    return <div>Loading Gantt chart...</div>;
  }

  if (!chartData) {
    return <div>No Gantt data available</div>;
  }

  const dayWidth = 30 * zoomLevel;
  const chartWidth = chartData.totalDays * dayWidth;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gantt Chart</h2>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className="flex border-b">
            <div className="w-64 p-4 font-medium">Task</div>
            <div className="relative" style={{ width: chartWidth }}>
              <div className="flex">
                {chartData.days.map((day, index) => (
                  <div
                    key={index}
                    className="border-r p-2 text-center text-xs"
                    style={{ width: dayWidth }}
                  >
                    <div>{format(day, 'MMM dd')}</div>
                    <div className="text-gray-500">{format(day, 'EEE')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks */}
          {chartData.tasks.map((task, index) => (
            <div key={task.id} className="flex border-b hover:bg-gray-50">
              <div className="w-64 p-4">
                <div className="font-medium text-sm">{task.title}</div>
                {task.assignee && (
                  <div className="text-xs text-gray-600 mt-1">{task.assignee}</div>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={task.progress === 100 ? 'default' : 'secondary'}>
                    {task.progress}%
                  </Badge>
                  {task.dependencies.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {task.dependencies.length} deps
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="relative" style={{ width: chartWidth, height: '80px' }}>
                {/* Task Bar */}
                <div
                  className="absolute top-4 h-8 bg-blue-500 rounded flex items-center px-2 text-white text-xs"
                  style={{
                    left: task.startOffset * dayWidth,
                    width: task.duration * dayWidth,
                  }}
                >
                  <span>{task.title}</span>
                </div>

                {/* Progress Bar */}
                <div
                  className="absolute top-4 h-8 bg-blue-700 rounded-l"
                  style={{
                    left: task.startOffset * dayWidth,
                    width: task.duration * dayWidth * (task.progress / 100),
                  }}
                />

                {/* Dependency Lines */}
                {task.dependencies.map((depId: string) => {
                  const depTask = chartData.tasks.find((t: any) => t.id === depId);
                  if (!depTask) return null;
                  
                  const startX = (depTask.startOffset + depTask.duration) * dayWidth;
                  const endX = task.startOffset * dayWidth;
                  const startY = index * 80 + 40;
                  const endY = (index + 1) * 80 + 40;
                  
                  return (
                    <svg
                      key={depId}
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{ width: chartWidth, height: (index + 1) * 80 + 40 }}
                    >
                      <path
                        d={`M ${startX} ${startY} L ${endX} ${endY}`}
                        stroke="#666"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                      />
                    </svg>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Milestones */}
          {chartData.milestones.map((milestone: any) => {
            const dayOffset = differenceInDays(new Date(milestone.date), new Date(chartData.project.startDate));
            
            return (
              <div key={milestone.id} className="absolute">
                <div
                  className="absolute w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"
                  style={{
                    left: dayOffset * dayWidth + dayWidth / 2 - 16,
                    top: -20,
                  }}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <div
                  className="absolute text-xs font-medium bg-white px-2 py-1 rounded shadow border"
                  style={{
                    left: dayOffset * dayWidth + dayWidth / 2 - 40,
                    top: -40,
                    width: 80,
                    textAlign: 'center',
                  }}
                >
                  {milestone.name}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arrow marker definition */}
      <svg width="0" height="0">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#666"
            />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
```

### 3. Resource Management

#### Create Resource Allocation Component
```typescript
// artifacts/apex-os/src/components/projects/ResourceAllocation.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ResourceAllocationProps {
  projectId: string;
}

export function ResourceAllocation({ projectId }: ResourceAllocationProps) {
  const { data: allocationData, isLoading } = useQuery({
    queryKey: ['resource-allocation', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/allocation`);
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading resource allocation...</div>;
  }

  const chartData = allocationData?.members?.map((member: any) => ({
    name: member.userId,
    allocated: member.totalAllocatedHours,
    actual: member.totalActualHours,
    utilization: member.utilization,
  })) || [];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Resource Allocation</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Allocated Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocationData?.totalAllocatedHours || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Actual Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocationData?.totalActualHours || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allocationData?.members?.length > 0 
                ? Math.round(allocationData.members.reduce((sum: number, member: any) => sum + member.utilization, 0) / allocationData.members.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="allocated" fill="#8884d8" name="Allocated Hours" />
              <Bar dataKey="actual" fill="#82ca9d" name="Actual Hours" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <div className="grid gap-4">
        {allocationData?.members?.map((member: any) => (
          <Card key={member.userId}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{member.userId.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.userId}</div>
                    <Badge variant="secondary">{member.role}</Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Tasks</div>
                    <div className="font-medium">{member.tasks}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Completed</div>
                    <div className="font-medium">{member.completedTasks}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Utilization</div>
                    <div className="font-medium">{Math.round(member.utilization)}%</div>
                  </div>
                  <div className="w-32">
                    <Progress value={member.utilization} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Testing

### Unit Tests
```typescript
describe('ProjectService', () => {
  it('should create project with valid data', async () => {
    const projectData = {
      name: 'Test Project',
      description: 'A test project',
      status: 'planning' as const,
      priority: 'medium' as const,
      projectManagerId: 'user-123',
      teamId: 'team-456',
    };

    const result = await projectService.createProject(projectData);
    expect(result.isOk()).toBe(true);
    expect(result.value.name).toBe('Test Project');
  });

  it('should validate project data', async () => {
    const invalidData = {
      name: '',
      status: 'planning' as const,
      priority: 'medium' as const,
      projectManagerId: '',
      teamId: '',
    };

    const result = await projectService.createProject(invalidData);
    expect(result.isErr()).toBe(true);
    expect(result.error.code).toBe('INVALID_PROJECT');
  });

  it('should calculate project metrics correctly', async () => {
    const projectId = 'test-project-id';
    const result = await projectService.getProjectMetrics(projectId);
    
    expect(result.isOk()).toBe(true);
    expect(result.value).toHaveProperty('totalTasks');
    expect(result.value).toHaveProperty('completedTasks');
    expect(result.value).toHaveProperty('progressPercentage');
  });
});
```

### Integration Tests
```typescript
describe('Project API', () => {
  it('should create and retrieve project', async () => {
    const createResponse = await request(app)
      .post('/api/projects')
      .send({
        name: 'Integration Test Project',
        status: 'planning',
        priority: 'medium',
        projectManagerId: 'user-123',
        teamId: 'team-456',
      })
      .expect(201);

    const projectId = createResponse.body.id;
    
    const getResponse = await request(app)
      .get(`/api/projects/${projectId}`)
      .expect(200);

    expect(getResponse.body.name).toBe('Integration Test Project');
  });

  it('should get Kanban board', async () => {
    const projectId = 'test-project-id';
    const response = await request(app)
      .get(`/api/projects/${projectId}/kanban`)
      .expect(200);

    expect(response.body).toHaveProperty('columns');
    expect(response.body.columns).toHaveProperty('todo');
    expect(response.body.columns).toHaveProperty('in_progress');
    expect(response.body.columns).toHaveProperty('review');
    expect(response.body.columns).toHaveProperty('done');
  });
});
```

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Use database connections pooling
- Implement pagination for large datasets
- Cache frequently accessed data

### Frontend Performance
- Virtual scrolling for large task lists
- Lazy loading of project data
- Optimize re-renders with React.memo
- Implement debounced search and filtering

### Real-time Updates
- Use WebSocket for live updates
- Implement optimistic updates
- Cache API responses
- Handle connection failures gracefully

## Security Considerations

### Access Control
- Role-based permissions for projects
- Validate user access to projects
- Secure task assignment and updates
- Audit trail for all changes

### Data Protection
- Validate all input data
- Sanitize user-generated content
- Implement rate limiting
- Secure file uploads

## Best Practices

### Project Management
- Use consistent status transitions
- Implement proper task dependencies
- Track time accurately
- Maintain clear project milestones

### Team Collaboration
- Real-time updates and notifications
- Clear communication channels
- Proper task assignment workflows
- Comprehensive activity logging

### Reporting and Analytics
- Meaningful project metrics
- Visual progress indicators
- Resource utilization tracking
- Performance benchmarking

## Deployment Checklist

- [ ] Set up database schema and migrations
- [ ] Configure project management API
- [ ] Deploy frontend components
- [ ] Set up real-time communication
- [ ] Configure monitoring and logging
- [ ] Test with sample project data
- [ ] Document API endpoints
- [ ] Train users on the interface
