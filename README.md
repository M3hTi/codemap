# CodeMap

A powerful CLI tool that scans your project directory and generates comprehensive documentation with statistics, git integration, and multiple output formats.

## ✨ Features

### Core Features
- **Recursive Directory Scanning** - Scans from any subdirectory with automatic project root detection
- **30+ Languages Supported** - JavaScript, TypeScript, Python, Java, C++, Go, Rust, and more
- **Multiple Output Formats** - Markdown, JSON, and HTML
- **Comprehensive Statistics** - Lines of code, file counts, language distribution, and more
- **Git Integration** - Branch info, commit history, and per-file git metadata
- **Smart Content Processing** - Truncation and redaction of sensitive data
- **Flexible Configuration** - CLI arguments and config file support

### Advanced Features
- **Interactive Mode** - Guided configuration wizard for easy setup
- **Watch Mode** - Auto-regenerate documentation on file changes
- **Progress Indicators** - Visual feedback with spinners and progress bars
- **Statistics Dashboard** with language distribution charts and file metrics
- **Git Information** including last modified dates, authors, and commit counts
- **Content Redaction** to automatically detect and hide API keys, tokens, and secrets
- **Smart Truncation** for large files (show first/last portions)
- **File Filtering** by extension or custom patterns
- **Depth Limiting** for directory traversal
- **Custom Output** locations and formats

## 📦 Installation

### Global Installation

```bash
npm install -g @mehti/codemap
```

### Using npx (No Installation)

```bash
npx @mehti/codemap
```

### Local Development

```bash
git clone <repository-url>
cd codemap
npm link
codemap
```

## 🚀 Usage

### Basic Usage

```bash
codemap
```

### Command Line Options

```bash
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
  -h, --help                 Show help message
```

### Examples

```bash
# Generate with defaults
codemap

# Interactive configuration wizard
codemap --interactive

# Watch mode - auto-regenerate on file changes
codemap --watch

# Combine interactive setup with watch mode
codemap -i -w

# Custom output location
codemap --output docs/CODE.md

# Only JavaScript and TypeScript files
codemap --filter .js,.ts

# JSON output format
codemap --format json --output codemap.json

# HTML documentation
codemap --format html --output docs/index.html

# Structure and stats only (no file contents)
codemap --no-content

# Large project with truncation
codemap --max-size 2MB --truncate 200

# Redact sensitive information
codemap --redact

# Exclude test files
codemap --exclude "*.test.js,*.spec.js"

# Limit scanning depth
codemap --depth 3

# Combine multiple options
codemap --filter .js,.ts --format json --redact --truncate
```

## 🧙 Interactive Mode

Run the interactive configuration wizard to set up your preferences step by step:

```bash
codemap --interactive
# or
codemap -i
```

The wizard guides you through:
- Output format selection (Markdown, JSON, HTML)
- Output file path
- File type filtering
- Exclusion patterns
- Maximum file size
- Directory depth limits
- Content truncation settings
- Sensitive data redaction
- Statistics and git integration options

A summary is shown before proceeding, allowing you to confirm or cancel.

## 👁️ Watch Mode

Enable watch mode to automatically regenerate documentation when files change:

```bash
codemap --watch
# or
codemap -w
```

Features:
- Monitors all project directories for changes
- Debounces rapid changes (500ms) to avoid excessive regeneration
- Shows timestamped logs of detected changes
- Press `Ctrl+C` to stop watching

Combine with interactive mode for initial setup:
```bash
codemap -i -w
```

## ⚙️ Configuration File

Create a `.codemaprc.json` in your project root for persistent settings:

```json
{
  "output": "docs/CODEMAP.md",
  "format": "markdown",
  "maxFileSize": "2MB",
  "filter": [".js", ".ts", ".jsx", ".tsx"],
  "exclude": ["*.test.js", "*.spec.js"],
  "ignoreDirs": ["temp", "cache"],
  "stats": true,
  "git": true,
  "truncate": false,
  "redact": false
}
```

**Note:** CLI arguments take precedence over config file settings.

## 📊 Output Features

### Markdown Output (Default)

The generated markdown includes:

1. **Header** - Project name and generation timestamp
2. **Table of Contents** - Quick navigation
3. **Project Overview** - Directory path and root detection
4. **Statistics Dashboard**
   - Total files, lines of code, and size
   - Language distribution chart
   - File size breakdown
   - Largest files table
5. **Git Information** - Branch, commit hash, last commit date, and remote URL
6. **Project Structure** - ASCII tree view
7. **File Summary** - Table with all files, types, and sizes
8. **File Contents** - Full content with syntax highlighting and git metadata

### JSON Output

Structured JSON data perfect for:
- CI/CD integration
- Custom processing pipelines
- Data analysis tools
- API consumption

### HTML Output

Beautiful, browsable HTML documentation with:
- Modern, GitHub-inspired styling
- Responsive design
- Syntax-highlighted code blocks
- Interactive navigation

## 📈 Statistics Dashboard

The statistics section provides:

- **Total Metrics**: Files, lines of code, total size
- **Language Distribution**: ASCII chart showing percentage breakdown
- **File Size Categories**: Small, medium, large, very large
- **Largest Files**: Top 10 files by size and line count
- **Language Breakdown**: Files, lines, and size per language

