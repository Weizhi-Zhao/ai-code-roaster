function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getLoadingHtml(message: string = 'Loading AI response...'): string {
  const escapedMessage = escapeHtml(message);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Code Roaster</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    .loading-container {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--vscode-editor-background);
      border-top: 3px solid var(--vscode-textLink-foreground);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-text {
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
    }
  </style>
</head>
<body>
  <div class="loading-container">
    <div class="spinner"></div>
    <div class="loading-text">${escapedMessage}</div>
  </div>
</body>
</html>`;
}

export function getNoApiKeyHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Code Roaster</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }
    .container {
      max-width: 400px;
    }
    h2 {
      font-size: 18px;
      margin-top: 0;
      color: var(--vscode-textLink-foreground);
    }
    p {
      font-size: var(--vscode-font-size);
      line-height: 1.5;
      color: var(--vscode-foreground);
    }
    .step {
      margin: 12px 0;
      padding-left: 16px;
    }
    .command-box {
      background-color: var(--vscode-textBlockQuote-background);
      border-left: 4px solid var(--vscode-textLink-foreground);
      padding: 12px;
      margin: 16px 0;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }
    .link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
    }
    .link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>OpenRouter API Key Not Found</h2>
    <p>To use this extension, you need to configure your OpenRouter API key.</p>
    <div class="step">1. Get your free API key from <a href="https://openrouter.ai/keys" class="link">openrouter.ai/keys</a></div>
    <div class="step">2. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)</div>
    <div class="step">3. Run <strong>"AI Code Roaster: Set API Key"</strong></div>
    <div class="command-box">
      This will securely store your API key in VSCode's secret storage.
    </div>
  </div>
</body>
</html>`;
}

export function getSuccessHtml(content: string, fileName?: string): string {
  // Escape HTML in the content
  const escapedContent = escapeHtml(content);
  const headerText = fileName ? `锐评：${escapeHtml(fileName)}` : 'AI Response:';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Code Roaster</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }
    .header {
      font-size: 14px;
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
      margin-bottom: 12px;
    }
    .response {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-font-size);
      line-height: 1.6;
      color: var(--vscode-foreground);
    }
  </style>
</head>
<body>
  <div class="header">${headerText}</div>
  <div class="response">${escapedContent}</div>
</body>
</html>`;
}

export function getErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Code Roaster</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }
    .error-container {
      border-left: 4px solid var(--vscode-errorForeground);
      padding-left: 12px;
    }
    .error-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--vscode-errorForeground);
      margin: 0 0 8px 0;
    }
    .error-message {
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      margin: 0;
    }
    .hint {
      margin-top: 12px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <div class="error-container">
    <div class="error-title">Error</div>
    <p class="error-message">${message}</p>
    <p class="hint">Close and reopen this panel to try again.</p>
  </div>
</body>
</html>`;
}

export function getTooLargeHtml(fileName: string, fileSize: string, maxSize: string): string {
  const escapedFileName = escapeHtml(fileName);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Code Roaster</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }
    .warning-container {
      border-left: 4px solid var(--vscode-editorWarning-foreground);
      padding-left: 12px;
    }
    .warning-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--vscode-editorWarning-foreground);
      margin: 0 0 8px 0;
    }
    .warning-message {
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="warning-container">
    <div class="warning-title">File Too Large</div>
    <p class="warning-message">
      <strong>${escapedFileName}</strong> is ${fileSize}.
      Maximum file size is ${maxSize}.
    </p>
  </div>
</body>
</html>`;
}

export function getUnsupportedTypeHtml(fileName: string, supportedTypes: string[]): string {
  const escapedFileName = escapeHtml(fileName);
  const escapedTypes = escapeHtml(supportedTypes.join(', '));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Code Roaster</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }
    .info-container {
      border-left: 4px solid var(--vscode-textLink-foreground);
      padding-left: 12px;
    }
    .info-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--vscode-textLink-foreground);
      margin: 0 0 8px 0;
    }
    .info-message {
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      margin: 0 0 12px 0;
    }
    .supported-types {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      font-family: var(--vscode-editor-font-family);
    }
  </style>
</head>
<body>
  <div class="info-container">
    <div class="info-title">Unsupported File Type</div>
    <p class="info-message">
      <strong>${escapedFileName}</strong> is not a supported file type.
    </p>
    <div class="supported-types">
      Supported types: ${escapedTypes}
    </div>
  </div>
</body>
</html>`;
}
