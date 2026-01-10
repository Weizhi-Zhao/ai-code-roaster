# AI Code Roaster

[中文文档](README.zh-CN.md)

> A VSCode extension that roasts your code with AI-powered humor and wit.

AI Code Roaster analyzes your code files and generates entertaining feedback through 8 different AI personalities. Whether you want a brutal reality check or an ego boost, there's a role for you.

## Features

- **Real-time streaming responses** from compatible LLM APIs
- **8 AI personalities** with distinct styles (4 Chinese + 4 English)
- **Smart caching** with intelligent change detection
- **Auto-refresh** when sidebar is visible
- **Secure API key storage** using VSCode secrets API
- **43+ supported file types** including JavaScript, TypeScript, Python, Go, Rust, Java, and more

## Quick Start

Get started in under 2 minutes:

1. **Install the extension** from VSCode Marketplace
2. **Open the sidebar**: Explorer → "AI Code Roaster" panel
3. **Configure API**: Click the gear icon → "Configure API"
4. **Enter your credentials**:
   - Base URL (e.g., `https://api.openai.com/v1`)
   - Model name (e.g., `gpt-4`)
   - API key
5. **Open any code file** and enjoy the roast!

## Configuration

### API Settings

Configure your LLM API credentials via the command palette:

- Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
- Run `AI Code Roaster: Configure API`

**Required settings:**

| Setting | Description | Example |
|---------|-------------|---------|
| Base URL | Your LLM API endpoint (OpenAI-compatible) | `https://api.openai.com/v1` |
| Model | The model to use for generation | `gpt-4`, `gpt-3.5-turbo` |
| API Key | Your API key (stored securely) | `sk-...` |

**URL Requirements:**

- Must use HTTPS (for production) OR `http://localhost` (for local development)

### Free API Option

You can get a **free GLM-4.5-Flash API** from [Zhipu AI (智谱AI)](https://docs.bigmodel.cn/cn/guide/develop/http/introduction):

```text
Base URL:  https://open.bigmodel.cn/api/paas/v4/chat/completions
Model:     glm-4.5-flash
API Key:   Sign up at bigmodel.cn to get your free API key
```

### Commands

| Command | Icon | Description |
|---------|------|-------------|
| `aiCodeRoaster.configureApi` | $(settings-gear) | Configure API settings |
| `aiCodeRoaster.deleteApiConfig` | $(trash) | Delete all configuration |
| `aiCodeRoaster.switchRole` | $(account) | Switch AI personality |

## AI Personalities

Choose from 8 different AI personalities with unique styles:

### Chinese Roles

| Role | Name | Style | Description |
|------|------|-------|-------------|
| `cn-roaster` | 🔥 锐评家 | Concise, sarcastic | Sharp-witted criticism with Chinese humor |
| `cn-praiser` | ✨ 夸夸家 | Enthusiastic | Extravagant praise that goes hard |
| `cn-roaster-meme` | 💀 梗王锐评 | Meme-heavy | High-density slang with emoji spam 💀🤡😭 |
| `cn-praiser-hype` | 🏆 彩虹屁 | Social media hype | Extreme praise with XiaoHongShu vibes |

### English Roles

| Role | Name | Style | Description |
|------|------|-------|-------------|
| `en-roaster` | 🔥 Code Critic | Snarky, punchy | Witty criticism with sarcasm |
| `en-praiser` | ✨ Code Hype-man | Energetic | Hype up your code with enthusiasm |
| `en-roaster-savage` | 💀 Savage Mode | Brutal, slang-heavy | No mercy roasting with Gen Z slang |
| `en-praiser-ultra` | 🏆 Hype Lord | Maximum energy | Legendary praise with TikTok vibes |

**Switch roles**: Click the account icon in the sidebar header or use `AI Code Roaster: Switch Role`.

## Technical Details

### File Validation

The extension validates files in a tiered pipeline (optimized for performance):

1. **File type check** - Validates against supported extensions
2. **File size check** - Maximum 100KB
3. **Empty content check** - Skips empty files

### Supported File Types

```
.js .ts .jsx .tsx .vue .svelte
.py .rb .go .rs .java .kt .swift
.c .cpp .h .hpp .cs .php
.scala .clj .hs .ml .ex .exs
.lua .r .m .sh .bash .zsh
.css .scss .sass .less .html .json
.yaml .yml .toml .ini .cfg .conf
```

### Smart Caching

The extension intelligently decides when to re-roast:

- **Role change** → Immediate re-roast
- **>10 lines changed** → Re-roast
- **>60 seconds with changes** → Re-roast
- **Otherwise** → Show cached response

This minimizes API calls while keeping feedback fresh.

### Auto-Refresh

The sidebar automatically refreshes every 5 seconds when visible, ensuring you always see the latest feedback.

## Development

### Prerequisites

- Node.js
- VSCode Engine ^1.107.0

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
│   └── constants.ts          # Roles, file types, constants
└── package.json
```

## License

[GPL-3.0-only](LICENSE)

---

For more details, see the [中文文档](README.zh-CN.md).
