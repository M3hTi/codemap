const fs = require('fs');
const path = require('path');

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
 * @returns {boolean}
 */
function shouldScanFile(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Check if file is in ignore list
  if (IGNORE_FILES.includes(fileName)) {
    return false;
  }

  // Check if file has a code extension
  return CODE_EXTENSIONS.includes(ext);
}

/**
 * Check if a directory should be scanned
 * @param {string} dirName - Directory name
 * @returns {boolean}
 */
function shouldScanDirectory(dirName) {
  return !IGNORE_DIRS.includes(dirName);
}

/**
 * Read file content safely
 * @param {string} filePath - Path to the file
 * @returns {string|null}
 */
function readFileContent(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const maxSize = 1024 * 1024; // 1MB

    // Skip very large files
    if (fileSizeInBytes > maxSize) {
      return `[File too large to display: ${(fileSizeInBytes / 1024 / 1024).toFixed(2)} MB]`;
    }

    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return `[Error reading file: ${error.message}]`;
  }
}

/**
 * Recursively scan directory for code files
 * @param {string} dirPath - Directory path to scan
 * @param {string} basePath - Base path for calculating relative paths
 * @param {Array} results - Array to store results
 * @returns {Array}
 */
function scanDirectoryRecursive(dirPath, basePath = dirPath, results = []) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        if (shouldScanDirectory(entry.name)) {
          scanDirectoryRecursive(fullPath, basePath, results);
        }
      } else if (entry.isFile()) {
        // Add file if it should be scanned
        if (shouldScanFile(fullPath)) {
          const relativePath = path.relative(basePath, fullPath);
          const content = readFileContent(fullPath);

          results.push({
            path: fullPath,
            relativePath: relativePath,
            name: entry.name,
            extension: path.extname(entry.name),
            content: content,
            size: fs.statSync(fullPath).size
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error.message);
  }

  return results;
}

/**
 * Scan a directory and return all code files
 * @param {string} dirPath - Directory path to scan
 * @returns {Array}
 */
function scanDirectory(dirPath) {
  console.log(`   Scanning: ${dirPath}`);
  return scanDirectoryRecursive(dirPath);
}

module.exports = {
  scanDirectory,
  CODE_EXTENSIONS,
  IGNORE_DIRS,
  IGNORE_FILES
};
