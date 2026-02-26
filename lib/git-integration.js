const { execSync } = require('child_process');
const path = require('path');

/**
 * Check if directory is a git repository
 * @param {string} dirPath - Directory path
 * @returns {boolean}
 */
function isGitRepository(dirPath) {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: dirPath,
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get git information for the repository
 * @param {string} dirPath - Directory path
 * @returns {Object|null} Git information or null if not a git repo
 */
function getGitInfo(dirPath) {
  if (!isGitRepository(dirPath)) {
    return null;
  }

  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: dirPath,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();

    const commitHash = execSync('git rev-parse --short HEAD', {
      cwd: dirPath,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();

    const commitDate = execSync('git log -1 --format=%ai', {
      cwd: dirPath,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();

    const remoteUrl = getRemoteUrl(dirPath);

    return {
      branch,
      commitHash,
      commitDate,
      remoteUrl
    };
  } catch (error) {
    console.warn('   Warning: Could not fetch git information');
    return null;
  }
}

/**
 * Get remote URL for the repository
 * @param {string} dirPath - Directory path
 * @returns {string|null} Remote URL or null
 */
function getRemoteUrl(dirPath) {
  try {
    const url = execSync('git config --get remote.origin.url', {
      cwd: dirPath,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    return url || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get file-specific git information
 * @param {string} filePath - Full file path
 * @param {string} basePath - Base directory path
 * @returns {Object|null} File git info or null
 */
function getFileGitInfo(filePath, basePath) {
  try {
    const relativePath = path.relative(basePath, filePath).replace(/\\/g, '/');

    // Get last commit date and author in one call
    const lastCommitInfo = execSync(`git log -1 --format=%ai%x1f%an -- "${relativePath}"`, {
      cwd: basePath,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();

    // Cross-platform commit count per file (avoids shell pipes like `wc -l`)
    const commitCountRaw = execSync(`git rev-list --count HEAD -- "${relativePath}"`, {
      cwd: basePath,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();

    const [lastModified, lastAuthor] = lastCommitInfo
      ? lastCommitInfo.split('\x1f')
      : [null, null];

    return {
      lastModified: lastModified || null,
      lastAuthor: lastAuthor || null,
      commitCount: parseInt(commitCountRaw, 10) || 0
    };
  } catch (error) {
    return {
      lastModified: null,
      lastAuthor: null,
      commitCount: 0
    };
  }
}

/**
 * Get contributors for the repository
 * @param {string} dirPath - Directory path
 * @returns {Array} List of contributors
 */
function getContributors(dirPath) {
  if (!isGitRepository(dirPath)) {
    return [];
  }

  try {
    const output = execSync('git log --format="%an <%ae>" | sort | uniq', {
      cwd: dirPath,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: '/bin/bash'
    }).trim();

    if (!output) return [];

    return output.split('\n').filter(line => line.trim());
  } catch (error) {
    console.warn('   Warning: Could not fetch contributors');
    return [];
  }
}

/**
 * Get git statistics
 * @param {string} dirPath - Directory path
 * @returns {Object|null} Git statistics
 */
function getGitStatistics(dirPath) {
  if (!isGitRepository(dirPath)) {
    return null;
  }

  try {
    const totalCommits = execSync('git rev-list --count HEAD', {
      cwd: dirPath,
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();

    const contributors = getContributors(dirPath);

    return {
      totalCommits: parseInt(totalCommits, 10) || 0,
      contributorCount: contributors.length,
      contributors
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  isGitRepository,
  getGitInfo,
  getFileGitInfo,
  getContributors,
  getGitStatistics
};
