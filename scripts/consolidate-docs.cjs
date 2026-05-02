#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

function extractSkillFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    // No frontmatter found, extract from first heading
    const headingMatch = content.match(/^#\s+(.+)$/m);
    const name = headingMatch ? headingMatch[1] : 'Unknown Skill';
    return { name, description: '', content };
  }
  
  const frontmatter = match[1];
  const markdownContent = match[2];
  
  // Parse YAML frontmatter
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
  
  const name = nameMatch ? nameMatch[1].trim() : 'Unknown Skill';
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';
  
  return { name, description, content: markdownContent };
}

function readSkills() {
  const skillsDir = path.join(rootDir, '.windsurf', 'skills');
  const skills = [];
  
  if (!fs.existsSync(skillsDir)) {
    console.error('Skills directory not found:', skillsDir);
    return skills;
  }
  
  const skillFolders = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();
  
  for (const folder of skillFolders) {
    const skillFile = path.join(skillsDir, folder, 'skill.md');
    if (fs.existsSync(skillFile)) {
      const content = fs.readFileSync(skillFile, 'utf-8');
      const { name, description, content: markdownContent } = extractSkillFrontmatter(content);
      skills.push({ name, description, content: markdownContent });
    }
  }
  
  return skills;
}

function readRules() {
  const rulesDir = path.join(rootDir, '.windsurf', 'rules');
  const rules = [];
  
  if (!fs.existsSync(rulesDir)) {
    console.error('Rules directory not found:', rulesDir);
    return rules;
  }
  
  const ruleFiles = fs.readdirSync(rulesDir)
    .filter(file => file.endsWith('.md'))
    .sort();
  
  for (const file of ruleFiles) {
    const filePath = path.join(rulesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    rules.push({ filename: file, content });
  }
  
  return rules;
}

function generateSkillsMarkdown(skills) {
  let markdown = '# Skills\n\n';
  markdown += 'This document consolidates all available skills in the Apex Unified Suite development environment.\n\n';
  markdown += `Generated on: ${new Date().toISOString().split('T')[0]}\n\n`;
  markdown += `Total Skills: ${skills.length}\n\n`;
  markdown += '---\n\n';
  
  for (const skill of skills) {
    markdown += `## ${skill.name}\n\n`;
    
    if (skill.description) {
      markdown += `**Description:** ${skill.description}\n\n`;
    }
    
    markdown += skill.content.trim();
    markdown += '\n\n---\n\n';
  }
  
  return markdown;
}

function generateRulesMarkdown(rules) {
  let markdown = '# Rules\n\n';
  markdown += 'This document consolidates all development rules and guidelines for the Apex Unified Suite.\n\n';
  markdown += `Generated on: ${new Date().toISOString().split('T')[0]}\n\n`;
  markdown += `Total Rules: ${rules.length}\n\n`;
  markdown += '---\n\n';
  
  for (const rule of rules) {
    // Extract title from first heading or filename
    const titleMatch = rule.content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : rule.filename.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    markdown += `## ${title}\n\n`;
    markdown += `**File:** \`.windsurf/rules/${rule.filename}\`\n\n`;
    
    // Remove the first heading line to avoid duplication
    const contentWithoutHeading = rule.content.replace(/^#\s+.+$/m, '').trim();
    markdown += contentWithoutHeading;
    markdown += '\n\n---\n\n';
  }
  
  return markdown;
}

function main() {
  console.log('Consolidating skills and rules...');
  
  try {
    // Read skills and rules
    const skills = readSkills();
    const rules = readRules();
    
    console.log(`Found ${skills.length} skills and ${rules.length} rules`);
    
    // Generate markdown
    const skillsMarkdown = generateSkillsMarkdown(skills);
    const rulesMarkdown = generateRulesMarkdown(rules);
    
    // Write to files
    const skillsOutputPath = path.join(rootDir, 'SKILLS.md');
    const rulesOutputPath = path.join(rootDir, 'RULES.md');
    
    fs.writeFileSync(skillsOutputPath, skillsMarkdown, 'utf-8');
    fs.writeFileSync(rulesOutputPath, rulesMarkdown, 'utf-8');
    
    console.log(`✅ Skills consolidated to: ${skillsOutputPath}`);
    console.log(`✅ Rules consolidated to: ${rulesOutputPath}`);
    
    // Print summary
    console.log('\n📊 Summary:');
    console.log(`   Skills: ${skills.length}`);
    console.log(`   Rules: ${rules.length}`);
    console.log(`   Total lines: ${skillsMarkdown.split('\n').length + rulesMarkdown.split('\n').length}`);
    
  } catch (error) {
    console.error('❌ Error during consolidation:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
