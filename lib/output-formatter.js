const path = require('path');

/**
 * Format output as JSON
 * @param {Object} data - Data to format
 * @returns {string} JSON string
 */
function formatAsJSON(data) {
  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      workingDirectory: data.workingDir,
      isProjectRoot: data.isProjectRoot,
      totalFiles: data.files.length
    },
    gitInfo: data.gitInfo || null,
    statistics: data.statistics || null,
    projectTree: data.projectTree,
    files: data.files.map(file => ({
      path: file.relativePath,
      name: file.name,
      extension: file.extension,
      size: file.size,
      content: file.content,
      gitInfo: file.gitInfo || null
    }))
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Format output as HTML
 * @param {Object} data - Data to format
 * @returns {string} HTML string
 */
function formatAsHTML(data) {
  const projectName = path.basename(data.workingDir);
  const timestamp = new Date().toISOString();

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeMap: ${escapeHTML(projectName)}</title>
  <style>
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f6f8fa;
      --text-primary: #24292f;
      --text-secondary: #57606a;
      --border-color: #d0d7de;
      --accent-color: #0969da;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-primary);
      background: var(--bg-secondary);
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: var(--bg-primary);
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 { color: var(--text-primary); margin-bottom: 10px; font-size: 2em; }
    h2 { color: var(--text-primary); margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); }
    h3 { color: var(--text-primary); margin: 25px 0 10px; font-size: 1.2em; }
    .metadata { color: var(--text-secondary); margin-bottom: 30px; font-size: 0.9em; }
    .stats { background: var(--bg-secondary); padding: 20px; border-radius: 6px; margin: 20px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
    .stat-item { padding: 10px; }
    .stat-label { color: var(--text-secondary); font-size: 0.85em; text-transform: uppercase; }
    .stat-value { font-size: 1.5em; font-weight: bold; color: var(--accent-color); }
    pre {
      background: var(--bg-secondary);
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      border: 1px solid var(--border-color);
      font-size: 0.9em;
    }
    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      background: var(--bg-secondary);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre code { background: none; padding: 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    th {
      background: var(--bg-secondary);
      font-weight: 600;
      color: var(--text-secondary);
    }
    tr:hover { background: var(--bg-secondary); }
    .file-section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    .toc { background: var(--bg-secondary); padding: 20px; border-radius: 6px; margin: 20px 0; }
    .toc ul { list-style: none; }
    .toc li { margin: 8px 0; }
    .toc a { color: var(--accent-color); text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    .language-chart { font-family: monospace; white-space: pre; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 0.85em; background: var(--bg-secondary); }
  </style>
</head>
<body>
  <div class="container">
    <h1>🗺️ CodeMap: ${escapeHTML(projectName)}</h1>
    <div class="metadata">
      Generated on: ${timestamp}<br>
      Total Files: ${data.files.length}
    </div>
`;

  // Table of Contents
  html += `
    <div class="toc">
      <h2>📑 Table of Contents</h2>
      <ul>
        <li><a href="#overview">Project Overview</a></li>
        ${data.statistics ? '<li><a href="#statistics">Statistics</a></li>' : ''}
        ${data.gitInfo ? '<li><a href="#git">Git Information</a></li>' : ''}
        <li><a href="#structure">Project Structure</a></li>
        <li><a href="#files">File Summary</a></li>
        <li><a href="#contents">File Contents</a></li>
      </ul>
    </div>
`;

  // Overview
  html += `
    <h2 id="overview">📂 Project Overview</h2>
    <p><strong>Directory:</strong> <code>${escapeHTML(data.workingDir)}</code></p>
    <p><strong>Project Root:</strong> ${data.isProjectRoot ? 'Yes' : 'No'}</p>
`;

  // Statistics
  if (data.statistics) {
    html += formatStatisticsHTML(data.statistics);
  }

  // Git Info
  if (data.gitInfo) {
    html += formatGitInfoHTML(data.gitInfo);
  }

  // Project Structure
  html += `
    <h2 id="structure">🌳 Project Structure</h2>
    <pre><code>${escapeHTML(data.projectTree)}</code></pre>
`;

  // File Summary Table
  html += `
    <h2 id="files">📄 File Summary</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>File Path</th>
          <th>Type</th>
          <th>Size</th>
        </tr>
      </thead>
      <tbody>
`;

  data.files.forEach((file, index) => {
    const ext = file.extension.toLowerCase();
    const language = getLanguageIdentifier(ext);
    const size = formatFileSize(file.size);

    html += `
        <tr>
          <td>${index + 1}</td>
          <td><code>${escapeHTML(file.relativePath)}</code></td>
          <td><span class="badge">${escapeHTML(language)}</span></td>
          <td>${size}</td>
        </tr>
`;
  });

  html += `
      </tbody>
    </table>
`;

  // File Contents
  html += `<h2 id="contents">📝 File Contents</h2>`;

  data.files.forEach((file, index) => {
    const language = getLanguageIdentifier(file.extension.toLowerCase());

    html += `
    <div class="file-section">
      <h3>${index + 1}. ${escapeHTML(file.relativePath)}</h3>
      <p><strong>Size:</strong> ${formatFileSize(file.size)}</p>
`;

    if (file.gitInfo && file.gitInfo.lastAuthor) {
      html += `<p><strong>Last Modified:</strong> ${escapeHTML(file.gitInfo.lastModified)} by ${escapeHTML(file.gitInfo.lastAuthor)}</p>`;
    }

    if (file.content.startsWith('[')) {
      html += `<p>${escapeHTML(file.content)}</p>`;
    } else {
      html += `<pre><code>${escapeHTML(file.content)}</code></pre>`;
    }

    html += `</div>`;
  });

  // Footer
  html += `
    <hr style="margin: 40px 0;">
    <p style="text-align: center; color: var(--text-secondary);">
      Generated by <a href="https://www.npmjs.com/package/@mehti/codemap" style="color: var(--accent-color);">CodeMap</a>
    </p>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Format statistics as HTML
 * @param {Object} stats - Statistics object
 * @returns {string} HTML string
 */
function formatStatisticsHTML(stats) {
  let html = `
    <h2 id="statistics">📊 Statistics</h2>
    <div class="stats">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Total Files</div>
          <div class="stat-value">${stats.totalFiles}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Lines of Code</div>
          <div class="stat-value">${stats.totalLines.toLocaleString()}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Total Size</div>
          <div class="stat-value">${formatFileSize(stats.totalSize)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Languages</div>
          <div class="stat-value">${Object.keys(stats.byLanguage).length}</div>
        </div>
      </div>
    </div>
`;

  return html;
}

/**
 * Format git info as HTML
 * @param {Object} gitInfo - Git information
 * @returns {string} HTML string
 */
function formatGitInfoHTML(gitInfo) {
  let html = `
    <h2 id="git">🔗 Git Information</h2>
    <p><strong>Branch:</strong> <code>${escapeHTML(gitInfo.branch)}</code></p>
    <p><strong>Commit:</strong> <code>${escapeHTML(gitInfo.commitHash)}</code></p>
    <p><strong>Last Commit:</strong> ${escapeHTML(gitInfo.commitDate)}</p>
`;

  if (gitInfo.remoteUrl) {
    html += `<p><strong>Remote:</strong> <code>${escapeHTML(gitInfo.remoteUrl)}</code></p>`;
  }

  return html;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Get language identifier
 * @param {string} extension - File extension
 * @returns {string} Language name
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
  formatAsJSON,
  formatAsHTML,
  escapeHTML
};
