---
name: seed-data-management
description: Implement database seeding system for development, testing, and staging environments with realistic mock data generation
---

# Seed Data Management

This skill guides you through implementing a database seeding system for populating development, testing, and staging environments with realistic mock data.

## Current State Assessment

**Current State**: No seed data exists - database is empty after schema creation.

**Missing Infrastructure**:
- No seed scripts for development
- No test data factories
- No realistic mock data generation
- No seeding for integration tests

## Seed Data Architecture

### **Seed Categories**

| Environment | Purpose | Data Volume |
|-------------|---------|-------------|
| **Development** | Local development | Minimal (10-50 records) |
| **Testing** | Automated tests | Controlled (fixed scenarios) |
| **Staging** | UAT/QA testing | Realistic (1000-10000 records) |
| **Demo** | Sales demos | Rich (pre-configured scenarios) |

### **Seed Order (Dependencies)**

```
1. Organizations (root entity)
2. Users, Roles, Permissions (identity)
3. Contacts, Companies (CRM foundation)
4. Leads, Deals (CRM active data)
5. Projects, Tasks (project management)
6. Invoices, Payments (finance)
7. Folders, Documents (documents)
8. Assets, Checkouts (assets)
9. Portal Clients (portal)
10. Settings, Integrations (system)
```

## Step-by-Step Implementation

### **Step 1: Create Seed Configuration**

**File**: `lib/db/src/seed/config.ts`

```typescript
/**
 * Seed configuration for different environments
 */
export const seedConfig = {
  development: {
    organizations: 2,
    usersPerOrg: 5,
    contactsPerOrg: 50,
    leadsPerOrg: 30,
    projectsPerOrg: 10,
    tasksPerProject: 5,
  },
  testing: {
    organizations: 1,
    usersPerOrg: 3,
    contactsPerOrg: 10,
    leadsPerOrg: 5,
    projectsPerOrg: 3,
    tasksPerProject: 3,
  },
  staging: {
    organizations: 5,
    usersPerOrg: 10,
    contactsPerOrg: 500,
    leadsPerOrg: 200,
    projectsPerOrg: 50,
    tasksPerProject: 10,
  },
};

export type SeedEnvironment = keyof typeof seedConfig;
```

### **Step 2: Create Data Generators**

**File**: `lib/db/src/seed/generators.ts`

```typescript
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

/**
 * Generate realistic but deterministic data
 */
export const generators = {
  uuid: () => randomUUID(),
  
  organizationName: () => faker.company.name(),
  organizationSlug: (name: string) => 
    name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
  
  userName: () => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
  }),
  
  email: (firstName: string, lastName: string, domain?: string) => {
    const d = domain || faker.internet.domainName();
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${d}`;
  },
  
  passwordHash: () => 
    // Argon2 hash for 'Password123!'
    '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHRzb21lc2FsdA$hashhere',
  
  contact: (orgDomain: string) => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email({ domain: orgDomain }),
    phone: faker.phone.number(),
    company: faker.company.name(),
    title: faker.person.jobTitle(),
    status: faker.helpers.arrayElement(['active', 'inactive']) as 'active' | 'inactive',
    tags: faker.helpers.arrayElements(['vip', 'prospect', 'customer', 'partner'], { min: 0, max: 3 }),
    notes: faker.lorem.paragraph(),
  }),
  
  leadTitle: () => 
    faker.helpers.arrayElement([
      'Enterprise Software License',
      'Consulting Services',
      'Annual Support Contract',
      'Training Package',
      'Implementation Project',
    ]),
  
  leadStage: () => 
    faker.helpers.arrayElement([
      'new',
      'qualified',
      'proposal',
      'negotiation',
      'closed_won',
      'closed_lost',
    ]) as 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost',
  
  projectName: () => 
    faker.helpers.arrayElement([
      'Website Redesign',
      'Mobile App Development',
      'CRM Integration',
      'Data Migration',
      'Security Audit',
      'Cloud Migration',
    ]),
  
  projectStatus: () =>
    faker.helpers.arrayElement([
      'planning',
      'active',
      'on_hold',
      'completed',
    ]) as 'planning' | 'active' | 'on_hold' | 'completed',
  
  taskTitle: () =>
    faker.helpers.arrayElement([
      'Initial Requirements Gathering',
      'Design Mockups',
      'API Development',
      'Frontend Implementation',
      'Testing & QA',
      'Documentation',
      'Deployment',
    ]),
  
  taskStatus: () =>
    faker.helpers.arrayElement([
      'todo',
      'in_progress',
      'done',
      'blocked',
    ]) as 'todo' | 'in_progress' | 'done' | 'blocked',
  
  invoiceAmount: () => faker.number.int({ min: 1000, max: 50000 }),
  
  documentName: () =>
    faker.helpers.arrayElement([
      'Contract.pdf',
      'Proposal.pdf',
      'Invoice.pdf',
      'NDA.pdf',
      'Statement of Work.pdf',
    ]),
};
```

### **Step 3: Create Seed Functions**

**File**: `lib/db/src/seed/seeders.ts`

```typescript
import { db } from '../db';
import { 
  organizationsTable, 
  usersTable, 
  rolesTable,
} from '../schema/auth';
import { 
  contactsTable, 
  leadsTable 
} from '../schema/crm';
import { 
  projectsTable, 
  tasksTable 
} from '../schema/projects';
import { generators } from './generators';
import { seedConfig, SeedEnvironment } from './config';
import { eq } from 'drizzle-orm';

