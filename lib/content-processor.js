/**
 * Content processing utilities (redaction, truncation, etc.)
 */

/**
 * Patterns for sensitive data detection
 */
const SENSITIVE_PATTERNS = [
  // API Keys and tokens
  { pattern: /(['"]?)(api[_-]?key|apikey)(['"]?\s*[:=]\s*)['"][a-zA-Z0-9_\-]{20,}['"]/gi, replacement: '$1$2$3\'[REDACTED_API_KEY]\'' },
  { pattern: /(['"]?)(access[_-]?token|accesstoken)(['"]?\s*[:=]\s*)['"][a-zA-Z0-9_\-]{20,}['"]/gi, replacement: '$1$2$3\'[REDACTED_TOKEN]\'' },
  { pattern: /(['"]?)(secret[_-]?key|secretkey)(['"]?\s*[:=]\s*)['"][a-zA-Z0-9_\-]{20,}['"]/gi, replacement: '$1$2$3\'[REDACTED_SECRET]\'' },

  // AWS keys
  { pattern: /AKIA[0-9A-Z]{16}/g, replacement: 'AKIA[REDACTED_AWS_KEY]' },

  // GitHub tokens
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, replacement: 'ghp_[REDACTED_GITHUB_TOKEN]' },
  { pattern: /gho_[a-zA-Z0-9]{36}/g, replacement: 'gho_[REDACTED_GITHUB_TOKEN]' },
  { pattern: /github_pat_[a-zA-Z0-9_]{82}/g, replacement: 'github_pat_[REDACTED]' },

  // Private keys
  { pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, replacement: '-----BEGIN PRIVATE KEY-----\n[REDACTED]\n-----END PRIVATE KEY-----' },

  // JWT tokens
  { pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, replacement: 'eyJ[REDACTED_JWT_TOKEN]' },

  // Passwords in common formats
  { pattern: /(['"]?)(password|passwd|pwd)(['"]?\s*[:=]\s*)['"][^'"]{8,}['"]/gi, replacement: '$1$2$3\'[REDACTED_PASSWORD]\'' },

  // Email addresses (optional - might be too aggressive)
  // { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]' },

  // IP addresses (private ranges)
  { pattern: /\b192\.168\.\d{1,3}\.\d{1,3}\b/g, replacement: '192.168.xxx.xxx' },
  { pattern: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '10.xxx.xxx.xxx' },

  // Generic secrets/tokens
  { pattern: /(['"]?)(token|secret|bearer)(['"]?\s*[:=]\s*)['"][a-zA-Z0-9_\-+=\/]{32,}['"]/gi, replacement: '$1$2$3\'[REDACTED]\'' }
];

/**
 * Redact sensitive information from content
 * @param {string} content - File content
 * @returns {string} Redacted content
 */
function redactSensitiveData(content) {
  if (!content || content.startsWith('[')) {
    return content;
  }

  let redacted = content;
  let redactionCount = 0;

  SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
    const matches = redacted.match(pattern);
    if (matches) {
      redactionCount += matches.length;
      redacted = redacted.replace(pattern, replacement);
    }
  });

  return redacted;
}

/**
 * Truncate large file content intelligently
 * @param {string} content - File content
 * @param {number} maxLines - Maximum lines to show
 * @returns {Object} Truncated content and metadata
 */
function truncateContent(content, maxLines = 100) {
  if (!content || content.startsWith('[')) {
    return { content, truncated: false };
  }

  const lines = content.split('\n');
  const totalLines = lines.length;

  if (totalLines <= maxLines) {
    return { content, truncated: false, totalLines };
  }

  // Show first portion and last portion
  const headLines = Math.floor(maxLines * 0.7);
  const tailLines = Math.floor(maxLines * 0.3);

  const head = lines.slice(0, headLines).join('\n');
  const tail = lines.slice(-tailLines).join('\n');

  const omittedLines = totalLines - headLines - tailLines;

  const truncatedContent =
    head +
    '\n\n' +
    `... [${omittedLines} lines omitted] ...\n\n` +
    tail;

  return {
    content: truncatedContent,
    truncated: true,
    totalLines,
    shownLines: headLines + tailLines,
    omittedLines
  };
}

/**
 * Check if content appears to be binary
 * @param {string} content - File content
 * @returns {boolean} True if content appears binary
 */
function isBinaryContent(content) {
  if (!content) return false;

  // Check for null bytes
  if (content.includes('\0')) return true;

  // Check for high ratio of non-printable characters
  const nonPrintable = content.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code < 32 && code !== 9 && code !== 10 && code !== 13;
  }).length;

  const ratio = nonPrintable / content.length;
  return ratio > 0.3; // If more than 30% non-printable, likely binary
}

/**
 * Process file content based on options
 * @param {string} content - Original content
 * @param {Object} options - Processing options
 * @returns {Object} Processed content and metadata
 */
function processContent(content, options = {}) {
  const {
    redact = false,
    truncate = false,
    truncateLines = 100
  } = options;

  let processed = content;
  const metadata = {
    redacted: false,
    truncated: false,
    binary: false
  };

  // Check for binary content
  if (isBinaryContent(content)) {
    metadata.binary = true;
    return {
      content: '[Binary file - content not displayed]',
      metadata
    };
  }

  // Redact sensitive data
  if (redact) {
    processed = redactSensitiveData(processed);
    metadata.redacted = true;
  }

  // Truncate if needed
  if (truncate) {
    const result = truncateContent(processed, truncateLines);
    processed = result.content;
    metadata.truncated = result.truncated;
    metadata.totalLines = result.totalLines;
    metadata.shownLines = result.shownLines;
    metadata.omittedLines = result.omittedLines;
  }

  return {
    content: processed,
    metadata
  };
}

module.exports = {
  redactSensitiveData,
  truncateContent,
  isBinaryContent,
  processContent,
  SENSITIVE_PATTERNS
};
