function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const BASE_STYLES = `
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background-color: var(--vscode-editor-background);
    padding: 20px;
    margin: 0;
  }
  .response {
    font-family: var(--vscode-editor-font-family);
    font-size: var(--vscode-font-size);
    line-height: 1.6;
  }
  .markdown h1, .markdown h2, .markdown h3, .markdown h4, .markdown h5, .markdown h6 {
    margin: 16px 0 8px;
    color: var(--vscode-textLink-foreground);
    font-weight: 600;
  }
  .markdown h1 { font-size: 1.5em; }
  .markdown h2 { font-size: 1.3em; }
  .markdown h3 { font-size: 1.15em; }
  .markdown h4 { font-size: 1.05em; }
  .markdown pre {
    background-color: var(--vscode-textBlockQuote-background);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 12px 0;
  }
  .markdown code {
    font-family: var(--vscode-editor-font-family);
    font-size: var(--vscode-font-size);
  }
  .markdown :not(pre) > code {
    background-color: var(--vscode-textBlockQuote-background);
    padding: 2px 6px;
    border-radius: 3px;
  }
  .markdown blockquote {
    border-left: 4px solid var(--vscode-textLink-foreground);
    padding-left: 12px;
    margin: 12px 0;
    color: var(--vscode-descriptionForeground);
  }
  .markdown ul, .markdown ol { margin: 8px 0; padding-left: 24px; }
  .markdown li { margin: 4px 0; }
  .markdown p { margin: 8px 0; }
  .markdown a { color: var(--vscode-textLink-foreground); }
`;

function getBaseHtml(bodyContent: string, extraStyles = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Code Roaster</title>
  <style>${BASE_STYLES}${extraStyles}</style>
</head>
<body>${bodyContent}</body>
</html>`;
}

export function getLoadingHtml(message: string = 'Loading AI response...'): string {
  const extraStyles = `
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--vscode-editor-background);
      border-top: 3px solid var(--vscode-textLink-foreground);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const body = `
    <div style="text-align: center;">
      <div class="spinner"></div>
      <div>${escapeHtml(message)}</div>
    </div>
  `;

  return getBaseHtml(body, extraStyles);
}

export function getNoApiKeyHtml(): string {
  const extraStyles = `
    .container { max-width: 400px; }
    h2 {
      font-size: 18px;
      margin-top: 0;
      color: var(--vscode-textLink-foreground);
    }
    .step { margin: 12px 0; padding-left: 16px; }
    .info-box {
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--vscode-textLink-foreground);
      padding: 12px;
      margin: 16px 0;
      font-size: 12px;
    }
  `;

  const body = `
    <div class="container">
      <h2>API Configuration Required</h2>
      <p>To use this extension, configure your API settings (supports any OpenAI-compatible API).</p>
      <div class="step">1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)</div>
      <div class="step">2. Run <strong>"AI Code Roaster: Configure API"</strong></div>
      <div class="step">3. Enter your API Base URL, Model Name, and API Key</div>
      <div class="info-box">Your API key is securely stored in VSCode's secret storage.</div>
    </div>
  `;

  return getBaseHtml(body, extraStyles);
}

export function getResponseHtml(content: string, fileName: string, header: string): string {
  const extraStyles = `
    .header {
      font-size: 14px;
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
      margin-bottom: 12px;
    }
  `;

  const body = `
    <div class="header">${header}：${escapeHtml(fileName)}</div>
    <div class="response markdown">${content}</div>
  `;

  return getBaseHtml(body, extraStyles);
}

export function getErrorHtml(message: string): string {
  const extraStyles = `
    .status-container {
      border-left: 4px solid var(--vscode-errorForeground);
      padding-left: 12px;
    }
    .status-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--vscode-errorForeground);
      margin: 0 0 8px 0;
    }
    .hint {
      margin-top: 12px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
  `;

  const body = `
    <div class="status-container">
      <div class="status-title">Error</div>
      <p>${message}</p>
      <p class="hint">Close and reopen this panel to try again.</p>
    </div>
  `;

  return getBaseHtml(body, extraStyles);
}

export function getTooLargeHtml(fileName: string, fileSize: string, maxSize: string): string {
  const extraStyles = `
    .status-container {
      border-left: 4px solid var(--vscode-editorWarning-foreground);
      padding-left: 12px;
    }
    .status-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--vscode-editorWarning-foreground);
      margin: 0 0 8px 0;
    }
  `;

  const body = `
    <div class="status-container">
      <div class="status-title">File Too Large</div>
      <p><strong>${escapeHtml(fileName)}</strong> is ${fileSize}. Maximum file size is ${maxSize}.</p>
    </div>
  `;

  return getBaseHtml(body, extraStyles);
}

export function getUnsupportedTypeHtml(fileName: string, supportedTypes: string[]): string {
  const extraStyles = `
    .status-container {
      border-left: 4px solid var(--vscode-textLink-foreground);
      padding-left: 12px;
    }
    .status-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
      margin: 0 0 8px 0;
    }
    .supported-types {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      font-family: var(--vscode-editor-font-family);
    }
  `;

  const body = `
    <div class="status-container">
      <div class="status-title">Unsupported File Type</div>
      <p><strong>${escapeHtml(fileName)}</strong> is not a supported file type.</p>
      <div class="supported-types">Supported types: ${escapeHtml(supportedTypes.join(', '))}</div>
    </div>
  `;

  return getBaseHtml(body, extraStyles);
}

export function getStreamingHtml(fileName: string, header: string): string {
  const extraStyles = `
    .header {
      font-size: 14px;
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
      margin-bottom: 12px;
    }
    .cursor {
      display: inline-block;
      width: 8px;
      height: 16px;
      background-color: var(--vscode-textLink-foreground);
      animation: blink 1s step-end infinite;
      vertical-align: middle;
      margin-left: 2px;
    }
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `;

  const body = `
    <div class="header">${header}：${escapeHtml(fileName)}</div>
    <div class="response markdown"><span id="content"></span><span class="cursor" id="cursor"></span></div>
    <script>
      const vscode = acquireVsCodeApi();
      window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'chunk') {
          document.getElementById('content').innerHTML = message.content;
          document.body.scrollTop = document.body.scrollHeight;
        } else if (message.type === 'done') {
          document.getElementById('cursor').style.display = 'none';
        } else if (message.type === 'error') {
          document.getElementById('cursor').style.display = 'none';
          document.getElementById('content').innerHTML += '<p style="color: var(--vscode-errorForeground);">[Error: ' + message.content + ']</p>';
        }
      });
    </script>
  `;

  return getBaseHtml(body, extraStyles);
}
