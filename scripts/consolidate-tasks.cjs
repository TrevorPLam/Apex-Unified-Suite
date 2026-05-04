#!/usr/bin/env node

/**
 * Consolidate all TODO-*.md task files into a single master document
 * 
 * This script:
 * - Discovers all TODO-*.md files in the tasks/ directory
 * - Generates a table of contents organized by priority
 * - Preserves original file content and structure
 * - Adds metadata and statistics
 * - Creates a readable master document for project overview
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TASKS_DIR = path.join(__dirname, '..', 'tasks');
const OUTPUT_FILE = path.join(__dirname, '..', 'TASKS-MASTER.md');
const TASK_FILE_PATTERN = /^TODO-P(\d+)-(.+)\.md$/;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Discover all task files and sort by priority and name
 */
function discoverTaskFiles() {
  log('Discovering task files...', 'blue');
  
  const files = fs.readdirSync(TASKS_DIR)
    .filter(file => TASK_FILE_PATTERN.test(file))
    .map(file => {
      const match = file.match(TASK_FILE_PATTERN);
      const priority = parseInt(match[1]);
      const name = match[2];
      const filePath = path.join(TASKS_DIR, file);
      const stats = fs.statSync(filePath);
      
      return {
        filename: file,
        priority,
        name,
        filePath,
        size: stats.size,
        modified: stats.mtime,
        displayName: `P${priority}-${name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
      };
    })
    .sort((a, b) => {
      // Sort by priority first, then by name
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.name.localeCompare(b.name);
    });

  log(`Found ${files.length} task files`, 'green');
  return files;
}

/**
 * Read and parse a task file
 */
function readTaskFile(taskFile) {
  const content = fs.readFileSync(taskFile.filePath, 'utf8');
  
  // Extract title from first line
  const lines = content.split('\n');
  const titleLine = lines.find(line => line.startsWith('# ')) || `# ${taskFile.displayName}`;
  
  // Extract description (text after title until first task)
  const titleIndex = lines.indexOf(titleLine);
  const descriptionLines = [];
  
  for (let i = titleIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '---' || line.startsWith('## [ ]')) {
      break;
    }
    if (line && !line.startsWith('#')) {
      descriptionLines.push(line);
    }
  }
  
  const description = descriptionLines.join(' ').replace(/\s+/g, ' ').trim();
  
  return {
    title: titleLine.replace(/^# /, ''),
    description,
    content,
    lines: lines.length
  };
}

/**
 * Generate table of contents
 */
function generateTableOfContents(taskFiles) {
  const sections = {};
  
  // Group by priority
  taskFiles.forEach(file => {
    if (!sections[file.priority]) {
      sections[file.priority] = [];
    }
    sections[file.priority].push(file);
  });

  let toc = '# Table of Contents\n\n';
  
  // Generate sections by priority
  Object.keys(sections)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach(priority => {
      const priorityName = getPriorityName(parseInt(priority));
      toc += `## ${priorityName}\n\n`;
      
      sections[priority].forEach(file => {
        const anchor = file.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        toc += `- [${file.displayName}](#${anchor})\n`;
      });
      
      toc += '\n';
    });

  return toc;
}

function getPriorityName(priority) {
  const names = {
    0: 'Priority 0 - Foundation',
    1: 'Priority 1 - Core Infrastructure',
    2: 'Priority 2 - Domain Foundations',
    3: 'Priority 3 - Core Features',
    4: 'Priority 4 - Advanced Features',
    5: 'Priority 5 - Implementation',
    10: 'Priority 10 - AI & Advanced Analytics'
  };
  return names[priority] || `Priority ${priority}`;
}

/**
 * Generate statistics
 */
function generateStatistics(taskFiles, taskData) {
  const totalTasks = taskData.reduce((sum, data) => {
    const taskMatches = data.content.match(/## \[ \]/g);
    return sum + (taskMatches ? taskMatches.length : 0);
  }, 0);

  const completedTasks = taskData.reduce((sum, data) => {
    const completedMatches = data.content.match(/## \[x\]/g);
    return sum + (completedMatches ? completedMatches.length : 0);
  }, 0);

  const stats = {
    totalFiles: taskFiles.length,
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0',
    priorities: [...new Set(taskFiles.map(f => f.priority))].sort((a, b) => a - b),
    totalSize: taskFiles.reduce((sum, f) => sum + f.size, 0)
  };

  return stats;
}

/**
 * Generate the master document
 */
function generateMasterDocument(taskFiles) {
  log('Reading task files and generating content...', 'blue');
  
  const taskData = taskFiles.map(file => readTaskFile(file));
  const stats = generateStatistics(taskFiles, taskData);
  const toc = generateTableOfContents(taskFiles);
  
  let content = `# Apex Unified Suite - Master Task Document

> **Generated on:** ${new Date().toISOString().split('T')[0]} at ${new Date().toLocaleTimeString()}
> **Total Files:** ${stats.totalFiles} | **Total Tasks:** ${stats.totalTasks} | **Completed:** ${stats.completedTasks} (${stats.completionRate}%)
> **File Size:** ${(stats.totalSize / 1024).toFixed(1)} KB

---

## Overview

This document consolidates all task files from the \`tasks/\` directory into a single master document for easy navigation and project overview. Each task file contains detailed implementation tasks organized by priority level.

### Quick Statistics

- **Total Task Files:** ${stats.totalFiles}
- **Total Individual Tasks:** ${stats.totalTasks}
- **Completed Tasks:** ${stats.completedTasks}
- **Completion Rate:** ${stats.completionRate}%
- **Priority Levels:** ${stats.priorities.length} (P${stats.priorities.join(', P')})
- **Document Size:** ${(stats.totalSize / 1024).toFixed(1)} KB

### Priority Legend

- **P0:** Foundation - Critical architecture and infrastructure
- **P1:** Core Infrastructure - Authentication, APIs, basic services
- **P2:** Domain Foundations - Core business domain setup
- **P3:** Core Features - Primary functionality implementation
- **P4:** Advanced Features - Extended capabilities
- **P5:** Implementation - Detailed feature completion
- **P10:** AI & Advanced Analytics - AI-powered features

---

`;

  // Add table of contents
  content += toc;
  
  // Add separator
  content += `---

# Task Files Documentation

`;

  // Add each task file
  taskFiles.forEach((file, index) => {
    const data = taskData[index];
    const anchor = file.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    content += `---

## ${data.title}

<a id="${anchor}"></a>

**File:** \`${file.filename}\`  
**Priority:** P${file.priority}  
**Size:** ${file.size} bytes | **Lines:** ${data.lines}  
**Modified:** ${file.modified.toLocaleDateString()}

**Description:** ${data.description}

---

### Full Content

\`\`\`markdown
${data.content}
\`\`\`

---

`;

  });

  // Add footer
  content += `---

## Regeneration Instructions

This is a generated file. To regenerate this master document:

\`\`\`bash
# Run the consolidation script
node scripts/consolidate-tasks.cjs

# Or use the convenience script (if added to package.json)
pnpm run consolidate-tasks
\`\`\`

**Note:** Do not edit this file directly. Edit individual task files in the \`tasks/\` directory instead.

---

*Document generated by consolidate-tasks.cjs*`;

  return content;
}

/**
 * Write the master document
 */
function writeMasterDocument(content) {
  log('Writing master document...', 'blue');
  
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  
  const stats = fs.statSync(OUTPUT_FILE);
  log(`Master document created: ${OUTPUT_FILE}`, 'green');
  log(`Size: ${(stats.size / 1024).toFixed(1)} KB`, 'cyan');
}

/**
 * Main execution
 */
function main() {
  try {
    log('🚀 Starting task consolidation...', 'yellow');
    log(`Tasks directory: ${TASKS_DIR}`, 'blue');
    log(`Output file: ${OUTPUT_FILE}`, 'blue');
    
    // Discover task files
    const taskFiles = discoverTaskFiles();
    
    if (taskFiles.length === 0) {
      log('No task files found!', 'yellow');
      return;
    }
    
    // Generate master document
    const content = generateMasterDocument(taskFiles);
    
    // Write to file
    writeMasterDocument(content);
    
    log('✅ Task consolidation completed successfully!', 'green');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, discoverTaskFiles, generateMasterDocument };