Example output:
```
📊 Total Files: 45
📏 Total Lines of Code: 12,547
💾 Total Size: 342.15 KB

Language Distribution:
JavaScript      ████████████████████ 45.2% (15 files, 5,672 lines)
TypeScript      ███████████████ 33.8% (18 files, 4,238 lines)
Python          ████████ 18.5% (8 files, 2,321 lines)
JSON            ██ 2.5% (4 files, 316 lines)
```

## 🔒 Security Features

### Automatic Redaction

When using `--redact`, CodeMap automatically detects and redacts:

- API keys and tokens
- AWS access keys
- GitHub tokens
- Private keys (RSA, EC, etc.)
- JWT tokens
- Passwords
- Private IP addresses
- Generic secrets and bearer tokens

**Example:**
```javascript
// Before redaction
const apiKey = "sk_live_51ABC123...";

// After redaction
const apiKey = '[REDACTED_API_KEY]';
```

## 🎯 Supported File Types

### Programming Languages
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

### Frameworks & Web
- **Frameworks**: `.vue`, `.svelte`
- **Web**: `.html`, `.css`, `.scss`

### Configuration & Documentation
- **Config**: `.json`, `.xml`, `.yaml`, `.yml`, `.toml`
- **Documentation**: `.md`, `.txt`

## 🚫 Ignored Directories

CodeMap automatically skips:

- `node_modules`, `.git`, `.svn`, `.hg`
- `dist`, `build`, `out`, `target`, `bin`, `obj`
- `.next`, `.nuxt`, `.cache`, `coverage`
- `__pycache__`, `.pytest_cache`
- `.venv`, `venv`, `env`
- `.idea`, `.vscode`

Add custom ignore directories via configuration or `--exclude` flag.

## 🎨 Use Cases

- **AI/LLM Context** - Prepare comprehensive codebase context for AI assistants
- **Documentation** - Generate quick documentation for code reviews
- **Onboarding** - Help new team members understand project structure
- **Code Audits** - Get a comprehensive view with statistics and metrics
- **Archiving** - Create snapshots of project code at specific points
- **Analysis** - Export to JSON for custom analysis tools

## 🔧 Advanced Usage

### Filtering for Specific Languages

```bash
# Only Python files
codemap --filter .py

# Only web technologies
codemap --filter .html,.css,.js

# Backend only
codemap --filter .java,.sql,.xml
```

### Large Project Optimization

```bash
# No content, just structure and stats
codemap --no-content

# Truncate large files
codemap --truncate 100

# Limit file size and depth
codemap --max-size 500KB --depth 5
```

### CI/CD Integration

```bash
# Generate JSON for automated processing
codemap --format json --no-git > codemap.json

# Create documentation in docs folder
codemap --output docs/CODEBASE.md --redact
```

## 🐛 Troubleshooting

### Permission Errors

If you encounter permission errors:
- `Permission denied: Cannot read file` - File access is restricted
- `Permission denied: Cannot access directory` - Directory access is restricted
- `Permission denied: Cannot write` - Output location is read-only

On Unix systems:
```bash
chmod +x cli.js
```

### No Files Found

- Check that you're in the correct directory
- Verify files have recognized extensions
- Ensure files aren't in ignored directories
- Use `--filter` to explicitly specify extensions

### Large Files Skipped

Files larger than the max size limit are automatically skipped. Adjust with:
```bash
codemap --max-size 5MB
```

Or use truncation:
```bash
codemap --truncate 200
```

## 📋 Requirements

- Node.js >= 14.0.0

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 🔗 Links

- **NPM Package**: https://www.npmjs.com/package/@mehti/codemap
- **Repository**: [GitHub Repository URL]

## 📝 Changelog

### Version 1.2.0 (Latest)

**New Features:**
- 🧙 Interactive mode (`-i, --interactive`) - Guided configuration wizard
- 👁️ Watch mode (`-w, --watch`) - Auto-regenerate on file changes
- 🔄 Progress indicators - Animated spinners and progress bars for visual feedback

**Improvements:**
- Cleaner console output during scanning
- Better user experience with real-time progress updates

### Version 1.1.0

**New Features:**
- ✨ CLI argument parsing with extensive options
- ⚙️ Configuration file support (`.codemaprc.json`)
- 📊 Statistics dashboard with language distribution
- 📈 Metrics: LOC, file counts, size analysis
- 🔗 Git integration (branch, commits, authors)
- 🔒 Automatic sensitive data redaction
- ✂️ Smart content truncation for large files
- 📄 Multiple output formats (Markdown, JSON, HTML)
- 🎯 File filtering and exclusion patterns
- 📏 Directory depth limiting
- 🎨 Beautiful HTML output with modern styling

**Improvements:**
- Enhanced error handling and reporting
- Better performance for large projects
- Cross-platform path normalization
- Improved documentation and examples

### Version 1.0.2
- Package renaming and improvements
- Better README documentation

### Version 1.0.1
- Initial stable release
- Basic scanning and markdown generation

---

**Made with ❤️ for developers who love documentation**
