# Change Log

All notable changes to the "ai-code-roaster" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-10

### Added

- **Initial release of AI Code Roaster** - A VSCode extension that roasts your code with AI-powered humor and wit
- **8 AI personalities** with distinct styles:
  - 4 Chinese roles: 锐评家, 夸夸家, 梗王锐评, 彩虹屁
  - 4 English roles: Code Critic, Code Hype-man, Savage Mode, Hype Lord
- **Real-time streaming responses** from OpenAI-compatible LLM APIs
- **Smart caching system** with intelligent change detection:
  - Re-roasts on role change
  - Re-roasts when >10 lines changed
  - Re-roasts when >60 seconds passed with any changes
- **Auto-refresh** functionality (5-second interval when sidebar visible)
- **Secure API key storage** using VSCode secrets API
- **3 core commands**:
  - `AI Code Roaster: Configure API` - Interactive setup wizard
  - `AI Code Roaster: Delete All Configuration` - Clear all settings
  - `AI Code Roaster: Switch Role` - Quick role picker
- **File validation pipeline** for performance:
  - File type check (43+ supported extensions)
  - File size limit (100KB)
  - Empty content detection
- **Sidebar integration** in Explorer panel with custom icon
- **Theme integration** using VSCode CSS variables for seamless appearance
- **Bilingual documentation** (English & Chinese)

### Supported File Types

JavaScript, TypeScript, JSX, TSX, Vue, Svelte, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C, C++, C#, PHP, Scala, Clojure, Haskell, OCaml, Elixir, Lua, R, MATLAB, Shell, CSS, SCSS, Sass, Less, HTML, JSON, YAML, TOML, INI, CFG, CONF (43+ extensions)

## [Unreleased]
