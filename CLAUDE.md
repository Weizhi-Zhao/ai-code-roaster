# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run compile` - Compile TypeScript (`tsc -p ./`)
- `npm run watch` - Watch mode for development (`tsc -watch -p ./`)
- `npm run lint` - Run ESLint (`eslint src`)
- `npm run test` - Run VSCode extension tests (`vscode-test`)
- `npm run pretest` - Compile and lint before tests

## Architecture Overview

### Extension Flow
1. User opens a file in VSCode
2. `AICodeRoasterViewProvider` auto-refreshes (5-second interval when visible)
3. File validation pipeline runs (type → size → content)
4. `RoastHistory` checks if re-roast is needed (smart change detection)
5. `LlmApiClient` calls configured LLM API with streaming
6. WebView displays response in real-time

### Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode Extension Host                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   WebView (UI)   │◄────────┤   ViewProvider   │         │
│  │  - User Display  │  postMsge│  - Orchestration │         │
│  │  - Event Handler │         │  - Auto-refresh  │         │
│  └──────────────────┘         └────────┬─────────┘         │
│                                        │                     │
│                          ┌─────────────┼─────────────┐      │
│                          ▼             ▼             ▼      │
│                  ┌───────────┐ ┌──────────┐ ┌────────────┐  │
│                  │RoastHistory│ │ConfigMgr │ │LlmApiClient│  │
│                  │- Cache     │ │- Secrets │ │- Streaming │  │
│                  │- Diff      │ │- State   │ │- SSE       │  │
│                  └───────────┘ └──────────┘ └─────┬──────┘  │
│                                                      │       │
└──────────────────────────────────────────────────────┼───────┘
                                                       │
                                                       ▼
                                              ┌──────────────┐
                                              │ LLM API      │
                                              │ (OpenAI-     │
                                              │  compatible) │
                                              └──────────────┘
```

### Key Components

| File | Lines | Purpose |
|------|-------|---------|
| [src/extension.ts](src/extension.ts) | 413 | Main entry point, `AICodeRoasterViewProvider` class, command registration |
| [src/apiClient.ts](src/apiClient.ts) | 235 | `LlmApiClient` class for streaming/non-streaming API calls |
| [src/configurationManager.ts](src/configurationManager.ts) | 119 | `ConfigurationManager` for secure config storage |
| [src/roastHistory.ts](src/roastHistory.ts) | 68 | `RoastHistory` for smart caching with change detection |
| [src/webviewContent.ts](src/webviewContent.ts) | 286 | HTML generation for all webview states |
| [src/constants.ts](src/constants.ts) | 77 | Role configs, file types, constants |

## Role System

The extension supports 4 AI personalities with rich, culture-specific prompts:

| Role ID | Name | Description | Style |
|---------|------|-------------|-------|
| `cn-roaster` | 🔥 锐评家 | 毒舌嘲讽，短小精悍 | Chinese internet slang ("依托答辩", "绝绝子", "CPU干烧了") |
| `cn-praiser` | ✨ 夸夸家 | 花式狂夸，让人上头 | Chinese hype language ("优雅", "艺术品", "神仙代码") |
| `en-roaster` | 🔥 Code Critic | Snarky roasting, punchy | English slang ("copium", "skill issue", "L") |
| `en-praiser` | ✨ Code Hype-man | Wild praise, addictive | English hype ("god-tier", "bussin", "goated") |

**Default role**: `cn-roaster` (defined in [src/constants.ts:14](src/constants.ts#L14))

**Example prompts**:
- Chinese roaster uses: "家人们谁懂啊", "我直接好家伙", "笑拥了" with 💀🤡😭🔥👊 emojis
- English roaster uses: "Bruh", "Yoooo", "Ain't no way" with 💀🤡😭🔥👊 emojis

## Commands

### `aiCodeRoaster.configureApi`
Interactive configuration wizard located in [src/extension.ts:307-367](src/extension.ts#L307-L367):
1. Prompts for API Base URL (validates HTTPS or localhost)
2. Prompts for Model Name
3. Prompts for API Key (password input)
4. Saves to secrets storage and globalState
5. Triggers sidebar refresh

### `aiCodeRoaster.deleteApiConfig`
Clears all configuration with confirmation modal ([src/extension.ts:371-384](src/extension.ts#L371-L384)):
- Deletes API key from secrets
- Deletes config from globalState
- Shows success notification

### `aiCodeRoaster.switchRole`
Quick pick role selector ([src/extension.ts:388-409](src/extension.ts#L388-L409)):
- Shows all 4 role options with descriptions
- Updates role preference in globalState
- Triggers re-roast with new role

## Storage Strategy

- **API Key**: VSCode secrets API (`context.secrets`) - encrypted, secure
- **API Config** (baseUrl, model): `globalState` - persistent across sessions
- **Role Preference**: `globalState` - allows quick role switching
- **Response Cache**: In-memory `Map<string, RoastHistory>` (max 100 entries per file path)

### URL Validation
API Base URL must be:
- HTTPS (for production)
- OR `http://localhost` (for local development)