/**
 * Seed organizations
 */
export async function seedOrganizations(count: number) {
  const orgs = [];
  
  for (let i = 0; i < count; i++) {
    const name = generators.organizationName();
    const slug = generators.organizationSlug(name);
    
    const org = await db.insert(organizationsTable).values({
      id: generators.uuid(),
      name,
      slug,
      planType: i === 0 ? 'enterprise' : 'pro',
      settings: {},
    }).returning();
    
    orgs.push(org[0]);
  }
  
  console.log(`✓ Seeded ${orgs.length} organizations`);
  return orgs;
}

/**
 * Seed users for an organization
 */
export async function seedUsers(organizationId: string, count: number) {
  const users = [];
  const orgDomain = `org-${organizationId.slice(0, 8)}.example.com`;
  
  // Create admin user
  const adminName = generators.userName();
  const admin = await db.insert(usersTable).values({
    id: generators.uuid(),
    organizationId,
    email: generators.email(adminName.firstName, adminName.lastName, orgDomain),
    passwordHash: generators.passwordHash(),
    name: `${adminName.firstName} ${adminName.lastName}`,
    role: 'admin',
    status: 'active',
    emailVerified: true,
  }).returning();
  users.push(admin[0]);
  
  // Create regular users
  for (let i = 1; i < count; i++) {
    const name = generators.userName();
    const user = await db.insert(usersTable).values({
      id: generators.uuid(),
      organizationId,
      email: generators.email(name.firstName, name.lastName, orgDomain),
      passwordHash: generators.passwordHash(),
      name: `${name.firstName} ${name.lastName}`,
      role: i % 3 === 0 ? 'viewer' : 'user',
      status: 'active',
      emailVerified: true,
    }).returning();
    users.push(user[0]);
  }
  
  console.log(`✓ Seeded ${users.length} users for ${organizationId}`);
  return users;
}

/**
 * Seed default roles
 */
export async function seedRoles(organizationId: string) {
  const defaultRoles = [
    { name: 'admin', permissions: ['*'] },
    { name: 'user', permissions: ['crm:read', 'crm:write', 'projects:read', 'projects:write'] },
    { name: 'viewer', permissions: ['crm:read', 'projects:read'] },
  ];
  
  for (const role of defaultRoles) {
    await db.insert(rolesTable).values({
      id: generators.uuid(),
      organizationId,
      name: role.name,
      description: `${role.name} role`,
      permissions: role.permissions,
    });
  }
  
  console.log(`✓ Seeded default roles for ${organizationId}`);
}

/**
 * Seed contacts for an organization
 */
