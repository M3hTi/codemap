/**
 * Interactive mode module for guided configuration
 */

const readline = require('readline');

/**
 * Create readline interface
 * @returns {readline.Interface}
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: true
  });
}

/**
 * Ask a question and wait for answer
 * @param {readline.Interface} rl - Readline interface
 * @param {string} question - Question to ask
 * @returns {Promise<string>}
 */
function ask(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * Display a menu and get selection
 * @param {readline.Interface} rl - Readline interface
 * @param {string} title - Menu title
 * @param {Array} choices - Array of {value, label} objects
 * @param {string} defaultValue - Default value
 * @returns {Promise<string>}
 */
async function menu(rl, title, choices, defaultValue = null) {
  console.error(`\n${title}`);

  choices.forEach((choice, index) => {
    const isDefault = choice.value === defaultValue;
    const marker = isDefault ? '→' : ' ';
    console.error(`  ${marker} ${index + 1}. ${choice.label}${isDefault ? ' (default)' : ''}`);
  });

  const answer = await ask(rl, `\nEnter choice [1-${choices.length}]: `);

  if (!answer && defaultValue !== null) {
    return defaultValue;
  }

  const index = parseInt(answer, 10) - 1;
  if (index >= 0 && index < choices.length) {
    return choices[index].value;
  }

  // Invalid input, use default or first option
  return defaultValue !== null ? defaultValue : choices[0].value;
}

/**
 * Ask for confirmation
 * @param {readline.Interface} rl - Readline interface
 * @param {string} question - Question to ask
 * @param {boolean} defaultValue - Default value
 * @returns {Promise<boolean>}
 */
async function confirm(rl, question, defaultValue = true) {
  const hint = defaultValue ? '[Y/n]' : '[y/N]';
  const answer = await ask(rl, `${question} ${hint}: `);

  if (!answer) return defaultValue;

  return answer.toLowerCase().startsWith('y');
}

/**
 * Run the interactive configuration wizard
 * @returns {Promise<Object>} Configuration options
 */
async function runInteractiveMode() {
  const rl = createInterface();

  console.error('\n🗺️  CodeMap Interactive Configuration\n');
  console.error('━'.repeat(40));
  console.error('Answer the following questions to configure your code map.');
  console.error('Press Enter to accept the default value.\n');

  const options = {
    output: 'CODEMAP.md',
    format: 'markdown',
    maxSize: 1024 * 1024,
    filter: null,
    exclude: null,
    noContent: false,
    depth: null,
    stats: true,
    truncate: false,
    truncateLines: 100,
    redact: false,
    git: true
  };

  try {
    // Output format
    options.format = await menu(rl, '📄 Output Format:', [
      { value: 'markdown', label: 'Markdown (.md) - Human readable documentation' },
      { value: 'json', label: 'JSON (.json) - Structured data for processing' },
      { value: 'html', label: 'HTML (.html) - Styled web page' }
    ], 'markdown');

    // Output file
    const defaultOutput = options.format === 'markdown' ? 'CODEMAP.md' :
                         options.format === 'json' ? 'CODEMAP.json' : 'CODEMAP.html';

    const outputAnswer = await ask(rl, `\n📁 Output file path [${defaultOutput}]: `);
    options.output = outputAnswer || defaultOutput;

    // File filtering
    const useFilter = await confirm(rl, '\n🔍 Filter specific file types?', false);
    if (useFilter) {
      const filterAnswer = await ask(rl, 'Enter extensions (comma-separated, e.g., .js,.ts,.py): ');
      if (filterAnswer) {
        options.filter = filterAnswer.split(',').map(ext =>
          ext.trim().startsWith('.') ? ext.trim() : '.' + ext.trim()
        );
      }
    }

    // Exclusions
    const useExclude = await confirm(rl, '\n🚫 Exclude specific patterns?', false);
    if (useExclude) {
      const excludeAnswer = await ask(rl, 'Enter patterns (comma-separated, e.g., *.test.js,*.spec.ts): ');
      if (excludeAnswer) {
        options.exclude = excludeAnswer.split(',').map(p => p.trim());
      }
    }

    // Max file size
    const maxSizeChoice = await menu(rl, '\n📏 Maximum file size to include:', [
      { value: 512 * 1024, label: '512 KB - Conservative' },
      { value: 1024 * 1024, label: '1 MB - Default' },
      { value: 2 * 1024 * 1024, label: '2 MB - Large files' },
      { value: 5 * 1024 * 1024, label: '5 MB - Very large files' }
    ], 1024 * 1024);
    options.maxSize = maxSizeChoice;

    // Depth limit
    const limitDepth = await confirm(rl, '\n📂 Limit directory depth?', false);
    if (limitDepth) {
      const depthAnswer = await ask(rl, 'Enter maximum depth (e.g., 3): ');
      const depth = parseInt(depthAnswer, 10);
      if (!isNaN(depth) && depth > 0) {
        options.depth = depth;
      }
    }

    // Content options
    options.noContent = await confirm(rl, '\n📝 Skip file contents (structure only)?', false);

    if (!options.noContent) {
      // Truncation
      options.truncate = await confirm(rl, '\n✂️  Truncate large files?', false);
      if (options.truncate) {
        const linesAnswer = await ask(rl, 'Maximum lines per file [100]: ');
        const lines = parseInt(linesAnswer, 10);
        options.truncateLines = !isNaN(lines) && lines > 0 ? lines : 100;
      }

      // Redaction
      options.redact = await confirm(rl, '\n🔒 Redact sensitive information (API keys, tokens)?', false);
    }

    // Statistics
    options.stats = await confirm(rl, '\n📊 Include statistics dashboard?', true);

    // Git integration
    options.git = await confirm(rl, '\n📜 Include git information?', true);

    // Summary
    console.error('\n' + '━'.repeat(40));
    console.error('📋 Configuration Summary:\n');
    console.error(`   Format:     ${options.format}`);
    console.error(`   Output:     ${options.output}`);
    console.error(`   Max size:   ${formatSize(options.maxSize)}`);
    if (options.filter) console.error(`   Filter:     ${options.filter.join(', ')}`);
    if (options.exclude) console.error(`   Exclude:    ${options.exclude.join(', ')}`);
    if (options.depth) console.error(`   Depth:      ${options.depth}`);
    console.error(`   Content:    ${options.noContent ? 'No' : 'Yes'}`);
    if (options.truncate) console.error(`   Truncate:   ${options.truncateLines} lines`);
    console.error(`   Redact:     ${options.redact ? 'Yes' : 'No'}`);
    console.error(`   Stats:      ${options.stats ? 'Yes' : 'No'}`);
    console.error(`   Git:        ${options.git ? 'Yes' : 'No'}`);
    console.error('');

    const proceed = await confirm(rl, '▶️  Proceed with these settings?', true);

    rl.close();

    if (!proceed) {
      console.error('\n⚠️  Operation cancelled.\n');
      process.exit(0);
    }

    console.error('');
    return options;

  } catch (error) {
    rl.close();
    throw error;
  }
}

/**
 * Format bytes to human readable size
 * @param {number} bytes - Size in bytes
 * @returns {string}
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1024 / 1024).toFixed(0) + ' MB';
}

module.exports = {
  runInteractiveMode
};
