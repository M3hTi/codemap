#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { scanDirectory } = require('./lib/scanner');
const { generateMarkdown } = require('./lib/markdown-generator');
const { buildTree } = require('./lib/tree-builder');

/**
 * Check if the current directory is a project root
 * @param {string} dirPath - Directory path to check
 * @returns {boolean}
 */
function isProjectRoot(dirPath) {
  const gitPath = path.join(dirPath, '.git');
  const packageJsonPath = path.join(dirPath, 'package.json');

  return fs.existsSync(gitPath) || fs.existsSync(packageJsonPath);
}

/**
 * Main CLI function
 */
async function main() {
  try {
    console.log('🗺️  CodeMap - Scanning your project...\n');

    const currentDir = process.cwd();
    const isRoot = isProjectRoot(currentDir);

    console.log(`📂 Working directory: ${currentDir}`);
    console.log(`📍 Project root detected: ${isRoot ? 'Yes' : 'No'}\n`);

    // Scan the directory for code files
    console.log('🔍 Scanning files...');
    const scannedFiles = scanDirectory(currentDir);

    if (scannedFiles.length === 0) {
      console.log('⚠️  No code files found in the current directory.');
      process.exit(0);
    }

    console.log(`✅ Found ${scannedFiles.length} code file(s)\n`);

    // Build project tree from current directory
    console.log('🌳 Building project tree...');
    const projectTree = buildTree(currentDir, scannedFiles);

    // Generate markdown content
    console.log('📝 Generating markdown documentation...');
    const markdownContent = generateMarkdown({
      workingDir: currentDir,
      isProjectRoot: isRoot,
      files: scannedFiles,
      projectTree: projectTree
    });

    // Determine output path
    const outputPath = path.join(currentDir, 'CODEMAP.md');

    // Write markdown file
    fs.writeFileSync(outputPath, markdownContent, 'utf8');

    console.log(`\n✨ Success! Documentation generated at:`);
    console.log(`   ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the CLI
main();
