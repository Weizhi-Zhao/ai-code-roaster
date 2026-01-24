# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Version & Development

- **Current Version**: 0.0.3
- **Minimum VSCode Version**: 1.74.0
- **License**: GPL-3.0-only

**Commands**:

- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode for development
- `npm run lint` - Run ESLint
- `npm run test` - Run VSCode extension tests

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCode Extension Host                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   WebView (UI)   │◄────────┤   ViewProvider   │         │
│  │  - postMessage   │         │  - refresh()     │         │
│  │  - Event Handler │         │  - validateFile()│         │
│  └──────────────────┘         └────────┬─────────┘         │
│                                        │                     │
│                          ┌─────────────┼─────────────┐      │
│                          ▼             ▼             ▼      │
│                  ┌───────────┐ ┌──────────┐ ┌────────────┐  │
│                  │RoastHistory│ │ConfigMgr │ │LlmApiClient│  │
│                  │- Cache     │ │- Secrets │ │- Streaming │  │
│                  │- Diff      │ │- Settings│ │- SSE       │  │
│                  │            │ │- Roles   │              │  │
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

**Extension Flow**:

1. User opens file → `AICodeRoasterViewProvider` auto-refreshes (10-second interval when visible)
2. File validation pipeline (type → size → content)
3. `RoastHistory.isSignificantChange()` determines if re-roast needed
4. `LlmApiClient.roastCodeStream()` calls LLM API with SSE streaming
5. WebView displays response in real-time via postMessage

## Key Components

| File | Lines | Purpose |
|------|-------|---------|
| [src/extension.ts](src/extension.ts) | ~600 | Main entry point, `AICodeRoasterViewProvider`, command registration |
| [src/apiClient.ts](src/apiClient.ts) | ~256 | `LlmApiClient` for streaming/non-streaming API calls |
| [src/configurationManager.ts](src/configurationManager.ts) | ~196 | `ConfigurationManager` - config, secrets, role delegation |
| [src/roleManager.ts](src/roleManager.ts) | ~198 | `RoleManager` - predefined + custom roles, file storage |
| [src/roastHistory.ts](src/roastHistory.ts) | ~68 | `RoastHistory` for smart caching with diff-based change detection |
| [src/webviewContent.ts](src/webviewContent.ts) | ~330 | HTML generation for all webview states |
| [src/constants.ts](src/constants.ts) | ~214 | Predefined roles (6), file types, constants |

## Role System

### Predefined Roles (6)

