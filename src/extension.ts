// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CONSTANTS } from './constants';
import { SecretManager } from './secretManager';
import { OpenRouterClient } from './apiClient';
import { getLoadingHtml, getNoApiKeyHtml, getSuccessHtml, getErrorHtml, getTooLargeHtml, getUnsupportedTypeHtml } from './webviewContent';

class AICodeRoasterViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _isActive = false;
    private debounceTimer: NodeJS.Timeout | undefined;
    private currentFilePath: string | undefined;
    private readonly DEBOUNCE_DELAY = 1000; // 1 second

    /**
     * Creates a new instance of the AICodeRoasterViewProvider.
     * @param secretManager - Manages secure storage and retrieval of the API key
     * @param apiClient - Handles communication with the OpenRouter API
     */
    constructor(
        private secretManager: SecretManager,
        private apiClient: OpenRouterClient
    ) { }

    /**
     * Gets whether the webview is currently visible and active.
     */
    get isActive(): boolean {
        return this._isActive;
    }

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
            if (webviewView.visible) {
                this.refresh();
            }
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
     * Refreshes the webview by checking for an API key and roasting the active file.
     * Called when the webview becomes visible or when the API key is set/deleted.
     */
    async refresh() {
        if (!this._isActive) {
            return;
        }

        const apiKey = await this.secretManager.getApiKey();

        if (!apiKey) {
            this.updateWebview(getNoApiKeyHtml());
            return;
        }

        // Check if there's an active file to roast
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor?.document) {
            await this.roastFile(activeEditor.document);
        } else {
            this.updateWebview(getLoadingHtml('Open a file to start roasting...'));
        }
    }

    /**
     * Validates a document before roasting.
     * Checks file size, file type support, and non-empty content.
     * @param document - The text document to validate
     * @returns An object indicating validity and an optional error message
     */
    private validateFile(document: vscode.TextDocument): { isValid: boolean; error?: string } {
        // Check if file is too large
        const content = document.getText();
        if (content.length > CONSTANTS.MAX_FILE_SIZE) {
            const fileSizeKB = Math.round(content.length / 1024);
            const maxSizeKB = CONSTANTS.MAX_FILE_SIZE / 1024;
            return {
                isValid: false,
                error: `File too large (${fileSizeKB}KB). Maximum size is ${maxSizeKB}KB.`
            };
        }

        // Check if file type is supported
        const fileName = document.fileName.toLowerCase();
        const isSupported = CONSTANTS.SUPPORTED_FILE_TYPES.some(ext => fileName.endsWith(ext));
        if (!isSupported) {
            return {
                isValid: false,
                error: `Unsupported file type: ${document.fileName}. Supported types: ${CONSTANTS.SUPPORTED_FILE_TYPES.join(', ')}`
            };
        }

        // Check if file is empty
        if (content.trim().length === 0) {
            return {
                isValid: false,
                error: 'File is empty.'
            };
        }

        return { isValid: true };
    }

    /**
     * Performs the actual code roasting by validating the file and calling the API.
     * Displays loading state, then success or error response in the webview.
     * @param document - The text document to roast
     */
    private async performRoast(document: vscode.TextDocument): Promise<void> {
        if (!this._isActive) {
            return;
        }

        const filePath = document.uri.toString();

        // Validate file
        const validation = this.validateFile(document);
        if (!validation.isValid) {
            this.updateWebview(getErrorHtml(validation.error!));
            return;
        }

        this.currentFilePath = filePath;
        this.updateWebview(getLoadingHtml(`Roasting ${document.fileName}...`));

        const apiKey = await this.secretManager.getApiKey();
        if (!apiKey) {
            this.updateWebview(getNoApiKeyHtml());
            return;
        }

        try {
            const fileContent = document.getText();
            const fileName = document.fileName;
            const response = await this.apiClient.roastCode(fileContent, fileName, apiKey);
            this.updateWebview(getSuccessHtml(response, fileName));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            this.updateWebview(getErrorHtml(errorMessage));
        }
    }

    /**
     * Initiates roasting for a given document with debouncing.
     * Skips if the same file was just roasted, clears any pending timer,
     * and schedules a new roast after the debounce delay.
     * @param document - The text document to roast
     */
    async roastFile(document: vscode.TextDocument): Promise<void> {
        const filePath = document.uri.toString();

        // Skip if same file
        if (filePath === this.currentFilePath) {
            return;
        }

        // Clear pending debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }

        // Set new debounce timer
        this.debounceTimer = setTimeout(async () => {
            await this.performRoast(document);
        }, this.DEBOUNCE_DELAY);
    }
}

export function activate(context: vscode.ExtensionContext) {
    const secretManager = new SecretManager(context);
    const apiClient = new OpenRouterClient();
    const provider = new AICodeRoasterViewProvider(secretManager, apiClient);

    const webviewViewProvider = vscode.window.registerWebviewViewProvider('ai-code-roaster', provider);
    context.subscriptions.push(webviewViewProvider);

    // Register file change listener for automatic roasting
    const fileChangeDisposable = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        // Only trigger if sidebar is active
        if (provider.isActive && editor?.document) {
            await provider.roastFile(editor.document);
        }
    });
    context.subscriptions.push(fileChangeDisposable);

    // Register command to set API key
    const setApiKeyCommand = vscode.commands.registerCommand('aiCodeRoaster.setApiKey', async () => {
        const key = await vscode.window.showInputBox({
            prompt: 'Enter your OpenRouter API key',
            password: true,
            placeHolder: 'sk-or-...'
        });

        if (key) {
            await secretManager.storeApiKey(key);
            vscode.window.showInformationMessage('API key saved successfully!');
            // Refresh the webview to show the loading state and then the success response
            await provider.refresh();
        }
    });
    context.subscriptions.push(setApiKeyCommand);

    // Register command to delete API key
    const deleteApiKeyCommand = vscode.commands.registerCommand('aiCodeRoaster.deleteApiKey', async () => {
        const confirmed = await vscode.window.showWarningMessage(
            'Are you sure you want to delete your API key?',
            { modal: true },
            'Delete'
        );

        if (confirmed === 'Delete') {
            await secretManager.deleteApiKey();
            vscode.window.showInformationMessage('API key deleted successfully!');
            // Refresh the webview to show the "no API key" prompt
            await provider.refresh();
        }
    });
    context.subscriptions.push(deleteApiKeyCommand);
}

export function deactivate() { }
