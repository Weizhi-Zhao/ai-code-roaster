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

### Key Components

| File | Purpose |
|------|---------|
| [src/extension.ts](src/extension.ts) | Main entry point, registers webview and commands, contains `AICodeRoasterViewProvider` |
| [src/apiClient.ts](src/apiClient.ts) | Handles LLM API communication (streaming/non-streaming) |
| [src/configurationManager.ts](src/configurationManager.ts) | Manages API key (secrets storage) and config (globalState) |
| [src/roastHistory.ts](src/roastHistory.ts) | Smart caching with diff-based change detection |
| [src/webviewContent.ts](src/webviewContent.ts) | Generates HTML for all webview states |
| [src/constants.ts](src/constants.ts) | Defines file types, limits, and role configurations |

### Storage Strategy
- **API Key**: VSCode secrets API (`context.secrets`)
- **API config** (baseUrl, model): `globalState`
- **Role preference**: `globalState`
- **Response cache**: In-memory `Map` (max 100 entries per file path)

### Smart Change Detection
Located in [src/roastHistory.ts:52](src/roastHistory.ts#L52), `isSignificantChange()` determines when to re-roast:
- Role change → immediate re-roast
- Time ≥ 60s AND any line changes → re-roast
- Line changes > 10 → re-roast
- Otherwise → show cached response

### File Validation Pipeline
Located in [src/extension.ts:210](src/extension.ts#L210), optimized for performance:
1. File type check (string match, fastest)
2. File size check ([`vscode.workspace.fs.stat`](src/extension.ts#L224), no content load)
3. Empty content check ([`document.getText()`](src/extension.ts#L244), only if needed)

### WebView Communication
- Extension → WebView: `postMessage({ type: 'chunk' | 'done' | 'error', content: string })`
- WebView receives via `window.addEventListener('message', ...)`
- Auto-scrolling during streaming

## Important Constraints
- **Max file size**: 100KB (`CONSTANTS.MAX_FILE_SIZE`)
- **Max cache entries**: 100 per `RoastHistory` map
- **Auto-refresh interval**: 5 seconds (`CONSTANTS.AUTO_REFRESH_INTERVAL`)
- **Streaming format**: Server-Sent Events (SSE)