**Default**: `cn-roaster` ([src/constants.ts:4](src/constants.ts#L4))

| Role ID | Name | Description |
|---------|------|-------------|
| `cn-roaster` | 🔥 锐评家 | 毒舌嘲讽，短小精悍 |
| `cn-praiser` | ✨ 夸夸家 | 花式狂夸，让人上头 |
| `en-roaster` | 🔥 Code Critic | Snarky roasting, punchy |
| `en-praiser` | ✨ Code Hype-man | Wild praise, addictive |
| `cn-reviewer` | 🔍 代码审查官 | 专业严谨的代码审查 |
| `en-reviewer` | 🔍 Code Reviewer | Professional, rigorous code review |

### Custom Roles

Users can create unlimited custom roles with:

- `id`, `name`, `description`, `header`, `systemPrompt`
- Stored in `globalStorageUri/customRoles.json`
- Loaded on activation via `configManager.initRoles()`

### RoleConfig Interface

```typescript
interface RoleConfig {
    id: string;
    name: string;
    description: string;
    header: string;
    systemPrompt: string;
    isCustom: boolean;  // true for custom roles
}
```

## Commands

| Command | Description | Location |
| :--- | :--- | :--- |
| `aiCodeRoaster.configureApi` | Configure API (URL, model, key) | [extension.ts:319-353](src/extension.ts#L319-L353) |
| `aiCodeRoaster.deleteApiConfig` | Delete all configuration | [extension.ts:356-370](src/extension.ts#L356-L370) |
| `aiCodeRoaster.switchRole` | Quick pick role selector | [extension.ts:373-400](src/extension.ts#L373-L400) |
| `aiCodeRoaster.createCustomRole` | Create new custom role | [extension.ts:403-475](src/extension.ts#L403-L475) |
| `aiCodeRoaster.editCustomRole` | Edit existing custom role | [extension.ts:478-536](src/extension.ts#L478-L536) |
| `aiCodeRoaster.deleteCustomRole` | Delete a custom role | [extension.ts:539-595](src/extension.ts#L539-L595) |

## Storage Strategy

| Data | Storage | Location |
| :--- | :--- | :--- |
| API Key | VSCode secrets API (encrypted) | `context.secrets` |
| API Config (baseUrl, model) | VSCode workspace settings | `aiCodeRoaster.apiBaseUrl`, `aiCodeRoaster.modelName` |
| Role Preference | VSCode workspace settings | `aiCodeRoaster.role` |
| Custom Roles | JSON file | `globalStorageUri/customRoles.json` |
| Response Cache | In-memory Map | `Map<string, RoastHistory>` (max 100 entries) |

### One-time Migration

On first activation, config migrates from old `globalState` to new settings system:

- Runs via `configManager.migrateIfNeeded()` ([extension.ts:299](src/extension.ts#L299))
- Old keys: `aiCodeRoaster.config`, `aiCodeRoaster.role`
- Old data cleared after successful migration

## File Validation Pipeline

Located in [extension.ts:235-279](src/extension.ts#L235-L279), optimized for performance:

1. **File Type Check** (fastest) - validates against 60+ supported extensions
2. **File Size Check** (no content load) - uses `vscode.workspace.fs.stat()`, max 100KB
3. **Empty Content Check** (only if needed) - uses `document.getText()`

## Smart Change Detection

Located in [roastHistory.ts:52](src/roastHistory.ts#L52), uses `diff` library:

**Re-roast conditions**:
1. Role change → immediate re-roast
2. Time ≥ 60 seconds AND any line changes → re-roast
3. Line changes > 10 → re-roast (regardless of time)
4. Otherwise → show cached response

## WebView Communication

**Extension → WebView**:

```typescript
webviewView.webview.postMessage({
    type: 'contentUpdate' | 'done' | 'error',
    content: string  // HTML (markdown rendered server-side)
});
```

**WebView States**:

| Template | Description |
| :--- | :--- |
| `getLoadingHtml()` | Spinner animation |
| `getNoApiKeyHtml()` | Prompt to configure API |
| `getNoRoleHtml()` | Prompt to select a role |
| `getTooLargeHtml()` | File > 100KB error |
| `getUnsupportedTypeHtml()` | File type not supported |
| `getErrorHtml()` | Generic error |
| `getStreamingHtml()` | Live response with cursor animation |
| `getResponseHtml()` | Saved/cached response |

## Constants

| Constant | Value | Location |
|----------|-------|----------|
| `MAX_FILE_SIZE` | 100KB | [constants.ts:163](src/constants.ts#L163) |
| `MIN_TIME_INTERVAL` | 60 seconds | [constants.ts:164](src/constants.ts#L164) |
| `MIN_LINE_CHANGES` | 10 lines | [constants.ts:165](src/constants.ts#L165) |
| `AUTO_REFRESH_INTERVAL` | 10 seconds | [constants.ts:166](src/constants.ts#L166) |

## Error Handling

**ApiClientError** ([apiClient.ts:14-23](src/apiClient.ts#L14-L23)):

| Code | Meaning |
| :--- | :--- |
| 401 | Invalid API key |
| 429 | Rate limit exceeded |
| 5xx | API server error |
| Network | Connection/CORS error |

## VSCode Settings Schema

Located in [package.json:22-42](package.json#L22-L42):

| Setting | Type | Default |
|---------|------|---------|
| `aiCodeRoaster.apiBaseUrl` | string | `"https://openrouter.ai/api/v1"` |
| `aiCodeRoaster.modelName` | string | `"nvidia/nemotron-3-nano-30b-a3b:free"` |
| `aiCodeRoaster.role` | string | `"cn-roaster"` |

## Dependencies

**Runtime**:

- `diff@8.0.2` - Line-by-line diff calculation
- `marked@17.0.1` - Markdown to HTML conversion

**Dev**: TypeScript, ESLint, @types/vscode, VSCode test frameworks

## Streaming Format

Server-Sent Events (SSE) for streaming responses:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

Parsed in [apiClient.ts:94-165](src/apiClient.ts#L94-L165).
