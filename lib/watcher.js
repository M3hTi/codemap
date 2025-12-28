/**
 * Watch mode module for continuous file monitoring
 */

const fs = require('fs');
const path = require('path');

/**
 * Directories to ignore during watching
 */
const IGNORE_WATCH_DIRS = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  'target',
  '.next',
  '.nuxt',
  '.cache',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv'
];

/**
 * Create a debounced function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timeoutId = null;

  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Get all directories to watch recursively
 * @param {string} dirPath - Root directory
 * @param {Array} ignoreDirs - Additional directories to ignore
 * @returns {Array<string>}
 */
function getWatchDirectories(dirPath, ignoreDirs = []) {
  const dirs = [dirPath];
  const allIgnored = [...IGNORE_WATCH_DIRS, ...ignoreDirs];

  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !allIgnored.includes(entry.name)) {
          const fullPath = path.join(dir, entry.name);
          dirs.push(fullPath);
          scanDir(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  scanDir(dirPath);
  return dirs;
}

/**
 * Start watching a directory for changes
 * @param {string} dirPath - Directory to watch
 * @param {Function} onChange - Callback when files change
 * @param {Object} options - Watch options
 * @returns {Object} Watcher controller
 */
function startWatcher(dirPath, onChange, options = {}) {
  const {
    debounceMs = 500,
    ignoreDirs = [],
    filter = null
  } = options;

  const watchers = [];
  let isRunning = false;
  let pendingChanges = new Set();

  // Debounced handler for batching changes
  const handleChanges = debounce(() => {
    if (pendingChanges.size === 0) return;

    const changes = Array.from(pendingChanges);
    pendingChanges.clear();

    onChange(changes);
  }, debounceMs);

  /**
   * Check if a file should trigger rebuild
   * @param {string} filename - Changed filename
   * @returns {boolean}
   */
  function shouldTriggerRebuild(filename) {
    // Ignore hidden files and common non-code files
    if (filename.startsWith('.') || filename === 'CODEMAP.md' ||
        filename === 'CODEMAP.json' || filename === 'CODEMAP.html') {
      return false;
    }

    // If filter is set, only trigger for matching extensions
    if (filter && filter.length > 0) {
      const ext = path.extname(filename).toLowerCase();
      return filter.includes(ext);
    }

    return true;
  }

  /**
   * Start watching
   */
  function start() {
    if (isRunning) return;
    isRunning = true;

    const dirs = getWatchDirectories(dirPath, ignoreDirs);

    console.error(`\n👁️  Watch mode active - monitoring ${dirs.length} directories`);
    console.error('   Press Ctrl+C to stop\n');

    for (const dir of dirs) {
      try {
        const watcher = fs.watch(dir, { persistent: true }, (eventType, filename) => {
          if (filename && shouldTriggerRebuild(filename)) {
            const fullPath = path.join(dir, filename);
            pendingChanges.add(fullPath);
            handleChanges();
          }
        });

        watcher.on('error', (error) => {
          // Handle watcher errors silently (directory deleted, etc.)
        });

        watchers.push(watcher);
      } catch (error) {
        // Skip directories we can't watch
      }
    }

    // Handle process termination
    const cleanup = () => {
      stop();
      console.error('\n\n👋 Watch mode stopped.\n');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  /**
   * Stop watching
   */
  function stop() {
    if (!isRunning) return;
    isRunning = false;

    for (const watcher of watchers) {
      try {
        watcher.close();
      } catch (error) {
        // Ignore close errors
      }
    }
    watchers.length = 0;
  }

  /**
   * Check if watcher is running
   * @returns {boolean}
   */
  function running() {
    return isRunning;
  }

  return {
    start,
    stop,
    running
  };
}

/**
 * Format timestamp for display
 * @returns {string}
 */
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Log a watch event
 * @param {string} message - Message to log
 * @param {string} type - Event type (info, change, success, error)
 */
function logWatchEvent(message, type = 'info') {
  const timestamp = getTimestamp();
  const icons = {
    info: 'ℹ️ ',
    change: '📝',
    success: '✅',
    error: '❌'
  };
  const icon = icons[type] || icons.info;

  console.error(`[${timestamp}] ${icon} ${message}`);
}

module.exports = {
  startWatcher,
  getTimestamp,
  logWatchEvent,
  IGNORE_WATCH_DIRS
};
