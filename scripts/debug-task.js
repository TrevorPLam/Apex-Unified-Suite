#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASKS_FILE = path.join(__dirname, '..', 'tasks', '00.TODO-MASTER-TRACKER.json');

function main() {
  try {
    const data = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    
    const task = data.tasks.find(t => t.id === 'MILESTONE-P3-APIS-COMPLETE');
    console.log('Task found:', !!task);
    if (task) {
      console.log('Task ID:', task.id);
      console.log('Task phase:', task.phase);
      console.log('Task wave:', task.wave);
      console.log('Task description:', task.description);
      console.log('Task status:', task.status);
      console.log('Required fields check:');
      console.log('  id:', !!task.id);
      console.log('  phase:', !!task.phase);
      console.log('  wave:', !!task.wave);
      console.log('  description:', !!task.description);
      console.log('  status:', !!task.status);
      console.log('All required fields present:', !!(task.id && task.phase && task.wave && task.description && task.status));
    }
    
  } catch (err) {
    console.error('Failed to debug:', err.message);
    process.exit(1);
  }
}

main();
