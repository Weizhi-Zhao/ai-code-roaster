// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CONSTANTS } from './constants';
import { LlmApiClient } from './apiClient';
import { RoastHistory } from './roastHistory';
import { ConfigurationManager } from './configurationManager';
import { getLoadingHtml, getNoApiKeyHtml, getSuccessHtml, getErrorHtml, getTooLargeHtml, getUnsupportedTypeHtml, getStreamingHtml } from './webviewContent';

type FileValidationErrorType = 'unsupportedFileType' | 'fileTooLarge' | 'fileEmpty' | 'unknown';

interface FileValidationResult {
    isValid: boolean;
    errorType?: FileValidationErrorType;
    errorMessage?: string;
}

class AICodeRoasterViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _isActive = false;
    private roastHistoryMap = new Map<string, RoastHistory>();

    /**
     * Creates a new instance of the AICodeRoasterViewProvider.
     * @param configManager - Manages all configuration (API key, base URL, and model)
     * @param apiClient - Handles communication with the LLM API
     */
    constructor(
        private configManager: ConfigurationManager,
        private apiClient: LlmApiClient
    ) { }

    /**
     * Initializes the webview view when it is resolved by VS Code.
     * Sets up webview options, event listeners for visibility changes and disposal,
     * and triggers the initial roasting logic.
     * @param webviewView - The webview view instance provided by VS Code
     */
    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        this._isActive = true;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: []
        };

        webviewView.onDidChangeVisibility(() => {
            this._isActive = webviewView.visible;
            this.refresh();
        });

        webviewView.onDidDispose(() => {
            this._isActive = false;
        });

        // Trigger the API request when webview is shown
        this.refresh();
    }

    /**
     * Updates the webview HTML content if the view is available.
     * @param html - The HTML string to render in the webview
     */
    private updateWebview(html: string) {
        if (this._view) {
            this._view.webview.html = html;
        }
    }

    /**
     * Refreshes the webview by checking all state conditions and roasting if needed.
     * Called when the webview becomes visible, when files change, or when API key is set/deleted.
     *
     * Flow:
     * 1. Check if active (visible)
     * 2. Get active document
     * 3. validateFile (size, type, empty content)
     * 4. RoastHistory.isSignificantChange
     * 5. Check API key
     * 6. Request API (if all checks pass)
     */
    async refresh() {
        // 1. Check active
        if (!this._isActive) {
            return;
        }

        // 2. Get active document
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor?.document) {
            this.updateWebview(getLoadingHtml('Open a file to start roasting...'));
            return;
        }
        const document = activeEditor.document;

        // 3. validateFile (includes empty check)
        const validation = await this.validateFile(document);
        if (!validation.isValid) {
            switch (validation.errorType) {
                case 'fileTooLarge':
                    this.updateWebview(getTooLargeHtml(document.fileName, validation.errorMessage!, '100KB'));
                    break;
                case 'unsupportedFileType':
                    this.updateWebview(getUnsupportedTypeHtml(document.fileName, CONSTANTS.SUPPORTED_FILE_TYPES));
                    break;
                case 'fileEmpty':
                    this.updateWebview(getErrorHtml(validation.errorMessage!));
                    break;
                case 'unknown':
                    this.updateWebview(getErrorHtml(validation.errorMessage!));
                    break;
            }
            return;
        }

        // 4. RoastHistory.isSignificantChange
        const filePath = document.uri.toString();
        const cached = this.roastHistoryMap.get(filePath);
        if (cached && !cached.isSignificantChange(document)) {
            // Show cached response
            this.updateWebview(getSuccessHtml(cached.response, document.fileName));
            return;
        }

        // 5. Check API key
        const apiKey = await this.configManager.getApiKey();
        if (!apiKey) {
            this.updateWebview(getNoApiKeyHtml());
            return;
        }

        // 6. Request API with streaming
        const config = await this.configManager.getConfig();
        this.updateWebview(getStreamingHtml(document.fileName));
        try {
            const response = await this.apiClient.roastCodeStream(
                document.getText(),
                document.fileName,
                apiKey,
                (chunk) => {
                    // Send chunk to webview for streaming display
                    this._view?.webview.postMessage({ type: 'chunk', content: chunk });
                },
                config.baseUrl,
                config.model
            );
            // Notify webview that streaming is done
            this._view?.webview.postMessage({ type: 'done' });
            // Store history and response
            // Limit history to 100 entries - remove oldest if exceeded
            if (this.roastHistoryMap.size >= 100) {
                const oldestKey = this.roastHistoryMap.keys().next().value;
                if (oldestKey !== undefined) {
                    this.roastHistoryMap.delete(oldestKey);
                }
            }
            this.roastHistoryMap.set(filePath, new RoastHistory(document, response));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this._view?.webview.postMessage({ type: 'error', content: errorMessage });
        }
    }

    /**
     * Validates a document before roasting.
     * Checks file type first (fastest), then file size (without loading content),
     * and finally non-empty content (only loads content if needed).
     * @param document - The text document to validate
     * @returns A FileValidationResult indicating validity and error details
     */
    private async validateFile(document: vscode.TextDocument): Promise<FileValidationResult> {
        // 1. Check if file type is supported (fastest check - just string comparison)
        const fileName = document.fileName.toLowerCase();
        const isSupported = CONSTANTS.SUPPORTED_FILE_TYPES.some(ext => fileName.endsWith(ext));
        if (!isSupported) {
            return {
                isValid: false,
                errorType: 'unsupportedFileType',
                errorMessage: `Unsupported file type: ${document.fileName}`
            };
        }

        // 2. Check file size WITHOUT loading the full content
        try {
            const stat = await vscode.workspace.fs.stat(document.uri);
            if (stat.size > CONSTANTS.MAX_FILE_SIZE) {
                const fileSizeKB = Math.round(stat.size / 1024);
                const maxSizeKB = CONSTANTS.MAX_FILE_SIZE / 1024;
                return {
                    isValid: false,
                    errorType: 'fileTooLarge',
                    errorMessage: `File too large (${fileSizeKB}KB). Maximum size is ${maxSizeKB}KB.`
                };
            }
        } catch (error) {
            console.error('Failed to stat file:', error);
            return {
                isValid: false,
                errorType: 'unknown',
                errorMessage: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }

        // 3. Check if file is empty (only load content for this final check)
        const content = document.getText();
        if (content.trim().length === 0) {
            return {
                isValid: false,
                errorType: 'fileEmpty',
                errorMessage: 'File is empty.'
            };
        }

        return { isValid: true };
    }
}

