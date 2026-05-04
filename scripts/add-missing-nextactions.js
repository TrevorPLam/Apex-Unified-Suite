#!/usr/bin/env node
const fs = require('fs');

// Load the task data
const data = JSON.parse(fs.readFileSync('tasks/00.TODO-MASTER-TRACKER.json'));

// Define the nextAction values for missing tasks
const nextActions = {
  'ARCH-001.2': 'ARCH-001.2.1 (write ADR documenting chosen strategy)',
  'ARCH-001.3': 'ARCH-001.3.1 (design tenant isolation schema)',
  'ARCH-001.4': 'ARCH-001.4.1 (write developer implementation guidelines)',
  'API-ANALYTICS-001.1': 'API-ANALYTICS-001.1.1 (design reports schema tables)',
  'API-ANALYTICS-001.2': 'API-ANALYTICS-001.2.1 (implement query builder interface)',
  'API-ANALYTICS-001.3': 'API-ANALYTICS-001.3.1 (implement CSV/PDF export functionality)',
  'API-ANALYTICS-001.4': 'API-ANALYTICS-001.4.1 (implement Redis caching layer)'
};

// Add missing nextAction fields
let updated = 0;
for (const task of data.tasks) {
  if (!task.nextAction && nextActions[task.id]) {
    task.nextAction = nextActions[task.id];
    updated++;
    console.log(`Added nextAction to ${task.id}: ${task.nextAction}`);
  }
}

// Save the updated data
fs.writeFileSync('tasks/00.TODO-MASTER-TRACKER.json', JSON.stringify(data, null, 2));

console.log(`\nUpdated ${updated} tasks with nextAction fields.`);

// Verify all tasks now have nextAction
const missing = data.tasks.filter(t => !t.nextAction).map(t => t.id);
console.log(`\nTasks still missing nextAction: ${missing.length}`);
if (missing.length > 0) {
  console.log('Missing:', missing);
} else {
  console.log('✅ All tasks now have nextAction fields!');
}
