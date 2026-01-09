# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AI Code Roaster is a VS Code extension that provides automatic AI-powered code reviews. When you open or switch to a code file, the extension sends the file content to an AI model (via OpenAI-compatible APIs) which provides sarcastic, humorous but insightful code commentary in Chinese.

**Key Features:**
- Automatic code roasting when switching files (only when sidebar is visible)
- Streaming response display for real-time feedback
- Smart change detection to avoid unnecessary API calls
- Configurable API settings (supports any OpenAI-compatible API)
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

- **`src/extension.ts`** - Main entry point. Implements `WebviewViewProvider`, handles activation/deactivation, registers commands (`aiCodeRoaster.setApiKey`, `aiCodeRoaster.deleteApiKey`, `aiCodeRoaster.refresh`), and wires up all dependencies. Contains the automatic roasting logic with file validation, history comparison, and streaming response handling.

- **`src/apiClient.ts`** - Generic `LlmApiClient` for communicating with OpenAI-compatible APIs. Handles HTTP requests, streaming responses (SSE), error cases (network errors, API errors, rate limits), and provides methods: `roastCodeStream()` for streaming responses, `roastCode()` for simple requests, and `testConnection()` for validating API settings.

- **`src/configurationManager.ts`** - Manages all configuration storage. Sensitive data (API key) uses VS Code's `secrets` API; non-sensitive data (base URL, model) uses `globalState`. Validates URL format (HTTPS required), provides defaults, and supports reset operations.

- **`src/roastHistory.ts`** - Tracks roast history and determines if a file has changed significantly enough to warrant a new roast. Uses `diff` library to calculate line differences. Change is significant if: (1) time since last roast > 60 seconds AND there are line changes, OR (2) line changes exceed 10 lines.

- **`src/webviewContent.ts`** - Pure functions that generate HTML for different UI states: loading spinner, streaming display with cursor animation, API key setup prompt, success response display, error messages, file too large warning, and unsupported file type info. All user content is HTML-escaped for security.

- **`src/constants.ts`** - Centralized configuration including default API URL, model name, secret storage key, file size limits, supported file types, and the Chinese roasting system prompt.

### Design Patterns

- **Dependency Injection**: `AICodeRoasterViewProvider` receives `ConfigurationManager` and `LlmApiClient` via constructor
- **Single Responsibility**: Each class has one clear purpose
- **Webview-based UI**: Uses VS Code's `WebviewViewProvider` for Explorer sidebar integration
- **Strategy Pattern**: Different HTML generation functions for different UI states
- **Module Pattern**: Each file is a self-contained module with clear imports/exports

### Execution Flow

```
activate() →
  create ConfigurationManager →
  create LlmApiClient →
  create AICodeRoasterViewProvider →
  register WebviewViewProvider →
  register commands

onWebviewShown() →
  configManager.getApiKey() →
  (if key exists) → refresh()

User switches file / User clicks refresh →
  refresh() →
  1. Check if webview is active/visible
  2. Get active document
  3. validateFile() (size, type, empty check)
  4. Check RoastHistory.isSignificantChange()
  5. Check API key exists
  6. Show loading state
  7. apiClient.roastCodeStream() →
  8. Display streaming chunks via postMessage
  9. On complete: store history (max 100 entries)
```

### Change Detection Logic

A file is only re-roasted when:
- Time since last roast > 60 seconds AND there are line changes > 0, OR
- Number of line changes > 10

This prevents unnecessary API calls during rapid file editing.

## Important Details

- **VS Code minimum version**: ^1.107.0
- **TypeScript**: Target ES2022, module Node16
- **Output directory**: `out/`
- **Activation events**: Empty array (activates immediately on VS Code start)
- **Extension view ID**: `ai-code-roaster` (registered in [package.json](package.json) under `contributes.views`)
- **Secret storage**: Uses VS Code's `extensionContext.secrets` API, which encrypts keys using the OS credential manager
- **Global state**: API configuration stored in `extensionContext.globalState`
- **Default API URL**: `https://openrouter.ai/api/v1/chat/completions`
- **Default Model**: `nvidia/nemotron-3-nano-30b-a3b:free` (Free tier on OpenRouter)
- **Chinese Roasting Prompt**: The system prompt makes the AI act as a sarcastic 20-year veteran programmer who critiques code humorously but helpfully (defined in `CONSTANTS.ROAST_SYSTEM_PROMPT`)
- **History limit**: Maximum 100 roast history entries per session (oldest removed when exceeded)
- **Supported file types**: `.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.svelte`, `.py`, `.rb`, `.go`, `.rs`, `.java`, `.kt`, `.swift`, `.c`, `.cpp`, `.h`, `.hpp`, `.cs`, `.php`, `.scala`, `.clj`, `.hs`, `.ml`, `.ex`, `.exs`, `.lua`, `.r`, `.m`, `.sh`, `.bash`, `.zsh`, `.css`, `.scss`, `.sass`, `.less`, `.html`, `.json`, `.yaml`, `.yml`, `.toml`, `.ini`, `.cfg`, `.conf`

## Registered Commands

- `aiCodeRoaster.setApiKey` - Prompts user to enter and store their API key
- `aiCodeRoaster.deleteApiKey` - Deletes the stored API key after confirmation
- `aiCodeRoaster.refresh` - Manually trigger a roast of the current file