/*
The state of extension will change when:
- resolveWebviewView
- onDidChangeActiveTextEditor
- onDidChangeVisibility
- configureApi command
- deleteApiConfig command
*/

export function activate(context: vscode.ExtensionContext) {
    const configManager = new ConfigurationManager(context);
    const apiClient = new LlmApiClient();
    const provider = new AICodeRoasterViewProvider(configManager, apiClient);

    const webviewViewProvider = vscode.window.registerWebviewViewProvider('ai-code-roaster', provider);
    context.subscriptions.push(webviewViewProvider);

    // Register file change listener for automatic roasting
    const fileChangeDisposable = vscode.window.onDidChangeActiveTextEditor(async () => {
        await provider.refresh();
    });
    context.subscriptions.push(fileChangeDisposable);

    // Register command to configure API (URL, model, key)
    const configureCommand = vscode.commands.registerCommand('aiCodeRoaster.configureApi', async () => {
        const currentConfig = await configManager.getConfig();

        // Ask for API Base URL
        const baseUrl = await vscode.window.showInputBox({
            prompt: 'Enter API Base URL (leave empty to keep current)',
            value: currentConfig.baseUrl,
            placeHolder: 'https://api.openai.com/v1/chat/completions'
        });
        if (baseUrl === undefined) {
            return; // User cancelled
        }

        // Ask for Model Name
        const model = await vscode.window.showInputBox({
            prompt: 'Enter Model Name (leave empty to keep current)',
            value: currentConfig.model,
            placeHolder: 'gpt-4o-mini'
        });
        if (model === undefined) {
            return; // User cancelled
        }

        // Ask for API Key
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter API Key (leave empty to keep current)',
            password: true,
            placeHolder: 'sk-...'
        });
        if (apiKey === undefined) {
            return; // User cancelled
        }

        // Update only what was provided
        let changesMade = false;

        if (baseUrl.trim()) {
            try {
                await configManager.saveConfig({ ...currentConfig, baseUrl: baseUrl.trim() });
                changesMade = true;
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to save base URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return;
            }
        }

        if (model.trim()) {
            try {
                await configManager.saveConfig({ ...currentConfig, model: model.trim() });
                changesMade = true;
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to save model: ${error instanceof Error ? error.message : 'Unknown error'}`);
                return;
            }
        }

        if (apiKey.trim()) {
            await configManager.storeApiKey(apiKey.trim());
            changesMade = true;
        }

        if (changesMade) {
            vscode.window.showInformationMessage('Configuration saved successfully!');
            await provider.refresh();
        } else {
            vscode.window.showInformationMessage('No changes made.');
        }
    });
    context.subscriptions.push(configureCommand);

    // Register command to delete all configuration (API key + API config)
    const deleteApiConfigCommand = vscode.commands.registerCommand('aiCodeRoaster.deleteApiConfig', async () => {
        const confirmed = await vscode.window.showWarningMessage(
            'Delete all configuration (API key and API settings)?',
            { modal: true },
            'Delete'
        );

        if (confirmed === 'Delete') {
            await configManager.deleteApiKey();
            await configManager.resetToDefaults();
            vscode.window.showInformationMessage('All configuration deleted successfully!');
            await provider.refresh();
        }
    });
    context.subscriptions.push(deleteApiConfigCommand);
}

export function deactivate() { }
