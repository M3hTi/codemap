const path = require('path');
const { generateLanguageChart, formatStatistics } = require('./statistics');

/**
 * Get language identifier for markdown code blocks based on file extension
 * @param {string} extension - File extension
 * @returns {string}
 */
function getLanguageIdentifier(extension) {
  const languageMap = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sh': 'bash',
    '.bash': 'bash',
    '.sql': 'sql',
    '.r': 'r',
    '.m': 'objectivec',
    '.mm': 'objectivec',
    '.dart': 'dart',
    '.vue': 'vue',
    '.svelte': 'svelte',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.md': 'markdown',
    '.txt': 'text'
  };

  return languageMap[extension.toLowerCase()] || 'text';
}

/**
 * Escape special Markdown characters in text
 * Only escapes characters that would cause formatting issues in headings
 * @param {string} text - Text to escape
 * @returns {string}
 */
function escapeMarkdown(text) {
  // Only escape underscore and asterisk which cause emphasis/bold formatting
  return text.replace(/[_*]/g, '\\$&');
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

/**
 * Generate markdown content for the code map
 * @param {Object} options - Generation options
 * @param {string} options.workingDir - Working directory path
 * @param {boolean} options.isProjectRoot - Whether the directory is a project root
 * @param {Array} options.files - Array of scanned files
 * @param {string} options.projectTree - Project tree structure
 * @param {Object} options.statistics - Statistics object
 * @param {Object} options.gitInfo - Git information
 * @param {boolean} options.noContent - Skip file contents
 * @returns {string}
 */
function generateMarkdown({ workingDir, isProjectRoot, files, projectTree, statistics, gitInfo, noContent }) {
  const projectName = path.basename(workingDir);
  const timestamp = new Date().toISOString();

  let markdown = '';

  // Header
  markdown += `# CodeMap: ${projectName}\n\n`;
  markdown += `> Generated on: ${timestamp}\n\n`;
  markdown += `**Total Files Scanned:** ${files.length}\n\n`;

  // Table of contents
  markdown += `## Table of Contents\n\n`;
  markdown += `- [Project Overview](#project-overview)\n`;
  if (statistics) {
    markdown += `- [Statistics](#statistics)\n`;
  }
  if (gitInfo) {
    markdown += `- [Git Information](#git-information)\n`;
  }
  markdown += `- [Project Structure](#project-structure)\n`;
  markdown += `- [File Summary](#file-summary)\n`;
  if (!noContent) {
    markdown += `- [File Contents](#file-contents)\n`;
  }
  markdown += `\n`;

  markdown += `---\n\n`;

  // Project Overview
  markdown += `## Project Overview\n\n`;
  markdown += `**Directory:** \`${workingDir}\`\n\n`;
  markdown += `**Project Root:** ${isProjectRoot ? 'Yes' : 'No'}\n\n`;

  // Statistics
  if (statistics) {
    markdown += `---\n\n`;
    markdown += `## Statistics\n\n`;
    markdown += formatStatistics(statistics);
    markdown += `\n**Language Distribution:**\n\n`;
    markdown += '```\n';
    markdown += generateLanguageChart(statistics);
    markdown += '```\n\n';

    if (statistics.largestFiles && statistics.largestFiles.length > 0) {
      markdown += `**Largest Files:**\n\n`;
      markdown += `| File | Size | Lines |\n`;
      markdown += `|------|------|-------|\n`;
      statistics.largestFiles.slice(0, 10).forEach(file => {
        markdown += `| \`${file.path}\` | ${formatFileSize(file.size)} | ${file.lines.toLocaleString()} |\n`;
      });
      markdown += `\n`;
    }
  }

  // Git Information
  if (gitInfo) {
    markdown += `---\n\n`;
    markdown += `## Git Information\n\n`;
    markdown += `**Branch:** \`${gitInfo.branch}\`\n\n`;
    markdown += `**Commit:** \`${gitInfo.commitHash}\`\n\n`;
    markdown += `**Last Commit:** ${gitInfo.commitDate}\n\n`;
    if (gitInfo.remoteUrl) {
      markdown += `**Remote:** \`${gitInfo.remoteUrl}\`\n\n`;
    }
  }

  // Project Structure
  markdown += `---\n\n`;
  markdown += `## Project Structure\n\n`;
  markdown += '```\n';
  markdown += projectTree;
  markdown += '\n```\n\n';
  markdown += `---\n\n`;

  // File Summary
  markdown += `## File Summary\n\n`;
  markdown += `| # | File Path | Type | Size |\n`;
  markdown += `|---|-----------|------|------|\n`;

  files.forEach((file, index) => {
    const fileType = getLanguageIdentifier(file.extension);
    const fileSize = formatFileSize(file.size);
    markdown += `| ${index + 1} | \`${file.relativePath}\` | ${fileType} | ${fileSize} |\n`;
  });

  markdown += `\n---\n\n`;

  // File Contents
  if (!noContent) {
    markdown += `## File Contents\n\n`;

    files.forEach((file, index) => {
      markdown += `### ${index + 1}. ${escapeMarkdown(file.relativePath)}\n\n`;
      markdown += `**Path:** \`${file.relativePath}\`\n\n`;
      markdown += `**Size:** ${formatFileSize(file.size)}\n\n`;

      // Add git info if available
      if (file.gitInfo) {
        if (file.gitInfo.lastModified) {
          markdown += `**Last Modified:** ${file.gitInfo.lastModified}`;
          if (file.gitInfo.lastAuthor) {
            markdown += ` by ${file.gitInfo.lastAuthor}`;
          }
          markdown += `\n\n`;
        }
        if (file.gitInfo.commitCount > 0) {
          markdown += `**Commits:** ${file.gitInfo.commitCount}\n\n`;
        }
      }

      const language = getLanguageIdentifier(file.extension);

      // Check if content is an error message
      if (file.content.startsWith('[')) {
        markdown += `${file.content}\n\n`;
      } else {
        markdown += '```' + language + '\n';
        markdown += file.content;
        // Ensure there's a newline before closing the code block
        if (!file.content.endsWith('\n')) {
          markdown += '\n';
        }
        markdown += '```\n\n';
      }

      markdown += `---\n\n`;
    });
  }

  // Footer
  markdown += `## Generated by CodeMap\n\n`;
  markdown += `This document was automatically generated by [CodeMap](https://www.npmjs.com/package/@mehti/codemap).\n`;

  return markdown;
}

module.exports = {
  generateMarkdown,
  getLanguageIdentifier,
  formatFileSize,
  escapeMarkdown
};