Defined in [src/configurationManager.ts:45](src/configurationManager.ts#L45).

### Role Migration
The system handles role schema changes with automatic fallback to `DEFAULT_ROLE` for invalid entries ([src/configurationManager.ts:82](src/configurationManager.ts#L82)).

## Smart Change Detection

Located in [src/roastHistory.ts:52](src/roastHistory.ts#L52), `isSignificantChange()` uses the `diff` library to calculate line differences:

```typescript
const changes = diffLines(oldContent, newContent);
const lineChanges = changes.filter(c => c.added || c.removed).length;
```

**Re-roast conditions**:
1. Role change → immediate re-roast
2. Time ≥ 60 seconds AND any line changes → re-roast
3. Line changes > 10 → re-roast (regardless of time)
4. Otherwise → show cached response

**Constants**:
- `MIN_TIME_INTERVAL`: 60 seconds ([src/constants.ts:64](src/constants.ts#L64))
- `MIN_LINE_CHANGES`: 10 lines ([src/constants.ts:65](src/constants.ts#L65))

## File Validation Pipeline

Located in [src/extension.ts:229-273](src/extension.ts#L229-L273), optimized for performance in order of execution:

1. **File Type Check** (fastest - string comparison)
   - Validates against 43 supported extensions
   - Returns immediately if unsupported

2. **File Size Check** (no content loading)
   - Uses `vscode.workspace.fs.stat(uri)`
   - Returns if > 100KB

3. **Empty Content Check** (only if needed)
   - Uses `document.getText()`
   - Returns if file is empty

**Supported file types**: 43 extensions including .js, .ts, .py, .go, .rs, .java, .cpp, .html, .css, .json, etc. ([src/constants.ts:67-75](src/constants.ts#L67-L75))

## WebView Communication

### Extension → WebView
```typescript
webviewView.webview.postMessage({
    type: 'chunk' | 'done' | 'error',
    content: string
});
```

### WebView → Extension
```javascript
window.addEventListener('message', event => {
    const { type, content } = event.data;
    // Handle chunk, done, error
});
```

### WebView States

The WebView generates different HTML based on state ([src/webviewContent.ts](src/webviewContent.ts)):

| State | Template | Description |
|-------|----------|-------------|
| Loading | `generateLoadingHtml()` | Shows spinner animation |
| No API Key | `generateNoApiKeyHtml()` | Prompt to configure API |
| Too Large | `generateErrorHtml()` | File > 100KB error |
| Unsupported | `generateErrorHtml()` | File type not supported |
| Empty File | `generateErrorHtml()` | File is empty |
| API Error | `generateApiErrorHtml()` | API call failure |
| Streaming | `generateResponseHtml()` + cursor | Live response with cursor |
| Cached | `generateResponseHtml()` | Saved response |

### Theming Integration

Uses VSCode CSS variables for seamless theme integration:
- `var(--vscode-foreground)` - Text color
- `var(--vscode-editor-background)` - Background
- `var(--vscode-textLink-foreground)` - Links
- `var(--vscode-input-background)` - Input fields
- `var(--vscode-button-background)` - Buttons

Full list in [src/webviewContent.ts:8-19](src/webviewContent.ts#L8-L19).

## AICodeRoasterViewProvider Class

The main controller class in [src/extension.ts:29-287](src/extension.ts#L29-L287).

### Properties
- `_view: vscode.WebviewView` - The webview instance
- `_isActive: boolean` - Sidebar visibility state
- `roastHistoryMap: Map<string, RoastHistory>` - Per-file cache
- `_refreshTimerId: NodeJS.Timeout` - Auto-refresh timer
- `_isRefreshing: boolean` - Concurrency guard

### Methods
- `resolveWebviewView()` - Initialize webview, start timer
- `refresh()` - Main orchestration ([lines 118-220](src/extension.ts#L118-L220))
- `validateFile()` - Three-tier validation ([lines 229-273](src/extension.ts#L229-L273))
- `startRefreshTimer()` - 5-second interval
- `stopRefreshTimer()` - Clear timer
- `dispose()` - Cleanup

## Error Handling

### API Errors

`ApiClientError` class ([src/apiClient.ts:13-17](src/apiClient.ts#L13-L17)) with status codes:

| Code | Meaning | User Message |
|------|---------|--------------|
| 401 | Unauthorized | API key invalid |
| 429 | Rate Limited | Too many requests |
| 5xx | Server Error | LLM API issue |
| Network | Connection Failed | Network/CORS error |

### Error Display

- **Validation errors**: Specific UI states per error type
- **API errors**: Streamed to WebView with context
- **Global errors**: VSCode notification popup

## Important Constraints

| Constant | Value | Location |
|----------|-------|----------|
| `MAX_FILE_SIZE` | 100KB | [src/constants.ts:63](src/constants.ts#L63) |
| `MIN_TIME_INTERVAL` | 60 seconds | [src/constants.ts:64](src/constants.ts#L64) |
| `MIN_LINE_CHANGES` | 10 lines | [src/constants.ts:65](src/constants.ts#L65) |
| `AUTO_REFRESH_INTERVAL` | 5 seconds | [src/constants.ts:66](src/constants.ts#L66) |
| `MAX_CACHE_ENTRIES` | 100 | Per RoastHistory map |

## Development Patterns

### Performance Optimization

1. **Tiered Validation**: Fastest checks first (type → size → content)
2. **Lazy Loading**: Only load file content when necessary
3. **Smart Caching**: Diff-based change detection reduces API calls
4. **Streaming**: SSE for real-time updates, no full buffer wait

### Streaming Architecture

- **Format**: Server-Sent Events (SSE)
- **Parsing**: Line-by-line with `data:` prefix detection
- **Markdown**: Server-side rendering (SSR) via `marked` library
- **Auto-scroll**: WebView scrolls to bottom during streaming

### Security Considerations

- API keys stored in VSCode secrets API (never plain text)
- URL validation enforces HTTPS (localhost exception)
- No hardcoded credentials or tokens
- Input validation on all user configuration

### User Experience Patterns

- **Auto-refresh**: 5-second interval when visible
- **Progressive Enhancement**: Graceful degradation through validation states
- **Live Feedback**: Real-time streaming with cursor animation
- **Smart Re-use**: Intelligent caching reduces latency

### Concurrency Control

- `_isRefreshing` flag prevents overlapping refresh calls
- Timer cleanup on visibility change prevents multiple intervals
- Sequential refresh with early returns

## Testing

Current test setup ([src/test/extension.test.ts](src/test/extension.test.ts)):
- Minimal test suite with only sample test
- Uses VSCode test framework (`vscode-test`)
- Run with `npm run test`
- **No integration tests** currently implemented

## Dependencies

### Runtime
- `diff@8.0.2` - Line-by-line diff calculation for change detection
- `marked@17.0.1` - Markdown to HTML conversion

### Dev
- TypeScript, ESLint, @types/vscode
- VSCode test frameworks (@vscode/test-cli, @vscode/test-electron)

## Streaming Format

The extension uses Server-Sent Events (SSE) for streaming responses:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":" world"}}]}

data: [DONE]
```

Parsed in [src/apiClient.ts:94-123](src/apiClient.ts#L94-L123).
