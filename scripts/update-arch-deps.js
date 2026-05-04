import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASKS_FILE = path.join(__dirname, '..', 'tasks', '00.TODO-MASTER-TRACKER.json');

function updateArchDependencies() {
  const data = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  
  // Find tasks depending on ARCH-001
  const dependentTasks = data.tasks.filter(t => 
    t.dependencies && t.dependencies.includes('ARCH-001')
  );
  
  console.log('Tasks depending on ARCH-001:');
  dependentTasks.forEach(t => {
    console.log(`  ${t.id}: ${t.description}`);
  });
  
  // Update dependencies - for service tasks, use ARCH-001.3 (schema design)
  // since they need the schema design to be complete
  dependentTasks.forEach(task => {
    const archIndex = task.dependencies.indexOf('ARCH-001');
    if (archIndex !== -1) {
      // Service and repository tasks should depend on schema design
      if (task.description.includes('Service') || task.description.includes('Repository')) {
        task.dependencies[archIndex] = 'ARCH-001.3';
      } else {
        // Other tasks can depend on the implementation guide
        task.dependencies[archIndex] = 'ARCH-001.4';
      }
    }
  });
  
  // Write back to file
  fs.writeFileSync(TASKS_FILE, JSON.stringify(data, null, 2));
  
  console.log('\nUpdated dependencies:');
  dependentTasks.forEach(t => {
    const archDep = t.dependencies.find(d => d.startsWith('ARCH-001.'));
    console.log(`  ${t.id}: now depends on ${archDep}`);
  });
}

updateArchDependencies();
