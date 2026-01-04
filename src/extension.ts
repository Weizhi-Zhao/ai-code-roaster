// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

class AICodeRoasterViewProvider implements vscode.WebviewViewProvider {
	resolveWebviewView(webviewView: vscode.WebviewView) {
		webviewView.webview.html = `<body>AI Code Roaster says HELLO!</body>`;
	}
}

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.window.registerWebviewViewProvider('ai-code-roaster', new AICodeRoasterViewProvider())
	context.subscriptions.push(disposable);
}

export function deactivate() {}
