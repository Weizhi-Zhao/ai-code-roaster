# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI Code Roaster is a VS Code extension that provides automatic AI-powered code reviews. When you open or switch to a code file, the extension sends the file content to an AI model (via OpenRouter's API) which provides sarcastic, humorous but insightful code commentary in Chinese.

**Key Features:**
- Automatic code roasting when switching files (only when sidebar is visible)
- 1-second debounce delay to prevent API spam
- File validation (100KB size limit, supported file types, non-empty check)
- Secure API key storage using VS Code's secret storage API

## Development Commands

```bash
npm run compile          # Compile TypeScript (tsc -p ./)
npm run watch           # Watch mode for continuous compilation
npm run lint            # Run ESLint on src directory
npm run test            # Run VS Code tests (requires pretest: compile + lint)
npm run vscode:prepublish  # Compile before publishing
```

## Architecture

The extension follows a clean modular design with dependency injection:

### Key Modules

- **`src/extension.ts`** - Main entry point. Implements `WebviewViewProvider`, handles activation/deactivation, registers commands (`aiCodeRoaster.setApiKey`, `aiCodeRoaster.deleteApiKey`), and wires up all dependencies. Contains the automatic roasting logic with debouncing and file validation.

- **`src/apiClient.ts`** - `OpenRouterClient` class for communicating with OpenRouter's API. Handles HTTP requests, error cases (network errors, API errors, rate limits), and returns formatted string responses. Provides `sendMessage()` for simple messages and `roastCode()` for code review with system prompt.

- **`src/secretManager.ts`** - Wraps VS Code's secret storage API for secure API key management. Provides `getApiKey()`, `storeApiKey()`, and `deleteApiKey()` methods.

- **`src/webviewContent.ts`** - Pure functions that generate HTML for different UI states: loading spinner, API key setup prompt, success response display, error messages, file too large warning, and unsupported file type info. All user content is HTML-escaped for security.

- **`src/constants.ts`** - Centralized configuration including API URL, model name, secret storage key, file size limits, supported file types, and the Chinese roasting system prompt.

### Design Patterns

- **Dependency Injection**: `AICodeRoasterViewProvider` receives `SecretManager` and `OpenRouterClient` via constructor
- **Single Responsibility**: Each class has one clear purpose
- **Webview-based UI**: Uses VS Code's `WebviewViewProvider` for Explorer sidebar integration

### Execution Flow

```
activate() →
  create SecretManager →
  create OpenRouterClient →
  create AICodeRoasterViewProvider →
  register WebviewViewProvider →
  register onDidChangeActiveTextEditor listener

onWebviewShown() →
  secretManager.getApiKey() →
  (if key exists) → roast active file (if any)

User switches file →
  onDidChangeActiveTextEditor event →
  (if sidebar visible) → roastFile() →
  (after 1s debounce) → performRoast() →
  validateFile() →
  updateWebview(loading) →
  apiClient.roastCode() →
  updateWebview(success/error)
```

### Code Roasting Logic

When a user switches to a new file:

1. **Visibility Check**: Only triggers if the sidebar panel is visible
2. **Debounce**: 1-second delay to avoid API spam during rapid file switching
3. **Skip Duplicate**: Won't re-roast the same file twice in a row
4. **Validation**: Checks file size (<100KB), file type (supported extensions), and non-empty content
5. **API Request**: Sends file name and content with a Chinese system prompt for sarcastic review
6. **Display**: Shows loading state, then displays the AI response or error

## Important Details

- **VS Code minimum version**: ^1.107.0
- **TypeScript**: Target ES2022, module Node16
- **Output directory**: `out/`
- **Activation events**: Empty array (activates immediately on VS Code start)
- **Extension view ID**: `ai-code-roaster` (registered in [package.json](package.json#L19) under `contributes.views`)
- **Secret storage**: Uses VS Code's `extensionContext.secrets` API, which encrypts keys using the OS credential manager
- **Chinese Roasting Prompt**: The system prompt makes the AI act as a sarcastic 20-year veteran programmer who critiques code humorously but helpfully (defined in `CONSTANTS.ROAST_SYSTEM_PROMPT`)
- **Supported file types**: `.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.svelte`, `.py`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.swift`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.php`, `.scala`, `.clj`, `.hs`, `.ml`, `.ex`, `.exs`, `.lua`, `.r`, `.m`, `.sh`, `.bash`, `.zsh`, `.css`, `.scss`, `.sass`, `.less`, `.html`, `.json`, `.yaml`, `.yml`, `.toml`, `.ini`, `.cfg`, `.conf`

## Registered Commands

- `aiCodeRoaster.setApiKey` - Prompts user to enter and store their OpenRouter API key
- `aiCodeRoaster.deleteApiKey` - Deletes the stored API key after confirmation
