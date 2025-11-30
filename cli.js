#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { scanDirectory } = require('./lib/scanner');
const { generateMarkdown } = require('./lib/markdown-generator');
const { buildTree } = require('./lib/tree-builder');
const { parseArgs, displayHelp } = require('./lib/cli-parser');
const { loadConfig, mergeConfigs } = require('./lib/config-loader');
const { calculateStatistics } = require('./lib/statistics');
const { getGitInfo, getFileGitInfo } = require('./lib/git-integration');
const { processContent } = require('./lib/content-processor');
const { formatAsJSON, formatAsHTML } = require('./lib/output-formatter');

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
 * Get appropriate file extension for format
 * @param {string} format - Output format
 * @returns {string} File extension
 */
function getFileExtension(format) {
  switch (format) {
    case 'json':
      return '.json';
    case 'html':
      return '.html';
    default:
      return '.md';
  }
}

/**
 * Main CLI function
 */
async function main() {
  try {
    // Parse CLI arguments
    const cliOptions = parseArgs();

    // Show help if requested
    if (cliOptions.help) {
      displayHelp();
      process.exit(0);
    }

    console.log('🗺️  CodeMap - Scanning your project...\n');

    const currentDir = process.cwd();

    // Load configuration file
    const fileConfig = loadConfig(currentDir);

    // Merge configurations (CLI takes precedence)
    const options = fileConfig ? mergeConfigs(fileConfig, cliOptions) : cliOptions;

    const isRoot = isProjectRoot(currentDir);

    console.log(`📂 Working directory: ${currentDir}`);
    console.log(`📍 Project root detected: ${isRoot ? 'Yes' : 'No'}`);

    // Show active options
    if (options.filter) {
      console.log(`🔍 Filtering: ${options.filter.join(', ')}`);
    }
    if (options.exclude) {
      console.log(`🚫 Excluding: ${options.exclude.join(', ')}`);
    }
    if (options.format !== 'markdown') {
      console.log(`📄 Format: ${options.format}`);
    }
    console.log('');

    // Scan the directory for code files
    console.log('🔍 Scanning files...');
    const scannedFiles = scanDirectory(currentDir, {
      maxSize: options.maxSize,
      filter: options.filter,
      exclude: options.exclude,
      depth: options.depth,
      ignoreDirs: options.ignoreDirs
    });

    if (scannedFiles.length === 0) {
      console.log('⚠️  No code files found in the current directory.');
      process.exit(0);
    }

    console.log(`✅ Found ${scannedFiles.length} code file(s)\n`);

    // Process file contents (redaction, truncation)
    if (options.redact || options.truncate) {
      console.log('🔒 Processing file contents...');
      scannedFiles.forEach(file => {
        const processed = processContent(file.content, {
          redact: options.redact,
          truncate: options.truncate,
          truncateLines: options.truncateLines
        });

        file.content = processed.content;
        file.processed = processed.metadata;
      });
    }

    // Get git information
    let gitInfo = null;
    if (options.git) {
      console.log('📜 Fetching git information...');
      gitInfo = getGitInfo(currentDir);

      // Get per-file git info
      if (gitInfo) {
        scannedFiles.forEach(file => {
          file.gitInfo = getFileGitInfo(file.path, currentDir);
        });
      }
    }

    // Calculate statistics
    let statistics = null;
    if (options.stats) {
      console.log('📊 Calculating statistics...');
      statistics = calculateStatistics(scannedFiles);
    }

    // Build project tree from current directory
    console.log('🌳 Building project tree...');
    const projectTree = buildTree(currentDir, scannedFiles);

    // Generate content based on format
    console.log('📝 Generating documentation...');

    let outputContent;
    let outputExt = getFileExtension(options.format);

    const data = {
      workingDir: currentDir,
      isProjectRoot: isRoot,
      files: scannedFiles,
      projectTree: projectTree,
      statistics: statistics,
      gitInfo: gitInfo,
      noContent: options.noContent
    };

    switch (options.format) {
      case 'json':
        outputContent = formatAsJSON(data);
        break;

      case 'html':
        outputContent = formatAsHTML(data);
        break;

      default:
        outputContent = generateMarkdown(data);
        break;
    }

    // Determine output path
    let outputPath = options.output;

    // If output doesn't have an extension, add the appropriate one
    if (!path.extname(outputPath)) {
      outputPath = outputPath.replace(/\.[^.]+$/, '') + outputExt;
    } else if (path.extname(outputPath) !== outputExt) {
      // If extension doesn't match format, replace it
      outputPath = outputPath.replace(/\.[^.]+$/, outputExt);
    }

    // Make output path absolute if it's relative
    if (!path.isAbsolute(outputPath)) {
      outputPath = path.join(currentDir, outputPath);
    }

    // Write output file
    try {
      fs.writeFileSync(outputPath, outputContent, 'utf8');
      console.log(`\n✨ Success! Documentation generated at:`);
      console.log(`   ${outputPath}`);

      // Show summary
      console.log(`\n📋 Summary:`);
      console.log(`   - Files: ${scannedFiles.length}`);
      if (statistics) {
        console.log(`   - Lines: ${statistics.totalLines.toLocaleString()}`);
        console.log(`   - Size: ${formatFileSize(statistics.totalSize)}`);
        console.log(`   - Languages: ${Object.keys(statistics.byLanguage).length}`);
      }
      if (options.redact) {
        console.log(`   - Redacted: ✓`);
      }
      if (options.truncate) {
        console.log(`   - Truncated: ✓`);
      }
      console.log('');

    } catch (writeError) {
      if (writeError.code === 'EACCES') {
        console.error('❌ Permission denied: Cannot write to the current directory');
      } else if (writeError.code === 'ENOSPC') {
        console.error('❌ No space left on device: Cannot write file');
      } else if (writeError.code === 'EROFS') {
        console.error('❌ Read-only file system: Cannot write file');
      } else {
        console.error('❌ Error writing file:', writeError.message);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

// Run the CLI
main();
