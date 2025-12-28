/**
 * Progress indicator module for CLI feedback
 */

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const BAR_WIDTH = 30;

/**
 * Create a progress indicator
 * @param {Object} options - Progress options
 * @returns {Object} Progress controller
 */
function createProgress(options = {}) {
  const { total = 0, label = 'Processing' } = options;

  let current = 0;
  let spinnerIndex = 0;
  let intervalId = null;
  let lastLineLength = 0;
  let isActive = false;

  /**
   * Clear the current line
   */
  function clearLine() {
    if (process.stderr.isTTY) {
      process.stderr.write('\r' + ' '.repeat(lastLineLength) + '\r');
    }
  }

  /**
   * Render the progress display
   */
  function render() {
    if (!isActive) return;

    const spinner = SPINNER_FRAMES[spinnerIndex % SPINNER_FRAMES.length];
    spinnerIndex++;

    let line;

    if (total > 0) {
      // Show progress bar with percentage
      const percent = Math.min(100, Math.round((current / total) * 100));
      const filled = Math.round((current / total) * BAR_WIDTH);
      const empty = BAR_WIDTH - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      line = `${spinner} ${label}... [${bar}] ${current}/${total} (${percent}%)`;
    } else {
      // Show spinner with count
      line = `${spinner} ${label}... ${current > 0 ? `(${current} files)` : ''}`;
    }

    clearLine();
    lastLineLength = line.length;

    if (process.stderr.isTTY) {
      process.stderr.write(line);
    }
  }

  /**
   * Start the progress indicator
   */
  function start() {
    if (isActive) return;
    isActive = true;

    if (process.stderr.isTTY) {
      // Hide cursor
      process.stderr.write('\x1B[?25l');
      render();
      intervalId = setInterval(render, 80);
    } else {
      // Non-TTY: just print once
      process.stderr.write(`${label}...\n`);
    }
  }

  /**
   * Update the progress
   * @param {number} value - New current value
   * @param {string} newLabel - Optional new label
   */
  function update(value, newLabel) {
    current = value;
    if (newLabel) label = newLabel;
    if (isActive && !intervalId) render();
  }

  /**
   * Increment the progress by 1
   */
  function increment() {
    current++;
    if (isActive && !intervalId) render();
  }

  /**
   * Set the total count
   * @param {number} value - Total count
   */
  function setTotal(value) {
    total = value;
  }

  /**
   * Stop the progress indicator
   * @param {string} message - Optional completion message
   */
  function stop(message) {
    if (!isActive) return;
    isActive = false;

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }

    clearLine();

    if (process.stderr.isTTY) {
      // Show cursor
      process.stderr.write('\x1B[?25h');

      if (message) {
        process.stderr.write(message + '\n');
      }
    } else if (message) {
      process.stderr.write(message + '\n');
    }
  }

  /**
   * Stop with success message
   * @param {string} message - Success message
   */
  function succeed(message) {
    stop(`✅ ${message || 'Done!'}`);
  }

  /**
   * Stop with failure message
   * @param {string} message - Failure message
   */
  function fail(message) {
    stop(`❌ ${message || 'Failed!'}`);
  }

  return {
    start,
    update,
    increment,
    setTotal,
    stop,
    succeed,
    fail,
    get current() { return current; }
  };
}

/**
 * Create a simple spinner
 * @param {string} label - Spinner label
 * @returns {Object} Spinner controller
 */
function createSpinner(label = 'Loading') {
  return createProgress({ label, total: 0 });
}

/**
 * Create a progress bar
 * @param {number} total - Total items
 * @param {string} label - Progress label
 * @returns {Object} Progress bar controller
 */
function createProgressBar(total, label = 'Processing') {
  return createProgress({ total, label });
}

module.exports = {
  createProgress,
  createSpinner,
  createProgressBar
};
