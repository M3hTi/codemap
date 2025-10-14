# CodeMap

A powerful CLI tool that scans your project directory and generates comprehensive Markdown documentation of all code files.

## Features

- Recursively scans directories for code files
- Supports 30+ programming languages and file types
- Generates a clean, formatted Markdown document with:
  - Project structure tree view (when run from project root)
  - File summary table with sizes and types
  - Full file contents with syntax-highlighted code blocks
- Automatically detects project root (via `.git` or `package.json`)
- Ignores common build directories and dependencies (node_modules, dist, etc.)
- Handles large files gracefully (skips files over 1MB)

## Installation

### Global Installation

Install globally to use `codemap` command anywhere:

```bash
npm install -g codemap
```

### Using npx (No Installation Required)

Run directly without installation:

```bash
npx codemap
```

### Local Development

Clone and test locally:

```bash
git clone <repository-url>
cd codemap
npm link
codemap
```

## Usage

Navigate to any project directory and run:

```bash
codemap
```

This will:
1. Scan all code files in the current directory and subdirectories
2. Generate a `CODEMAP.md` file in the current directory
3. Include a project tree structure if running from project root

### Example Output

```
🗺️  CodeMap - Scanning your project...

📂 Working directory: /path/to/your/project
📍 Project root detected: Yes

🔍 Scanning files...
✅ Found 15 code file(s)

🌳 Building project tree...
📝 Generating markdown documentation...

✨ Success! Documentation generated at:
   /path/to/your/project/CODEMAP.md
```

## Supported File Types

CodeMap recognizes and processes the following file types:

- **JavaScript/TypeScript**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Python**: `.py`
- **Java**: `.java`
- **C/C++**: `.c`, `.cpp`, `.h`, `.hpp`
- **C#**: `.cs`
- **Go**: `.go`
- **Rust**: `.rs`
- **Ruby**: `.rb`
- **PHP**: `.php`
- **Swift**: `.swift`
- **Kotlin**: `.kt`
- **Scala**: `.scala`
- **Shell**: `.sh`, `.bash`
- **SQL**: `.sql`
- **R**: `.r`
- **Objective-C**: `.m`, `.mm`
- **Dart**: `.dart`
- **Frameworks**: `.vue`, `.svelte`
- **Web**: `.html`, `.css`, `.scss`
- **Config**: `.json`, `.xml`, `.yaml`, `.yml`, `.toml`
- **Documentation**: `.md`, `.txt`

## Ignored Directories

CodeMap automatically skips the following directories:

- `node_modules`, `.git`, `.svn`, `.hg`
- `dist`, `build`, `out`, `target`, `bin`, `obj`
- `.next`, `.nuxt`, `.cache`, `coverage`
- `__pycache__`, `.pytest_cache`
- `.venv`, `venv`, `env`
- `.idea`, `.vscode`

## Output Format

The generated `CODEMAP.md` includes:

1. **Header** - Project name and generation timestamp
2. **Table of Contents** - Quick navigation links
3. **Project Overview** - Directory path and root detection status
4. **Project Structure** - ASCII tree view (if in project root)
5. **File Summary** - Table with all files, types, and sizes
6. **File Contents** - Full content of each file with syntax highlighting

## Configuration

Currently, CodeMap uses sensible defaults. Future versions may include:
- Custom ignore patterns
- Configurable file size limits
- Output format options
- Filter by file type

## Requirements

- Node.js >= 14.0.0

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Use Cases

- **Documentation**: Generate quick documentation for code reviews
- **Onboarding**: Help new team members understand project structure
- **Archiving**: Create snapshots of project code at specific points
- **AI/LLM Input**: Prepare codebase context for AI assistants
- **Code Audits**: Get a comprehensive view of all code files

## Troubleshooting

### Permission Errors

If you encounter permission errors on Unix systems, make sure the CLI file is executable:

```bash
chmod +x cli.js
```

### No Files Found

If CodeMap reports no files found:
- Check that you're in the correct directory
- Verify your files have recognized extensions
- Ensure files aren't in ignored directories

### Large Files Skipped

Files larger than 1MB are automatically skipped to prevent memory issues. The markdown will show a placeholder message for these files.

## Credits

Created to help developers quickly document and share their codebases.
