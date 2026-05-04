#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, '..', 'tasks', '00.TODO-MASTER-TRACKER.json');

function loadTasks() {
  const data = fs.readFileSync(TASKS_FILE, 'utf8');
  return JSON.parse(data);
}

function validateTasks(data) {
  const errors = [];
  const warnings = [];
  const taskIds = new Set();
  const dependencyGraph = new Map();
  
  // Collect all task IDs
  for (const task of data.tasks) {
    if (taskIds.has(task.id)) {
      errors.push(`Duplicate task ID: ${task.id}`);
    }
    taskIds.add(task.id);
    dependencyGraph.set(task.id, task.dependencies || []);
  }
  
  // Validate dependencies
  for (const task of data.tasks) {
    for (const dep of task.dependencies || []) {
      if (!taskIds.has(dep)) {
        errors.push(`Task ${task.id} has unresolved dependency: ${dep}`);
      }
    }
  }
  
  // Detect circular dependencies
  const visited = new Set();
  const recursionStack = new Set();
  
  function hasCycle(node, path = []) {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart).concat(node);
      errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
      return true;
    }
    if (visited.has(node)) return false;
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    for (const dep of dependencyGraph.get(node) || []) {
      if (taskIds.has(dep)) {
        hasCycle(dep, [...path]);
      }
    }
    
    recursionStack.delete(node);
    return false;
  }
  
  for (const taskId of taskIds) {
    hasCycle(taskId);
  }
  
  // Find orphaned tasks (no deps, nothing depends on them)
  const referenced = new Set();
  for (const [id, deps] of dependencyGraph) {
    for (const dep of deps) {
      referenced.add(dep);
    }
  }
  
  for (const task of data.tasks) {
    const hasDeps = task.dependencies && task.dependencies.length > 0;
    const isReferenced = referenced.has(task.id);
    
    if (!hasDeps && !isReferenced && task.id !== 'DEP-001' && task.id !== 'TOOLING-001') {
      warnings.push(`Orphaned task (no deps, not referenced): ${task.id}`);
    }
  }
  
  return { errors, warnings, taskCount: taskIds.size };
}

function findLongestPath(startId, dependencyGraph, visited = new Set()) {
  const deps = dependencyGraph.get(startId) || [];
  if (deps.length === 0 || visited.has(startId)) return [startId];
  
  visited.add(startId);
  let longest = [startId];
  
  for (const dep of deps) {
    const path = findLongestPath(dep, dependencyGraph, new Set(visited));
    if (path.length + 1 > longest.length) {
      longest = [startId, ...path];
    }
  }
  
  return longest;
}

function main() {
  try {
    const data = loadTasks();
    const { errors, warnings, taskCount } = validateTasks(data);
    
    console.log(`Validated ${taskCount} tasks\n`);
    
    if (errors.length > 0) {
      console.log('ERRORS:');
      errors.forEach(e => console.log(`  ❌ ${e}`));
    }
    
    if (warnings.length > 0) {
      console.log('\nWARNINGS:');
      warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All validations passed!');
    }
    
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (err) {
    console.error('Failed to validate:', err.message);
    process.exit(1);
  }
}

main();
