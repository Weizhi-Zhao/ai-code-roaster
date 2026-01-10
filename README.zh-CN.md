# AI Code Roaster

[English Documentation](README.md)

> 用 AI 的幽默与机智来吐槽你的代码。

AI Code Roaster 分析你的代码文件，通过 8 种不同 AI 人设生成有趣的反馈。无论你想要残酷的现实检验还是给点自信，总有一个角色适合你。

## 特性

- **实时流式响应** - 来自兼容的 LLM API
- **8 种 AI 人设** - 风格各异（4 种中文 + 4 种英文）
- **智能缓存** - 带有智能变更检测
- **自动刷新** - 侧边栏可见时自动更新
- **安全密钥存储** - 使用 VSCode secrets API
- **支持 43+ 种文件类型** - 包括 JavaScript、TypeScript、Python、Go、Rust、Java 等

## 快速开始

2 分钟内即可上手：

1. **安装插件** - 从 VSCode 插件市场安装
2. **打开侧边栏** - 资源管理器 → "AI Code Roaster" 面板
3. **配置 API** - 点击齿轮图标 → "Configure API"
4. **输入凭据**：
   - Base URL（如 `https://api.openai.com/v1`）
   - 模型名称（如 `gpt-4`）
   - API Key
5. **打开任意代码文件** 开始吐槽！

## 配置

### API 设置

通过命令面板配置 LLM API 凭据：

- 按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（macOS）
- 运行 `AI Code Roaster: Configure API`

**必需设置：**

| 设置 | 描述 | 示例 |
|------|------|------|
| Base URL | 你的 LLM API 端点（兼容 OpenAI） | `https://api.openai.com/v1` |
| Model | 使用的模型名称 | `gpt-4`、`gpt-3.5-turbo` |
| API Key | 你的 API 密钥（安全存储） | `sk-...` |

**URL 要求：**

- 生产环境必须使用 HTTPS，或本地开发使用 `http://localhost`

### 免费API

你可以从 [智谱AI (Zhipu AI)](https://docs.bigmodel.cn/cn/guide/develop/http/introduction) 获取**免费的 GLM-4.5-Flash API**：

```text
Base URL:  https://open.bigmodel.cn/api/paas/v4/chat/completions
Model:     glm-4.5-flash
API Key:   访问 bigmodel.cn 注册获取免费 API Key
```

### 命令

| 命令 | 图标 | 描述 |
|------|------|------|
| `aiCodeRoaster.configureApi` | $(settings-gear) | 配置 API 设置 |
| `aiCodeRoaster.deleteApiConfig` | $(trash) | 删除所有配置 |
| `aiCodeRoaster.switchRole` | $(account) | 切换 AI 人设 |

## AI 人设

从 8 种不同风格的 AI 人设中选择：

### 中文角色

| 角色 | 名称 | 风格 | 描述 |
|------|------|------|------|
| `cn-roaster` | 🔥 锐评家 | 简洁毒舌 | 中文幽默的犀利吐槽 |
| `cn-praiser` | ✨ 夸夸家 | 热情洋溢 | 夸得天花乱坠 |
| `cn-roaster-meme` | 💀 梗王锐评 | 梗词密集 | 高密度网络用语加表情轰炸 💀🤡😭 |
| `cn-praiser-hype` | 🏆 彩虹屁 | 社交媒体风 | 小红书风格的极致吹捧 |

### 英文角色

| 角色 | 名称 | 风格 | 描述 |
|------|------|------|------|
| `en-roaster` | 🔥 Code Critic | 讽刺机智 | 带有讽刺意味的机智吐槽 |
| `en-praiser` | ✨ Code Hype-man | 热情洋溢 | 热情地吹捧你的代码 |
| `en-roaster-savage` | 💀 Savage Mode | 残暴俚语 | 毫不留情的 Z 世代俚语吐槽 |
| `en-praiser-ultra` | 🏆 Hype Lord | 最大能量 | TikTok 风格的传奇级吹捧 |

**切换角色**：点击侧边栏标题栏中的账户图标，或使用 `AI Code Roaster: Switch Role`。

## 技术细节

### 文件验证

插件按三级流水线验证文件（性能优化）：

1. **文件类型检查** - 验证支持的扩展名
2. **文件大小检查** - 最大 100KB
3. **空内容检查** - 跳过空文件

### 支持的文件类型

```
.js .ts .jsx .tsx .vue .svelte
.py .rb .go .rs .java .kt .swift
.c .cpp .h .hpp .cs .php
.scala .clj .hs .ml .ex .exs
.lua .r .m .sh .bash .zsh
.css .scss .sass .less .html .json
.yaml .yml .toml .ini .cfg .conf
```

### 智能缓存

插件智能决定何时重新吐槽：

- **角色改变** → 立即重新吐槽
- **超过 10 行变更** → 重新吐槽
- **超过 60 秒且有变更** → 重新吐槽
- **否则** → 显示缓存响应

这能在保持反馈新鲜的同时最小化 API 调用。

### 自动刷新

侧边栏在可见时每 5 秒自动刷新，确保你始终看到最新反馈。

## 开发

### 前置要求

- Node.js
- VSCode Engine ^1.107.0

### 构建命令

```bash
npm install        # 安装依赖
npm run compile    # 编译 TypeScript
npm run watch      # 监听模式（开发）
npm run lint       # 运行 ESLint
npm run test       # 运行测试
```

### 项目结构

```
ai-code-roaster/
├── src/
│   ├── extension.ts          # 主入口、ViewProvider
│   ├── apiClient.ts          # LLM API 客户端（流式）
│   ├── configurationManager.ts  # 安全配置存储
│   ├── roastHistory.ts       # 智能缓存（diff）
│   ├── webviewContent.ts     # HTML 生成
│   └── constants.ts          # 角色、文件类型、常量
└── package.json
```

## 许可证

[GPL-3.0-only](LICENSE)

---

更多详情，参见 [English Documentation](README.md)。
