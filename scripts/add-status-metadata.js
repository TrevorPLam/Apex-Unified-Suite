// scripts/add-status-metadata.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE = path.join(__dirname, '..', 'tasks', '00.TODO-MASTER-TRACKER.json');

function loadTasks() {
  const data = fs.readFileSync(TASKS_FILE, 'utf8');
  return JSON.parse(data);
}

function addStatusMetadataFields(data) {
  let updatedCount = 0;
  
  for (const task of data.tasks) {
    let updated = false;
    
    if (!task.statusUpdatedAt) {
      task.statusUpdatedAt = null; // Will be set when status changes
      updated = true;
    }
    if (!task.assignedTo) {
      task.assignedTo = null;
      updated = true;
    }
    if (!task.blockedReason) {
      task.blockedReason = null;
      updated = true;
    }
    
    if (updated) {
      updatedCount++;
    }
  }
  
  return updatedCount;
}

function main() {
  try {
    console.log('Loading tasks...');
    const data = loadTasks();
    
    console.log(`Found ${data.tasks.length} tasks`);
    console.log('Adding status metadata fields...');
    
    const updatedCount = addStatusMetadataFields(data);
    
    fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Added status metadata fields to ${updatedCount} tasks`);
    console.log('Fields added: statusUpdatedAt, assignedTo, blockedReason');
    
  } catch (err) {
    console.error('Failed to add status metadata:', err.message);
    process.exit(1);
  }
}

main();