export async function seedContacts(
  organizationId: string, 
  count: number,
  userIds: string[]
) {
  const contacts = [];
  const orgDomain = `org-${organizationId.slice(0, 8)}.example.com`;
  
  for (let i = 0; i < count; i++) {
    const contactData = generators.contact(orgDomain);
    const assignedTo = userIds[i % userIds.length];
    
    const contact = await db.insert(contactsTable).values({
      id: generators.uuid(),
      organizationId,
      assignedTo,
      ...contactData,
    }).returning();
    
    contacts.push(contact[0]);
  }
  
  console.log(`✓ Seeded ${contacts.length} contacts for ${organizationId}`);
  return contacts;
}

/**
 * Seed leads for an organization
 */
export async function seedLeads(
  organizationId: string,
  count: number,
  contactIds: string[],
  userIds: string[]
) {
  const leads = [];
  
  for (let i = 0; i < count; i++) {
    const contactId = contactIds[i % contactIds.length];
    const assignedTo = userIds[i % userIds.length];
    
    const lead = await db.insert(leadsTable).values({
      id: generators.uuid(),
      organizationId,
      contactId,
      title: generators.leadTitle(),
      description: `Lead generated from ${faker.helpers.arrayElement(['website', 'referral', 'cold-call', 'email'])}`,
      value: generators.invoiceAmount().toString(),
      stage: generators.leadStage(),
      source: faker.helpers.arrayElement(['website', 'referral', 'cold-call', 'email', 'social']),
      assignedTo,
      probability: faker.number.int({ min: 0, max: 100 }),
      expectedCloseDate: faker.date.future(),
    }).returning();
    
    leads.push(lead[0]);
  }
  
  console.log(`✓ Seeded ${leads.length} leads for ${organizationId}`);
  return leads;
}

/**
 * Seed projects for an organization
 */
export async function seedProjects(
  organizationId: string,
  count: number,
  userIds: string[]
) {
  const projects = [];
  
  for (let i = 0; i < count; i++) {
    const project = await db.insert(projectsTable).values({
      id: generators.uuid(),
      organizationId,
      name: generators.projectName(),
      description: faker.lorem.paragraph(),
      status: generators.projectStatus(),
      ownerId: userIds[i % userIds.length],
      budget: faker.number.int({ min: 10000, max: 100000 }),
      startDate: faker.date.past(),
      targetEndDate: faker.date.future(),
    }).returning();
    
    projects.push(project[0]);
  }
  
  console.log(`✓ Seeded ${projects.length} projects for ${organizationId}`);
  return projects;
}

/**
 * Seed tasks for projects
 */
export async function seedTasks(
  organizationId: string,
  projectId: string,
  count: number,
  userIds: string[]
) {
  const tasks = [];
  
  for (let i = 0; i < count; i++) {
    const task = await db.insert(tasksTable).values({
      id: generators.uuid(),
      organizationId,
      projectId,
      title: generators.taskTitle(),
      description: faker.lorem.paragraph(),
      status: generators.taskStatus(),
      assignedTo: userIds[i % userIds.length],
      priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
      dueDate: faker.date.future(),
    }).returning();
    
    tasks.push(task[0]);
  }
  
  console.log(`✓ Seeded ${tasks.length} tasks for project ${projectId}`);
  return tasks;
}
```

### **Step 4: Main Seed Script**

**File**: `lib/db/src/seed/index.ts`

```typescript
import { db } from '../db';
import { seedConfig, SeedEnvironment } from './config';
import {
  seedOrganizations,
  seedUsers,
  seedRoles,
  seedContacts,
  seedLeads,
  seedProjects,
  seedTasks,
} from './seeders';

/**
 * Main seed function
 */
