# AI Code Roaster

[English Documentation](README.md)

> 用 AI 的幽默与机智来吐槽你的代码。

AI Code Roaster 分析你的代码文件，通过 6 种不同 AI 人设生成有趣的反馈。无论你想要残酷的现实检验还是给点自信，总有一个角色适合你。

## 特性

- **实时流式响应** - 来自兼容的 LLM API
- **6 种 AI 人设** - 风格各异（3 种中文 + 3 种英文）
- **自定义角色系统** - 创建、编辑和删除你自己的 AI 人设
- **智能缓存** - 带有智能变更检测
- **自动刷新** - 侧边栏可见时自动更新
- **安全密钥存储** - 使用 VSCode secrets API
- **支持 100+ 种文件类型** - 包括 JavaScript、TypeScript、Python、Go、Rust、Java 等

## 快速开始

2 分钟内即可上手：

1. **安装插件** - 从 VSCode 插件市场安装
2. **打开侧边栏** - 资源管理器 → "AI Code Roaster" 面板
3. **配置 API** - 点击齿轮图标 → "Configure API"
4. **输入凭据**：
   - Base URL（如 `https://openrouter.ai/api/v1`）
   - 模型名称（如 `nvidia/nemotron-3-nano-30b-a3b:free`）
   - API Key
5. **打开任意代码文件** 开始吐槽！

### 免费API

- [OpenRouter](https://openrouter.ai/)
- [ModelScope](https://www.modelscope.cn/my/myaccesstoken)
- [SiliconFlow](https://cloud.siliconflow.cn/me/account/ak)
- [Z.AI](https://docs.bigmodel.cn/cn/guide/models/free/glm-4.7-flash)
- [NVIDIA NIM](https://build.nvidia.com/explore/discover)

## 配置

### API 设置

通过命令面板配置 LLM API 凭据：

- 按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（macOS）
- 运行 `AI Code Roaster: Configure API`

**必需设置：**

| 设置 | 描述 | 示例 |
|------|------|------|
| Base URL | 你的 LLM API 端点（兼容 OpenAI） | `https://openrouter.ai/api/v1` |
| Model | 使用的模型名称 | `nvidia/nemotron-3-nano-30b-a3b:free` |
| API Key | 你的 API 密钥（安全存储） | `sk-...` |

**URL 要求：**

- 生产环境必须使用 HTTPS，或本地开发使用 `http://localhost`

### 命令

| 命令 | 描述 |
|------|------|
| `aiCodeRoaster.configureApi` | 配置 API 设置 |
| `aiCodeRoaster.deleteApiConfig` | 删除所有配置 |
| `aiCodeRoaster.switchRole` | 切换 AI 人设 |
| `aiCodeRoaster.createCustomRole` | 创建自定义角色 |
| `aiCodeRoaster.editCustomRole` | 编辑自定义角色 |
| `aiCodeRoaster.deleteCustomRole` | 删除自定义角色 |

## AI 人设

从 6 种不同风格的 AI 人设中选择：

### 中文角色

| 角色 | 名称 | 风格 | 描述 |
|------|------|------|------|
| `cn-roaster` | 🔥 锐评家 | 简洁毒舌 | 中文幽默的犀利吐槽 |
| `cn-praiser` | ✨ 夸夸家 | 热情洋溢 | 夸得天花乱坠 |
| `cn-reviewer` | 🔍 代码审查官 | 专业严谨 | 专业严谨的代码审查 |

### 英文角色

| 角色 | 名称 | 风格 | 描述 |
|------|------|------|------|
| `en-roaster` | 🔥 Code Critic | 讽刺机智 | 带有讽刺意味的机智吐槽 |
| `en-praiser` | ✨ Code Hype-man | 热情洋溢 | 热情地吹捧你的代码 |
| `en-reviewer` | 🔍 Code Reviewer | 专业严谨 | 专业严谨的代码审查 |

**切换角色**：点击侧边栏标题栏中的账户图标，或使用 `AI Code Roaster: Switch Role`。

## 自定义角色系统

使用自定义角色系统创建你自己的 AI 人设：

### 创建自定义角色

1. 打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
2. 运行 `AI Code Roaster: Create Custom Role`
3. 提供以下信息：
   - **角色 ID**：唯一标识符（例如 `my-custom-roaster`）
   - **名称**：显示名称（例如 `🎨 我自定义角色`）
   - **描述**：角色风格的简短描述
   - **标题**：响应前显示的标题
   - **系统提示词**：定义角色行为的 AI 系统提示

### 管理自定义角色

- **编辑**：使用 `AI Code Roaster: Edit Custom Role` 修改现有自定义角色
- **删除**：使用 `AI Code Roaster: Delete Custom Role` 删除自定义角色
- 自定义角色存储在 `globalStorageUri/customRoles.json`

### 角色验证

- 角色 ID 必须仅包含字母、数字、连字符和下划线
- 自定义角色 ID 不能与预定义角色冲突
- 所有字段（name、description、header、systemPrompt）都是必需的

## 技术细节

### 文件验证

插件按三级流水线验证文件（性能优化）：

1. **文件类型检查** - 验证支持的扩展名
2. **文件大小检查** - 最大 100KB
3. **空内容检查** - 跳过空文件

### 支持的文件类型

```text
JavaScript/TypeScript: .js .ts .jsx .tsx .mjs .cjs .mts .cts
前端框架: .vue .svelte .astro
后端语言: .py .rb .go .rs .java .kt .kts .swift
C/C++/C#: .c .cpp .cc .cxx .h .hpp .hxx .cs
PHP: .php .phtml
JVM 语言: .scala .sc .clj .cljs .groovy
函数式语言: .hs .lhs .ml .mli .re .rei .fs .fsi .fsx
Elixir/Erlang: .ex .exs .erl .hrl
脚本语言: .lua .r .rmd .pl .pm .t .ps1 .psm1 .psd1
Shell 脚本: .sh .bash .zsh .fish .csh .tcsh .cmd .bat
Dart/Flutter: .dart
其他编译语言: .nim .cr .jl .v .zig .mo .lok
WebAssembly: .wasm .wat
样式: .css .scss .sass .less .styl .stylus
标记和模板: .html .htm .xml .svg .xhtml .md .markdown .rst .adoc
数据格式: .json .yaml .yml .toml .ini .cfg .conf .graphql .gql
配置文件: .env .dockerfile .makefile .mk .cmake
Protobuf & IDL: .proto .thrift .avsc
模板引擎: .erb .ejs .hbs .mustache .twig .jinja .jinja2
SQL: .sql .psql
MATLAB/Mathematica: .m .wl .nb
其他: .ahk .vim .el .lisp
```

### 智能缓存

插件智能决定何时重新吐槽：

- **角色改变** → 立即重新吐槽
- **超过 10 行变更** → 重新吐槽
- **超过 60 秒且有变更** → 重新吐槽
- **否则** → 显示缓存响应

这能在保持反馈新鲜的同时最小化 API 调用。

### 自动刷新

侧边栏在可见时每 10 秒自动刷新，确保你始终看到最新反馈。

## 开发

### 前置要求

- Node.js
- VSCode Engine ^1.74.0

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
│   ├── roleManager.ts        # 角色管理（预定义 + 自定义）
│   └── constants.ts          # 角色、文件类型、常量
└── package.json
```

## 许可证

[GPL-3.0-only](LICENSE)

---

更多详情，参见 [English Documentation](README.md)。
