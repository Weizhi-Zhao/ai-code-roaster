# AI Code Roaster

[中文文档](README.zh-CN.md)

> A VSCode extension that roasts your code with AI-powered humor and wit.

AI Code Roaster analyzes your code files and generates entertaining feedback through 6 different AI personalities. Whether you want a brutal reality check or an ego boost, there's a role for you.

## Features

- **Real-time streaming responses** from compatible LLM APIs
- **6 AI personalities** with distinct styles (3 Chinese + 3 English)
- **Custom Role System** - Create, edit, and delete your own AI personalities
- **Smart caching** with intelligent change detection
- **Auto-refresh** when sidebar is visible
- **Secure API key storage** using VSCode secrets API
- **100+ supported file types** including JavaScript, TypeScript, Python, Go, Rust, Java, and more

## Quick Start

Get started in under 2 minutes:

1. **Install the extension** from VSCode Marketplace
2. **Open the sidebar**: Explorer → "AI Code Roaster" panel
3. **Configure API**: Click the gear icon → "Configure API"
4. **Enter your credentials**:
   - Base URL (e.g., `https://openrouter.ai/api/v1`)
   - Model name (e.g., `nvidia/nemotron-3-nano-30b-a3b:free`)
   - API Key
5. **Open any code file** and enjoy the roast!

### Free APIs

- [OpenRouter](https://openrouter.ai/)
- [ModelScope](https://www.modelscope.cn/my/myaccesstoken)
- [SiliconFlow](https://cloud.siliconflow.cn/me/account/ak)
- [Z.AI](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.7-flash)
- [NVIDIA NIM](https://build.nvidia.com/explore/discover)

## Configuration

### API Settings

Configure your LLM API credentials via the command palette:

- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
- Run `AI Code Roaster: Configure API`

**Required settings:**

| Setting | Description | Example |
|---------|-------------|---------|
| Base URL | Your LLM API endpoint (OpenAI-compatible) | `https://openrouter.ai/api/v1` |
| Model | The model to use for generation | `nvidia/nemotron-3-nano-30b-a3b:free` |
| API Key | Your API key (stored securely) | `sk-...` |

**URL Requirements:**

- Must use HTTPS (for production) OR `http://localhost` (for local development)

### Commands

| Command | Description |
|---------|-------------|
| `aiCodeRoaster.configureApi` | Configure API settings |
| `aiCodeRoaster.deleteApiConfig` | Delete all configuration |
| `aiCodeRoaster.switchRole` | Switch AI personality |
| `aiCodeRoaster.createCustomRole` | Create custom role |
| `aiCodeRoaster.editCustomRole` | Edit custom role |
| `aiCodeRoaster.deleteCustomRole` | Delete custom role |

## AI Personalities

Choose from 6 different AI personalities with unique styles:

### Chinese Roles

| Role | Name | Style | Description |
|------|------|-------|-------------|
| `cn-roaster` | 🔥 锐评家 | Concise, sarcastic | Sharp-witted criticism with Chinese humor |
| `cn-praiser` | ✨ 夸夸家 | Enthusiastic | Extravagant praise that goes hard |
| `cn-reviewer` | 🔍 代码审查官 | Professional | Rigorous, professional code review |

### English Roles

| Role | Name | Style | Description |
|------|------|-------|-------------|
| `en-roaster` | 🔥 Code Critic | Snarky, punchy | Witty criticism with sarcasm |
| `en-praiser` | ✨ Code Hype-man | Energetic | Hype up your code with enthusiasm |
| `en-reviewer` | 🔍 Code Reviewer | Professional | Rigorous, professional code review |

**Switch roles**: Click the account icon in the sidebar header or use `AI Code Roaster: Switch Role`.

## Custom Role System

Create your own AI personalities with the Custom Role System:

### Creating Custom Roles

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run `AI Code Roaster: Create Custom Role`
3. Provide the following information:
   - **Role ID**: A unique identifier (e.g., `my-custom-roaster`)
   - **Name**: Display name (e.g., `🎨 My Custom Role`)
   - **Description**: Short description of the role's style
   - **Header**: Title displayed before the response
   - **System Prompt**: The AI system prompt that defines the role's behavior

### Managing Custom Roles

- **Edit**: Use `AI Code Roaster: Edit Custom Role` to modify existing custom roles
- **Delete**: Use `AI Code Roaster: Delete Custom Role` to remove custom roles
- Custom roles are stored in `globalStorageUri/customRoles.json`

### Role Validation

- Role IDs must contain only letters, numbers, hyphens, and underscores
- Custom role IDs cannot conflict with predefined roles
- All fields (name, description, header, systemPrompt) are required

## Technical Details

### File Validation

The extension validates files in a tiered pipeline (optimized for performance):

1. **File type check** - Validates against supported extensions
2. **File size check** - Maximum 100KB
3. **Empty content check** - Skips empty files

### Supported File Types

```text
JavaScript/TypeScript: .js .ts .jsx .tsx .mjs .cjs .mts .cts
Frontend Frameworks: .vue .svelte .astro
Backend Languages: .py .rb .go .rs .java .kt .kts .swift
C/C++/C#: .c .cpp .cc .cxx .h .hpp .hxx .cs
PHP: .php .phtml
JVM Languages: .scala .sc .clj .cljs .groovy
Functional: .hs .lhs .ml .mli .re .rei .fs .fsi .fsx
Elixir/Erlang: .ex .exs .erl .hrl
Scripting: .lua .r .rmd .pl .pm .t .ps1 .psm1 .psd1
Shell Scripts: .sh .bash .zsh .fish .csh .tcsh .cmd .bat
Dart/Flutter: .dart
Other Compiled: .nim .cr .jl .v .zig .mo .lok
WebAssembly: .wasm .wat
Styling: .css .scss .sass .less .styl .stylus
Markup & Templates: .html .htm .xml .svg .xhtml .md .markdown .rst .adoc
Data Formats: .json .yaml .yml .toml .ini .cfg .conf .graphql .gql
Config Files: .env .dockerfile .makefile .mk .cmake
Protobuf & IDL: .proto .thrift .avsc
Template Engines: .erb .ejs .hbs .mustache .twig .jinja .jinja2
SQL: .sql .psql
MATLAB/Mathematica: .m .wl .nb
Misc: .ahk .vim .el .lisp
```

### Smart Caching

The extension intelligently decides when to re-roast:

- **Role change** → Immediate re-roast
- **>10 lines changed** → Re-roast
- **>60 seconds with changes** → Re-roast
- **Otherwise** → Show cached response

This minimizes API calls while keeping feedback fresh.

### Auto-Refresh

The sidebar automatically refreshes every 10 seconds when visible, ensuring you always see the latest feedback.

## Development

### Prerequisites

- Node.js
- VSCode Engine ^1.74.0

### Build Commands

```bash
npm install        # Install dependencies
npm run compile    # Compile TypeScript
npm run watch      # Watch mode for development
npm run lint       # Run ESLint
npm run test       # Run tests
```

### Project Structure

```
ai-code-roaster/
├── src/
│   ├── extension.ts          # Main entry point, ViewProvider
│   ├── apiClient.ts          # LLM API client (streaming)
│   ├── configurationManager.ts  # Secure config storage
│   ├── roastHistory.ts       # Smart caching with diff
│   ├── webviewContent.ts     # HTML generation
│   ├── roleManager.ts        # Role management (predefined + custom)
│   └── constants.ts          # Roles, file types, constants
└── package.json
```

## License

[GPL-3.0-only](LICENSE)

---

For more details, see the [中文文档](README.zh-CN.md).
