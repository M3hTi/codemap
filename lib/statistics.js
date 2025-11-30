/**
 * Statistics and metrics calculation for code files
 */

/**
 * Calculate comprehensive statistics for scanned files
 * @param {Array} files - Array of file objects
 * @returns {Object} Statistics object
 */
function calculateStatistics(files) {
  const stats = {
    totalFiles: files.length,
    totalSize: 0,
    totalLines: 0,
    byLanguage: {},
    byExtension: {},
    largestFiles: [],
    filesBySize: {
      small: 0,  // < 10KB
      medium: 0, // 10KB - 100KB
      large: 0,  // 100KB - 1MB
      veryLarge: 0 // > 1MB
    }
  };

  files.forEach(file => {
    // Total size
    stats.totalSize += file.size;

    // Count lines (excluding error messages)
    if (file.content && !file.content.startsWith('[')) {
      const lines = file.content.split('\n').length;
      stats.totalLines += lines;

      // Get language from extension
      const ext = file.extension.toLowerCase();
      const language = getLanguageFromExtension(ext);

      // By language
      if (!stats.byLanguage[language]) {
        stats.byLanguage[language] = {
          files: 0,
          lines: 0,
          size: 0
        };
      }
      stats.byLanguage[language].files++;
      stats.byLanguage[language].lines += lines;
      stats.byLanguage[language].size += file.size;

      // By extension
      if (!stats.byExtension[ext]) {
        stats.byExtension[ext] = 0;
      }
      stats.byExtension[ext]++;
    }

    // File size categories
    const sizeInKB = file.size / 1024;
    if (sizeInKB < 10) {
      stats.filesBySize.small++;
    } else if (sizeInKB < 100) {
      stats.filesBySize.medium++;
    } else if (sizeInKB < 1024) {
      stats.filesBySize.large++;
    } else {
      stats.filesBySize.veryLarge++;
    }

    // Track for largest files
    stats.largestFiles.push({
      path: file.relativePath,
      size: file.size,
      lines: file.content && !file.content.startsWith('[')
        ? file.content.split('\n').length
        : 0
    });
  });

  // Sort largest files and keep top 10
  stats.largestFiles.sort((a, b) => b.size - a.size);
  stats.largestFiles = stats.largestFiles.slice(0, 10);

  // Sort languages by line count
  stats.languagesByLines = Object.entries(stats.byLanguage)
    .map(([lang, data]) => ({ language: lang, ...data }))
    .sort((a, b) => b.lines - a.lines);

  return stats;
}

/**
 * Get language name from file extension
 * @param {string} ext - File extension
 * @returns {string} Language name
 */
function getLanguageFromExtension(ext) {
  const languageMap = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.cpp': 'C++',
    '.c': 'C',
    '.h': 'C/C++',
    '.hpp': 'C++',
    '.cs': 'C#',
    '.go': 'Go',
    '.rs': 'Rust',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.sh': 'Shell',
    '.bash': 'Shell',
    '.sql': 'SQL',
    '.r': 'R',
    '.m': 'Objective-C',
    '.mm': 'Objective-C',
    '.dart': 'Dart',
    '.vue': 'Vue',
    '.svelte': 'Svelte',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.json': 'JSON',
    '.xml': 'XML',
    '.yaml': 'YAML',
    '.yml': 'YAML',
    '.toml': 'TOML',
    '.md': 'Markdown',
    '.txt': 'Text'
  };

  return languageMap[ext.toLowerCase()] || 'Other';
}

/**
 * Generate ASCII bar chart for language distribution
 * @param {Object} stats - Statistics object
 * @param {number} maxWidth - Maximum width of bars
 * @returns {string} ASCII bar chart
 */
function generateLanguageChart(stats, maxWidth = 40) {
  if (!stats.languagesByLines || stats.languagesByLines.length === 0) {
    return 'No data available';
  }

  const maxLines = stats.languagesByLines[0].lines;
  let chart = '';

  stats.languagesByLines.forEach(({ language, lines, files }) => {
    const percentage = ((lines / stats.totalLines) * 100).toFixed(1);
    const barWidth = Math.max(1, Math.floor((lines / maxLines) * maxWidth));
    const bar = '█'.repeat(barWidth);

    chart += `${language.padEnd(15)} ${bar} ${percentage}% (${files} files, ${lines.toLocaleString()} lines)\n`;
  });

  return chart;
}

/**
 * Format statistics for display
 * @param {Object} stats - Statistics object
 * @returns {string} Formatted statistics
 */
function formatStatistics(stats) {
  let output = '';

  output += `📊 **Total Files:** ${stats.totalFiles}\n`;
  output += `📏 **Total Lines of Code:** ${stats.totalLines.toLocaleString()}\n`;
  output += `💾 **Total Size:** ${formatFileSize(stats.totalSize)}\n\n`;

  output += `**Files by Size:**\n`;
  output += `- Small (< 10KB): ${stats.filesBySize.small}\n`;
  output += `- Medium (10KB - 100KB): ${stats.filesBySize.medium}\n`;
  output += `- Large (100KB - 1MB): ${stats.filesBySize.large}\n`;
  output += `- Very Large (> 1MB): ${stats.filesBySize.veryLarge}\n\n`;

  return output;
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

module.exports = {
  calculateStatistics,
  getLanguageFromExtension,
  generateLanguageChart,
  formatStatistics
};