export async function seed(environment: SeedEnvironment = 'development') {
  const config = seedConfig[environment];
  
  console.log(`\n🌱 Starting seed for ${environment} environment...\n`);
  
  try {
    // 1. Organizations
    const organizations = await seedOrganizations(config.organizations);
    
    for (const org of organizations) {
      // 2. Roles (must be before users)
      await seedRoles(org.id);
      
      // 3. Users
      const users = await seedUsers(org.id, config.usersPerOrg);
      const userIds = users.map(u => u.id);
      
      // 4. Contacts
      const contacts = await seedContacts(
        org.id, 
        config.contactsPerOrg, 
        userIds
      );
      const contactIds = contacts.map(c => c.id);
      
      // 5. Leads
      await seedLeads(org.id, config.leadsPerOrg, contactIds, userIds);
      
      // 6. Projects
      const projects = await seedProjects(org.id, config.projectsPerOrg, userIds);
      
      // 7. Tasks
      for (const project of projects) {
        await seedTasks(
          org.id,
          project.id,
          config.tasksPerProject,
          userIds
        );
      }
    }
    
    console.log('\n✅ Seed completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    throw error;
  }
}

/**
 * Clear all data (use with caution!)
 */
export async function clearDatabase() {
  console.log('\n🗑️  Clearing database...\n');
  
  // Delete in reverse order of dependencies
  await db.delete(tasksTable);
  await db.delete(projectsTable);
  await db.delete(leadsTable);
  await db.delete(contactsTable);
  await db.delete(usersTable);
  await db.delete(rolesTable);
  await db.delete(organizationsTable);
  
  console.log('✓ Database cleared\n');
}

// CLI execution
if (require.main === module) {
  const env = (process.argv[2] as SeedEnvironment) || 'development';
  const shouldClear = process.argv.includes('--clear');
  
  (async () => {
    if (shouldClear) {
      await clearDatabase();
    }
    await seed(env);
    process.exit(0);
  })();
}

// Import tables for clearDatabase
import { tasksTable, projectsTable } from '../schema/projects';
```

### **Step 5: Package.json Scripts**

**File**: `lib/db/package.json`

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/seed/index.ts",
    "db:seed:staging": "tsx src/seed/index.ts staging",
    "db:seed:clear": "tsx src/seed/index.ts --clear",
    "db:reset": "tsx src/seed/index.ts --clear && tsx src/seed/index.ts"
  }
}
```

### **Step 6: Test Data Factory**

**File**: `artifacts/api-server/__tests__/helpers/test-data-factory.ts`

```typescript
import { db } from '@workspace/db';
import { usersTable, organizationsTable } from '@workspace/db/schema/auth';
import { contactsTable } from '@workspace/db/schema/crm';
import { generators } from '@workspace/db/seed/generators';

/**
 * Factory for creating test data in integration tests
 */
export class TestDataFactory {
  private orgId: string;
  private userId: string;

  constructor() {
    this.orgId = generators.uuid();
    this.userId = generators.uuid();
  }

  async createOrganization(overrides?: Partial<typeof organizationsTable.$inferInsert>) {
    const org = await db.insert(organizationsTable).values({
      id: this.orgId,
      name: 'Test Organization',
      slug: 'test-org',
      planType: 'pro',
      ...overrides,
    }).returning();
    return org[0];
  }

  async createUser(overrides?: Partial<typeof usersTable.$inferInsert>) {
    const user = await db.insert(usersTable).values({
      id: this.userId,
      organizationId: this.orgId,
      email: 'test@example.com',
      passwordHash: generators.passwordHash(),
      name: 'Test User',
      role: 'user',
      status: 'active',
      ...overrides,
    }).returning();
    return user[0];
  }

  async createContact(overrides?: Partial<typeof contactsTable.$inferInsert>) {
    const contact = await db.insert(contactsTable).values({
      id: generators.uuid(),
      organizationId: this.orgId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      status: 'active',
      ...overrides,
    }).returning();
    return contact[0];
  }

  getOrgId() {
    return this.orgId;
  }

  getUserId() {
    return this.userId;
  }
}
```

## Verification Commands

```bash
# Seed development database
pnpm --filter @workspace/db run db:seed

# Seed with clear
pnpm --filter @workspace/db run db:reset

# Seed staging data
pnpm --filter @workspace/db run db:seed:staging

# Verify seed data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM contacts;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM leads;"
```

## Seed Checklist

- [ ] Seed script runs without errors
- [ ] Data respects multi-tenancy (organization_id set)
- [ ] Foreign key constraints satisfied
- [ ] Realistic data generated
- [ ] Clear function works for cleanup
- [ ] Test factory creates valid test data
