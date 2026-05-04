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

function analyzeTaskSize() {
  const data = loadTasks();
  
  const oversizedThresholds = {
    'ADR': 3,  // ADR tasks should be small
    'Milestone': 10, // Milestones can be larger
    'Service': 5,
    'default': 5
  };

  const suspects = data.tasks.filter(t => {
    const desc = t.description.toLowerCase();
    let threshold = oversizedThresholds.default;
    
    if (desc.includes('adr')) threshold = oversizedThresholds.ADR;
    else if (t.type === 'milestone') threshold = oversizedThresholds.Milestone;
    else if (desc.includes('service')) threshold = oversizedThresholds.Service;
    
    // Heuristic: long description suggests complexity
    const complexity = t.description.length / 20 + (t.dependencies?.length || 0);
    
    return complexity > threshold;
  }).map(t => ({
    id: t.id,
    description: t.description,
    complexity: (t.description.length / 20 + (t.dependencies?.length || 0)).toFixed(1),
    type: t.type || 'task',
    dependencies: t.dependencies?.length || 0
  }));

  console.log('Potentially oversized tasks:');
  console.log('================================');
  suspects.forEach(s => {
    console.log(`  ${s.id} (complexity: ${s.complexity}, type: ${s.type}, deps: ${s.dependencies})`);
    console.log(`    ${s.description.substring(0, 100)}${s.description.length > 100 ? '...' : ''}`);
    console.log('');
  });

  // Also show some statistics
  const totalTasks = data.tasks.length;
  const avgComplexity = data.tasks.reduce((sum, t) => 
    sum + (t.description.length / 20 + (t.dependencies?.length || 0)), 0) / totalTasks;
  
  console.log(`\nStatistics:`);
  console.log(`Total tasks: ${totalTasks}`);
  console.log(`Average complexity: ${avgComplexity.toFixed(1)}`);
  console.log(`Tasks above threshold: ${suspects.length}`);
  
  return suspects;
}

analyzeTaskSize();
