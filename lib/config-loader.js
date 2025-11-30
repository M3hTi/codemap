const fs = require('fs');
const path = require('path');

/**
 * Configuration file names to search for
 */
const CONFIG_FILES = [
  '.codemaprc.json',
  '.codemaprc',
  'codemap.config.json'
];

/**
 * Load configuration from file
 * @param {string} dirPath - Directory to search for config
 * @returns {Object|null} Configuration object or null if not found
 */
function loadConfig(dirPath) {
  for (const configFile of CONFIG_FILES) {
    const configPath = path.join(dirPath, configFile);

    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(content);
        console.log(`📋 Loaded configuration from: ${configFile}`);
        return normalizeConfig(config);
      }
    } catch (error) {
      console.warn(`⚠️  Warning: Could not parse config file ${configFile}: ${error.message}`);
    }
  }

  return null;
}

/**
 * Normalize and validate configuration
 * @param {Object} config - Raw configuration
 * @returns {Object} Normalized configuration
 */
function normalizeConfig(config) {
  const normalized = {};

  // Output path
  if (config.output) {
    normalized.output = config.output;
  }

  // Format
  if (config.format) {
    normalized.format = config.format;
  }

  // Max file size
  if (config.maxFileSize || config.maxSize) {
    const sizeStr = config.maxFileSize || config.maxSize;
    normalized.maxSize = parseConfigSize(sizeStr);
  }

  // Filter extensions
  if (config.filter || config.include) {
    const filter = config.filter || config.include;
    normalized.filter = Array.isArray(filter) ? filter : [filter];
    normalized.filter = normalized.filter.map(ext =>
      ext.startsWith('.') ? ext : '.' + ext
    );
  }

  // Exclude patterns
  if (config.exclude || config.ignorePatterns) {
    const exclude = config.exclude || config.ignorePatterns;
    normalized.exclude = Array.isArray(exclude) ? exclude : [exclude];
  }

  // Additional ignore directories
  if (config.ignoreDirs) {
    normalized.ignoreDirs = Array.isArray(config.ignoreDirs)
      ? config.ignoreDirs
      : [config.ignoreDirs];
  }

  // Boolean flags
  if (typeof config.noContent === 'boolean') {
    normalized.noContent = config.noContent;
  }

  if (typeof config.stats === 'boolean') {
    normalized.stats = config.stats;
  }

  if (typeof config.truncate === 'boolean') {
    normalized.truncate = config.truncate;
  }

  if (typeof config.redact === 'boolean') {
    normalized.redact = config.redact;
  }

  if (typeof config.git === 'boolean') {
    normalized.git = config.git;
  }

  // Numeric options
  if (config.depth !== undefined) {
    normalized.depth = parseInt(config.depth, 10);
  }

  if (config.truncateLines !== undefined) {
    normalized.truncateLines = parseInt(config.truncateLines, 10);
  }

  return normalized;
}

/**
 * Parse size from config (handles numbers and strings)
 * @param {string|number} size - Size value
 * @returns {number} Size in bytes
 */
function parseConfigSize(size) {
  if (typeof size === 'number') {
    return size;
  }

  if (typeof size === 'string') {
    const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
    if (!match) {
      console.warn(`Invalid size in config: ${size}, using default`);
      return 1024 * 1024;
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();

    const multipliers = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    return Math.floor(value * multipliers[unit]);
  }

  return 1024 * 1024; // Default 1MB
}

/**
 * Merge configuration sources (config file < CLI args)
 * @param {Object} fileConfig - Configuration from file
 * @param {Object} cliArgs - Configuration from CLI arguments
 * @returns {Object} Merged configuration
 */
function mergeConfigs(fileConfig, cliArgs) {
  // CLI args take precedence over file config
  return {
    ...fileConfig,
    ...cliArgs
  };
}

module.exports = {
  loadConfig,
  normalizeConfig,
  mergeConfigs
};
