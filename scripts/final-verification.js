#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASKS_FILE = path.join(__dirname, '..', 'tasks', '00.TODO-MASTER-TRACKER.json');

function main() {
  try {
    const data = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
    
    console.log('=== FINAL VERIFICATION REPORT ===\n');
    
    // Count tasks
    console.log('Task Counts:');
    console.log(`  Total tasks: ${data.tasks.length}`);
    console.log(`  Milestones: ${data.tasks.filter(t => t.type === 'milestone').length}`);
    console.log(`  Parent tasks: ${data.tasks.filter(t => t.type === 'parent').length}`);
    console.log(`  Regular tasks: ${data.tasks.filter(t => !t.type || t.type === 'task').length}`);
    
    // Check for abstract markers
    const content = fs.readFileSync(TASKS_FILE, 'utf8');
    const abstractMarkers = content.match(/(ALL_PHASE|ALL_CRUD|DB-MIGRATE-ALL)/g);
    if (abstractMarkers) {
      console.log('\n⚠️  Abstract markers found:', abstractMarkers.length);
      abstractMarkers.forEach(marker => console.log(`  - ${marker}`));
    } else {
      console.log('\n✅ No abstract markers found');
    }
    
    // Check for missing required fields
    const missingFields = data.tasks.filter(t => !t.id || !t.phase || t.wave === undefined || t.wave === null || !t.description || !t.status);
    if (missingFields.length > 0) {
      console.log('\n❌ Tasks missing required fields:', missingFields.length);
      missingFields.forEach(t => console.log(`  - ${t.id}: ${t.description}`));
    } else {
      console.log('\n✅ All tasks have required fields');
    }
    
    // Check JSON validity
    try {
      JSON.parse(content);
      console.log('✅ JSON is valid');
    } catch (e) {
      console.log('❌ JSON is invalid:', e.message);
    }
    
    console.log('\n=== VERIFICATION COMPLETE ===');
    
  } catch (err) {
    console.error('Failed to run verification:', err.message);
    process.exit(1);
  }
}

main();
