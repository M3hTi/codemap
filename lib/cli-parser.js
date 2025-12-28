/**
 * Simple CLI argument parser
 */

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    output: 'CODEMAP.md',
    format: 'markdown',
    maxSize: 1024 * 1024, // 1MB default
    filter: null, // array of extensions to include
    exclude: null, // array of patterns to exclude
    noContent: false,
    depth: null,
    help: false,
    interactive: false,
    watch: false,
    stats: true,
    truncate: false,
    truncateLines: 100,
    redact: false,
    git: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;

      case '--output':
      case '-o':
        options.output = args[++i];
        break;

      case '--format':
      case '-f':
        options.format = args[++i];
        break;

      case '--max-size':
        options.maxSize = parseSize(args[++i]);
        break;

      case '--filter':
        options.filter = args[++i].split(',').map(ext =>
          ext.trim().startsWith('.') ? ext.trim() : '.' + ext.trim()
        );
        break;

      case '--exclude':
        options.exclude = args[++i].split(',').map(p => p.trim());
        break;

      case '--no-content':
        options.noContent = true;
        break;

      case '--depth':
        options.depth = parseInt(args[++i], 10);
        break;

      case '--no-stats':
        options.stats = false;
        break;

      case '--truncate':
        options.truncate = true;
        if (args[i + 1] && !args[i + 1].startsWith('--')) {
          options.truncateLines = parseInt(args[++i], 10);
        }
        break;

      case '--redact':
        options.redact = true;
        break;

      case '--no-git':
        options.git = false;
        break;

      case '--interactive':
      case '-i':
        options.interactive = true;
        break;

      case '--watch':
      case '-w':
        options.watch = true;
        break;
    }
  }

  return options;
}

/**
 * Parse size string (e.g., "2MB", "500KB") to bytes
 * @param {string} sizeStr - Size string
 * @returns {number} Size in bytes
 */
function parseSize(sizeStr) {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
  if (!match) {
    console.warn(`Invalid size format: ${sizeStr}, using default 1MB`);
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

/**
 * Display help message
 */
function displayHelp() {
  console.log(`
🗺️  CodeMap - Generate comprehensive code documentation

USAGE:
  codemap [options]

OPTIONS:
  -o, --output <path>        Output file path (default: CODEMAP.md)
  -f, --format <type>        Output format: markdown, json, html (default: markdown)
  --filter <extensions>      Only include specific file types (e.g., --filter .js,.ts)
  --exclude <patterns>       Exclude additional patterns (comma-separated)
  --max-size <size>          Maximum file size to include (e.g., 2MB, 500KB)
  --no-content               Generate structure and summary only, skip file contents
  --depth <n>                Limit directory scanning depth
  --truncate [lines]         Truncate large files (default: 100 lines)
  --redact                   Redact sensitive information (API keys, tokens, etc.)
  --no-stats                 Skip statistics dashboard
  --no-git                   Skip git integration features
  -i, --interactive          Run interactive configuration wizard
  -w, --watch                Watch for file changes and regenerate automatically
  -h, --help                 Show this help message

EXAMPLES:
  codemap                                    # Generate with defaults
  codemap --interactive                      # Run configuration wizard
  codemap --watch                            # Watch mode with auto-regeneration
  codemap --output docs/CODE.md              # Custom output location
  codemap --filter .js,.ts --format json     # Only JS/TS files, JSON output
  codemap --no-content --stats               # Structure and stats only
  codemap --max-size 2MB --truncate 200      # Large files with truncation
  codemap --redact                           # Redact sensitive data

CONFIGURATION:
  Create a .codemaprc.json file in your project root for persistent settings.

For more information, visit: https://www.npmjs.com/package/@mehti/codemap
`);
}

module.exports = {
  parseArgs,
  parseSize,
  displayHelp
};
