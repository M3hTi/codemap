const fs = require('fs');
const path = require('path');

/**
 * Configuration constants
 */
const MAX_FILE_SIZE = 1024 * 1024; // 1MB - Maximum file size to read

/**
 * List of code file extensions to scan
 */
const CODE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx',
  '.py', '.java', '.cpp', '.c', '.h', '.hpp',
  '.cs', '.go', '.rs', '.rb', '.php',
  '.swift', '.kt', '.scala', '.sh', '.bash',
  '.sql', '.r', '.m', '.mm', '.dart',
  '.vue', '.svelte', '.html', '.css', '.scss',
  '.json', '.xml', '.yaml', '.yml', '.toml',
  '.md', '.txt', '.env.example'
];

/**
 * Directories to ignore during scanning
 */
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  'target',
  'bin',
  'obj',
  '.next',
  '.nuxt',
  '.cache',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv',
  'env',
  '.idea',
  '.vscode'
];

/**
 * Files to ignore during scanning
 */
const IGNORE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.DS_Store',
  'Thumbs.db',
  '.env',
  '.env.local',
  '.env.production'
];

/**
 * Check if a file should be scanned
 * @param {string} filePath - Path to the file
 * @param {Object} options - Scan options
 * @returns {boolean}
 */
function shouldScanFile(filePath, options = {}) {
  const fileName = path.basename(filePath);

  // Check if file is in ignore list
  if (IGNORE_FILES.includes(fileName)) {
    return false;
  }

  // Check if file matches exclude patterns
  if (matchesExclude(filePath, options.exclude)) {
    return false;
  }

  // Check if file matches filter criteria
  return matchesFilter(filePath, options);
}

/**
 * Check if a directory should be scanned
 * @param {string} dirName - Directory name
 * @param {Array} additionalIgnores - Additional directories to ignore
 * @returns {boolean}
 */
function shouldScanDirectory(dirName, additionalIgnores = []) {
  return !IGNORE_DIRS.includes(dirName) && !additionalIgnores.includes(dirName);
}

/**
 * Read file content safely with detailed error handling
 * @param {string} filePath - Path to the file
 * @param {number} maxSize - Maximum file size
 * @returns {string}
 */
function readFileContent(filePath, maxSize = MAX_FILE_SIZE) {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;

    // Skip very large files
    if (fileSizeInBytes > maxSize) {
      return `[File too large to display: ${(fileSizeInBytes / 1024 / 1024).toFixed(2)} MB]`;
    }

    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    // Provide specific error messages based on error code
    if (error.code === 'EACCES') {
      return `[Permission denied: Cannot read file]`;
    } else if (error.code === 'ENOENT') {
      return `[File not found: File may have been deleted]`;
    } else if (error.code === 'EISDIR') {
      return `[Error: Path is a directory, not a file]`;
    } else if (error.message.includes('ENAMETOOLONG')) {
      return `[Error: File path too long]`;
    } else {
      return `[Error reading file: ${error.message}]`;
    }
  }
}

/**
 * Recursively scan directory for code files
 * @param {string} dirPath - Directory path to scan
 * @param {string} basePath - Base path for calculating relative paths
 * @param {Array} results - Array to store results
 * @param {Object} options - Scan options
 * @param {number} currentDepth - Current depth in directory tree
 * @returns {Array}
 */
function scanDirectoryRecursive(dirPath, basePath = dirPath, results = [], options = {}, currentDepth = 0) {
  // Check depth limit
  if (options.depth !== null && currentDepth > options.depth) {
    return results;
  }

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          if (shouldScanDirectory(entry.name, options.ignoreDirs)) {
            scanDirectoryRecursive(fullPath, basePath, results, options, currentDepth + 1);
          }
        } else if (entry.isFile()) {
          // Add file if it should be scanned
          if (shouldScanFile(fullPath, options)) {
            // Normalize path separators to forward slashes for cross-platform consistency
            const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');
            const content = readFileContent(fullPath, options.maxSize);

            // Get file size safely
            let fileSize = 0;
            try {
              fileSize = fs.statSync(fullPath).size;
            } catch (sizeError) {
              console.warn(`   Warning: Could not get size for ${relativePath}`);
            }

            results.push({
              path: fullPath,
              relativePath: relativePath,
              name: entry.name,
              extension: path.extname(entry.name),
              content: content,
              size: fileSize
            });
          }
        } else if (entry.isSymbolicLink()) {
          // Skip symbolic links to avoid circular references
          console.warn(`   Warning: Skipping symbolic link ${entry.name}`);
        }
      } catch (entryError) {
        // Handle individual file/directory errors without stopping the scan
        console.warn(`   Warning: Error processing ${entry.name}: ${entryError.message}`);
      }
    }
  } catch (error) {
    // Provide specific error messages for directory access issues
    if (error.code === 'EACCES') {
      console.error(`   Permission denied: Cannot access directory ${dirPath}`);
    } else if (error.code === 'ENOENT') {
      console.error(`   Directory not found: ${dirPath}`);
    } else {
      console.error(`   Error scanning directory ${dirPath}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Scan a directory and return all code files
 * @param {string} dirPath - Directory path to scan
 * @param {Object} options - Scan options
 * @returns {Array}
 */
function scanDirectory(dirPath, options = {}) {
  console.log(`   Scanning: ${dirPath}`);

  const scanOptions = {
    maxSize: options.maxSize || MAX_FILE_SIZE,
    filter: options.filter || null,
    exclude: options.exclude || null,
    depth: options.depth || null,
    ignoreDirs: options.ignoreDirs || []
  };

  return scanDirectoryRecursive(dirPath, dirPath, [], scanOptions, 0);
}

/**
 * Check if file matches filter criteria
 * @param {string} filePath - File path
 * @param {Object} options - Scan options
 * @returns {boolean}
 */
function matchesFilter(filePath, options) {
  const ext = path.extname(filePath).toLowerCase();

  // If filter is specified, only include matching extensions
  if (options.filter && options.filter.length > 0) {
    return options.filter.includes(ext);
  }

  // Otherwise use default code extensions
  return CODE_EXTENSIONS.includes(ext);
}

/**
 * Check if file matches exclude patterns
 * @param {string} filePath - File path
 * @param {Array} excludePatterns - Exclude patterns
 * @returns {boolean}
 */
function matchesExclude(filePath, excludePatterns) {
  if (!excludePatterns || excludePatterns.length === 0) {
    return false;
  }

  const fileName = path.basename(filePath);
  const relativePath = filePath.replace(/\\/g, '/');

  return excludePatterns.some(pattern => {
    // Simple wildcard matching
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(regexPattern);
    return regex.test(fileName) || regex.test(relativePath);
  });
}

module.exports = {
  scanDirectory,
  MAX_FILE_SIZE,
  CODE_EXTENSIONS,
  IGNORE_DIRS,
  IGNORE_FILES
};
