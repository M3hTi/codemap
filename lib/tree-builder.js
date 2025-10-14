const path = require('path');

/**
 * Build a tree structure from file paths
 * @param {string} basePath - Base directory path
 * @param {Array} files - Array of file objects with relativePath property
 * @returns {string}
 */
function buildTree(basePath, files) {
  // Create a tree structure
  const tree = {};

  // Populate the tree with file paths
  files.forEach(file => {
    const parts = file.relativePath.split(path.sep);
    let currentLevel = tree;

    parts.forEach((part, index) => {
      if (!currentLevel[part]) {
        currentLevel[part] = index === parts.length - 1 ? null : {};
      }
      if (currentLevel[part] !== null) {
        currentLevel = currentLevel[part];
      }
    });
  });

  // Convert tree structure to string representation
  const projectName = path.basename(basePath);
  let treeString = projectName + '/\n';
  treeString += renderTree(tree, '', true);

  return treeString;
}

/**
 * Render tree structure as a string
 * @param {Object} tree - Tree object
 * @param {string} prefix - Prefix for the current line
 * @param {boolean} isRoot - Whether this is the root level
 * @returns {string}
 */
function renderTree(tree, prefix = '', isRoot = false) {
  let result = '';
  const entries = Object.entries(tree).sort((a, b) => {
    // Directories first, then files
    const aIsDir = a[1] !== null;
    const bIsDir = b[1] !== null;

    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a[0].localeCompare(b[0]);
  });

  entries.forEach(([name, children], index) => {
    const isLast = index === entries.length - 1;
    const isDirectory = children !== null;

    // Determine the connector characters
    const connector = isLast ? '└── ' : '├── ';
    const extension = isLast ? '    ' : '│   ';

    // Add the current entry
    result += prefix + connector + name + (isDirectory ? '/' : '') + '\n';

    // Recursively render children if it's a directory
    if (isDirectory) {
      result += renderTree(children, prefix + extension);
    }
  });

  return result;
}

/**
 * Count files and directories in the tree
 * @param {Object} tree - Tree object
 * @returns {Object}
 */
function countTreeElements(tree) {
  let files = 0;
  let directories = 0;

  function traverse(node) {
    Object.entries(node).forEach(([name, children]) => {
      if (children === null) {
        files++;
      } else {
        directories++;
        traverse(children);
      }
    });
  }

  traverse(tree);

  return { files, directories };
}

module.exports = {
  buildTree,
  renderTree,
  countTreeElements
};
