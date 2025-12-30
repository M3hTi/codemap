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
const { createSpinner, createProgressBar } = require('./lib/progress');
const { runInteractiveMode } = require('./lib/interactive');
const { startWatcher, logWatchEvent } = require('./lib/watcher');

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
 * Log function that respects output format
 * For JSON/HTML output, always use stderr to allow clean stdout redirection
 * @param {string} message - Message to log
 * @param {Object} options - Options object
 */
function log(message, options) {
  // Always use stderr for JSON/HTML to allow clean stdout redirection
  if (options.format === 'json' || options.format === 'html') {
    console.error(message);
  } else {
    console.log(message);
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

/**
 * Generate documentation for a project
 * @param {string} currentDir - Directory to scan
 * @param {Object} options - Configuration options
 * @param {boolean} isWatchMode - Whether running in watch mode
 * @returns {Promise<boolean>} Success status
 */
async function generateDocumentation(currentDir, options, isWatchMode = false) {
  try {
    const isRoot = isProjectRoot(currentDir);

    if (!isWatchMode) {
      log('🗺️  CodeMap - Scanning your project...\n', options);
      log(`📂 Working directory: ${currentDir}`, options);
      log(`📍 Project root detected: ${isRoot ? 'Yes' : 'No'}`, options);

      // Show active options
      if (options.filter) {
        log(`🔍 Filtering: ${options.filter.join(', ')}`, options);
      }
      if (options.exclude) {
        log(`🚫 Excluding: ${options.exclude.join(', ')}`, options);
      }
      if (options.format !== 'markdown') {
        log(`📄 Format: ${options.format}`, options);
      }
      log('', options);
    }

    // Scan the directory for code files with progress indicator
    const scanSpinner = createSpinner('Scanning files');
    scanSpinner.start();

    const scannedFiles = scanDirectory(currentDir, {
      maxSize: options.maxSize,
      filter: options.filter,
      exclude: options.exclude,
      depth: options.depth,
      ignoreDirs: options.ignoreDirs
    });

    if (scannedFiles.length === 0) {
      scanSpinner.fail('No code files found');
      if (!isWatchMode) {
        log('⚠️  No code files found in the current directory.', options);
      }
      return false;
    }

    scanSpinner.succeed(`Found ${scannedFiles.length} code file(s)`);

    // Process file contents (redaction, truncation) with progress
    if (options.redact || options.truncate) {
      const processProgress = createProgressBar(scannedFiles.length, 'Processing files');
      processProgress.start();

      scannedFiles.forEach((file, index) => {
        const processed = processContent(file.content, {
          redact: options.redact,
          truncate: options.truncate,
          truncateLines: options.truncateLines
        });

        file.content = processed.content;
        file.processed = processed.metadata;
        processProgress.update(index + 1);
      });

      processProgress.succeed('Files processed');
    }

    // Get git information
    let gitInfo = null;
    if (options.git) {
      const gitSpinner = createSpinner('Fetching git information');
      gitSpinner.start();

      gitInfo = getGitInfo(currentDir);

      // Get per-file git info with progress
      if (gitInfo) {
        gitSpinner.succeed('Git repository detected');

        const gitProgress = createProgressBar(scannedFiles.length, 'Getting file history');
        gitProgress.start();

        scannedFiles.forEach((file, index) => {
          file.gitInfo = getFileGitInfo(file.path, currentDir);
          gitProgress.update(index + 1);
        });

        gitProgress.succeed('Git information collected');
      } else {
        gitSpinner.stop('No git repository found');
      }
    }

    // Calculate statistics
    let statistics = null;
    if (options.stats) {
      const statsSpinner = createSpinner('Calculating statistics');
      statsSpinner.start();
      statistics = calculateStatistics(scannedFiles);
      statsSpinner.succeed('Statistics calculated');
    }

    // Build project tree from current directory
    const treeSpinner = createSpinner('Building project tree');
    treeSpinner.start();
    const projectTree = buildTree(currentDir, scannedFiles);
    treeSpinner.succeed('Project tree built');

    // Generate content based on format
    const genSpinner = createSpinner('Generating documentation');
    genSpinner.start();

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

    genSpinner.succeed('Documentation generated');

    // Determine if we should output to stdout or file
    const useStdout = (options.format === 'json' || options.format === 'html') && options.output === 'CODEMAP.md';

    if (useStdout) {
      // Output to stdout for piping/redirection
      console.log(outputContent);

      // Show summary to stderr
      log(`\n📋 Summary:`, options);
      log(`   - Files: ${scannedFiles.length}`, options);
      if (statistics) {
        log(`   - Lines: ${statistics.totalLines.toLocaleString()}`, options);
        log(`   - Size: ${formatFileSize(statistics.totalSize)}`, options);
        log(`   - Languages: ${Object.keys(statistics.byLanguage).length}`, options);
      }
      if (options.redact) {
        log(`   - Redacted: ✓`, options);
      }
      if (options.truncate) {
        log(`   - Truncated: ✓`, options);
      }
      log('', options);

    } else {
      // Write to file
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

        if (isWatchMode) {
          logWatchEvent(`Updated ${path.basename(outputPath)}`, 'success');
        } else {
          log(`\n✨ Success! Documentation generated at:`, options);
          log(`   ${outputPath}`, options);

          // Show summary
          log(`\n📋 Summary:`, options);
          log(`   - Files: ${scannedFiles.length}`, options);
          if (statistics) {
            log(`   - Lines: ${statistics.totalLines.toLocaleString()}`, options);
            log(`   - Size: ${formatFileSize(statistics.totalSize)}`, options);
            log(`   - Languages: ${Object.keys(statistics.byLanguage).length}`, options);
          }
          if (options.redact) {
            log(`   - Redacted: ✓`, options);
          }
          if (options.truncate) {
            log(`   - Truncated: ✓`, options);
          }
          log('', options);
        }

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
        return false;
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    return false;
  }
}

/**
 * Main CLI function
 */
async function main() {
  try {
    // Parse CLI arguments
    let cliOptions = parseArgs();

    // Show help if requested
    if (cliOptions.help) {
      displayHelp();
      process.exit(0);
    }

    const currentDir = process.cwd();

    // Load configuration file
    const fileConfig = loadConfig(currentDir);

    // Merge configurations (CLI takes precedence)
    let options = fileConfig ? mergeConfigs(fileConfig, cliOptions) : cliOptions;

    // Run interactive mode if requested
    if (options.interactive) {
      options = await runInteractiveMode();
      // Preserve watch mode if set via CLI
      options.watch = cliOptions.watch;
    }

    // Watch mode
    if (options.watch) {
      // Initial generation
      const success = await generateDocumentation(currentDir, options, false);

      if (!success) {
        process.exit(1);
      }

      // Start watching
      const watcher = startWatcher(currentDir, async (changedFiles) => {
        logWatchEvent(`${changedFiles.length} file(s) changed`, 'change');
        await generateDocumentation(currentDir, options, true);
      }, {
        ignoreDirs: options.ignoreDirs,
        filter: options.filter,
        debounceMs: 500
      });

      watcher.start();

      // Keep the process running
      process.stdin.resume();

    } else {
      // Single generation
      const success = await generateDocumentation(currentDir, options, false);

      if (!success) {
        process.exit(1);
      }
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

// Run the CLI
main();
