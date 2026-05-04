import fs from 'fs';
const data = JSON.parse(fs.readFileSync('tasks/00.TODO-MASTER-TRACKER.json'));

// Generate DOT format for Graphviz
let dot = 'digraph Tasks {\n';
dot += '  rankdir=TB;\n';
dot += '  node [shape=box];\n\n';

// Group by phase
const phases = {};
for (const task of data.tasks) {
  if (!phases[task.phase]) phases[task.phase] = [];
  phases[task.phase].push(task);
}

// Add subgraphs for each phase
for (const [phase, tasks] of Object.entries(phases)) {
  dot += `  subgraph cluster_${phase} {\n`;
  dot += `    label="${phase}";\n`;
  dot += `    style=filled;\n`;
  dot += `    color=lightgrey;\n`;
  
  for (const task of tasks) {
    const color = task.type === 'milestone' ? 'gold' : 'white';
    dot += `    "${task.id}" [label="${task.id}\\n${task.description.substring(0, 20)}...", fillcolor=${color}];\n`;
  }
  dot += '  }\n\n';
}

// Add edges
for (const task of data.tasks) {
  for (const dep of task.dependencies || []) {
    dot += `  "${dep}" -> "${task.id}";\n`;
  }
}

dot += '}';

fs.writeFileSync('tasks/dependency-graph.dot', dot);
console.log('Generated tasks/dependency-graph.dot');
console.log('To visualize: dot -Tpng tasks/dependency-graph.dot -o tasks/dependency-graph.png');
