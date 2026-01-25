# Change Log

All notable changes to the "ai-code-roaster" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2025-01-25

- **Smart Configuration Update** - New `updateConfig()` helper that detects current configuration level
  - Uses `inspect()` to detect workspace folder, workspace, or global level
  - Updates configuration at the same level where it currently exists
  - Improved UX for migration, role switching, and config deletion
- **Settings Improvements**:
  - Removed default values from `apiBaseUrl` and `modelName` for more flexibility
  - Enhanced setting descriptions with example values

## [0.0.3] - 2025-01-24

- **Custom Role System** - Create, edit, and delete your own AI personalities
  - Custom roles stored in `globalStorageUri/customRoles.json`
  - Full CRUD operations with validation
  - Integrates seamlessly with predefined roles
- **2 Professional Code Reviewer Roles**:
  - `cn-reviewer` (🔍 代码审查官) - Professional Chinese code reviewer
  - `en-reviewer` (🔍 Code Reviewer) - Professional English code reviewer
- **3 New Commands**:
  - `AI Code Roaster: Create Custom Role` - Design your own AI personality
  - `AI Code Roaster: Edit Custom Role` - Modify existing custom roles
  - `AI Code Roaster: Delete Custom Role` - Remove custom roles
- **Role Management Submenu** - New submenu in sidebar for role-related commands
- **Enhanced System Prompts** - All roles now have more detailed, structured prompts for better output quality
- **Configuration Storage** - API URL and model now stored in VSCode workspace settings (not globalState)
- **Configure API Command** - Simplified to open Settings UI or set API key directly
- **Auto-refresh Interval** - Increased from 5 seconds to 10 seconds
- **Supported File Types** - Expanded from 43 to 100+ extensions including:
  - Additional JavaScript variants (`.mjs`, `.cjs`, `.mts`, `.cts`)
  - More template engines (`.erb`, `.ejs`, `.hbs`, `.jinja2`)
  - WebAssembly (`.wasm`, `.wat`)
  - Config files (`.env`, `.dockerfile`, `.cmake`)
  - Many more (see full list in constants.ts)
- **API URL Normalization** - Automatically appends `/chat/completions` if not present
- **Technical Changes**:
  - New module: `src/roleManager.ts` - Manages predefined and custom roles
  - Automatic one-time migration from `globalState` to VSCode settings
  - Role type changed from fixed `RoleType` enum to extensible `string` type
  - Streaming callback simplified from `(chunk, fullContent)` to `(fullContent)`

## [0.0.1] - 2025-01-10

- **Initial release of AI Code Roaster** - A VSCode extension that roasts your code with AI-powered humor and wit
- **4 AI personalities** with distinct styles:
  - 2 Chinese roles: 锐评家, 夸夸家
  - 2 English roles: Code Critic, Code Hype-man
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
