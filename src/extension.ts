// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { CONSTANTS, PREDEFINED_ROLES, DEFAULT_ROLE } from './constants';
import { LlmApiClient } from './apiClient';
import { RoastHistory } from './roastHistory';
import { ConfigurationManager } from './configurationManager';
import { RoleConfig } from './roleManager';
import { getLoadingHtml, getNoApiKeyHtml, getNoRoleHtml, getResponseHtml, getErrorHtml, getTooLargeHtml, getUnsupportedTypeHtml, getStreamingHtml } from './webviewContent';

type FileValidationErrorType = 'unsupportedFileType' | 'fileTooLarge' | 'fileEmpty' | 'unknown';

interface FileValidationResult {
    isValid: boolean;
    errorType?: FileValidationErrorType;
    errorMessage?: string;
}

class AICodeRoasterViewProvider implements vscode.WebviewViewProvider {
    private _view!: vscode.WebviewView;
    private _isActive = false;
    private roastHistoryMap = new Map<string, RoastHistory>();
    private _refreshTimerId?: NodeJS.Timeout;
    private _isRefreshing = false;
    private apiClient: LlmApiClient;

    /**
     * Creates a new instance of the AICodeRoasterViewProvider.
     * @param configManager - Manages all configuration (API key, base URL, model, and roles)
     */
    constructor(
        private configManager: ConfigurationManager
    ) {
        this.apiClient = new LlmApiClient();
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

            if (this._isActive) {
                this.startRefreshTimer(); // Start timer when visible
            } else {
                this.stopRefreshTimer();  // Stop timer when hidden
            }

            this.refresh();
        });

        webviewView.onDidDispose(() => {
            this._isActive = false;
            this.stopRefreshTimer();
        });

        // Trigger the API request when webview is shown
        this.refresh();

        // Start auto-refresh timer
        this.startRefreshTimer();
    }

    /**
     * Updates the webview HTML content if the view is available.
     * @param html - The HTML string to render in the webview
     */
    private updateWebview(html: string) {
        this._view.webview.html = html;
    }

    /**
     * Starts the auto-refresh timer (only when sidebar is visible).
     */
    private startRefreshTimer() {
        this.stopRefreshTimer(); // Clear existing timer

        this._refreshTimerId = setInterval(() => {
            this.refresh();
        }, CONSTANTS.AUTO_REFRESH_INTERVAL);
    }

    /**
     * Stops the auto-refresh timer.
     */
    private stopRefreshTimer() {
        if (this._refreshTimerId) {
            clearInterval(this._refreshTimerId);
            this._refreshTimerId = undefined;
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
        // Prevent concurrent refresh calls
        if (this._isRefreshing) {
            return;
        }

        // 1. Check active
        if (!this._isActive) {
            return;
        }

        this._isRefreshing = true;

        try {
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
                        this.updateWebview(getTooLargeHtml(document.fileName, validation.errorMessage!));
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
            let currentRoleId: string;
            let roleConfig: RoleConfig;
            try {
                currentRoleId = this.configManager.getRoleId();
                roleConfig = this.configManager.getRoleConfig(currentRoleId);
            } catch (error) {
                this.updateWebview(getNoRoleHtml((error as Error).message));
                return;
            }
            const cached = this.roastHistoryMap.get(filePath);
            if (cached && !cached.isSignificantChange(document, currentRoleId)) {
                // Show cached response (parse markdown for display, cached.response stays original)
                const marked = await import('marked');
                const htmlResponse = await marked.parse(cached.response);
                this.updateWebview(getResponseHtml(htmlResponse, path.basename(document.fileName), roleConfig.header));
                return;
            }

            // 5. Check API key and config
            const apiKey = await this.configManager.getApiKey();
            const config = await this.configManager.getApiConfig();
            if (!apiKey || !config) {
                this.updateWebview(getNoApiKeyHtml());
                return;
            }

            // 6. Request API with streaming
            this.updateWebview(getStreamingHtml(path.basename(document.fileName), roleConfig.header));
            try {
                // Dynamically import marked (ESM module in CommonJS context)
                const marked = await import('marked');

                const response = await this.apiClient.roastCodeStream(
                    document.getText(),
                    document.fileName,
                    apiKey,
                    config.baseUrl,
                    config.model,
                    roleConfig.systemPrompt,
                    // Callback receives fullContent for SSR markdown rendering
                    async (fullContent) => {
                        // Convert markdown to HTML in main process, then send to webview
                        const htmlContent = await marked.parse(fullContent);
                        this._view.webview.postMessage({ type: 'contentUpdate', content: htmlContent });
                    }
                );
                // Notify webview that streaming is done
                this._view.webview.postMessage({ type: 'done' });
                // Store history and response
                // Limit history to 100 entries - remove oldest if exceeded
                if (this.roastHistoryMap.size >= 100) {
                    const oldestKey = this.roastHistoryMap.keys().next().value;
                    if (oldestKey !== undefined) {
                        this.roastHistoryMap.delete(oldestKey);
                    }
                }
                this.roastHistoryMap.set(filePath, new RoastHistory(document, response, currentRoleId));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                this._view?.webview.postMessage({ type: 'error', content: errorMessage });
            }
        } finally {
            this._isRefreshing = false;
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

    dispose() {
        this.stopRefreshTimer();
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

export async function activate(context: vscode.ExtensionContext) {
    const configManager = new ConfigurationManager(context);

    // One-time migration from old globalState to new settings system
    await configManager.migrateIfNeeded();

    // Initialize custom roles from file
    await configManager.initRoles();

    const provider = new AICodeRoasterViewProvider(configManager);

    const webviewViewProvider = vscode.window.registerWebviewViewProvider('ai-code-roaster', provider);
    context.subscriptions.push(webviewViewProvider);

    // Ensure provider cleanup on deactivation
    context.subscriptions.push(new vscode.Disposable(() => provider.dispose()));

    // Register file change listener for automatic roasting
    const fileChangeDisposable = vscode.window.onDidChangeActiveTextEditor(async () => {
        await provider.refresh();
    });
    context.subscriptions.push(fileChangeDisposable);

    // Register command to configure API (open settings or set API key)
    const configureCommand = vscode.commands.registerCommand('aiCodeRoaster.configureApi', async () => {
        const config = vscode.workspace.getConfiguration('aiCodeRoaster');
        const hasBaseUrl = !!config.get<string>('apiBaseUrl');
        const hasModel = !!config.get<string>('modelName');
        const hasKey = await configManager.getApiKey();

        const message = `Configure AI Code Roaster

• API Base URL: ${hasBaseUrl ? '✓' : '✗'}
• Model Name: ${hasModel ? '✓' : '✗'}
• API Key: ${hasKey ? '✓' : '✗'}`;

        const result = await vscode.window.showInformationMessage(
            message,
            'Open Settings',
            'Set API Key'
        );

        if (result === 'Open Settings') {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'aiCodeRoaster');
        } else if (result === 'Set API Key') {
            const apiKey = await vscode.window.showInputBox({
                prompt: 'Enter your API Key',
                password: true,
                ignoreFocusOut: true
            });

            if (apiKey) {
                await configManager.storeApiKey(apiKey);
                vscode.window.showInformationMessage('API Key saved successfully!');
                await provider.refresh();
            }
        }
    });
    context.subscriptions.push(configureCommand);

    // Register command to delete all configuration (API key + API config)
    const deleteApiConfigCommand = vscode.commands.registerCommand('aiCodeRoaster.deleteApiConfig', async () => {
        const confirmed = await vscode.window.showWarningMessage(
            'Delete all configuration (API key, Base URL, Model, Role)?',
            { modal: true },
            'Delete'
        );

        if (confirmed === 'Delete') {
            await configManager.deleteApiKey();
            await configManager.deleteAllConfig();
            vscode.window.showInformationMessage('All configuration deleted successfully!');
            await provider.refresh();
        }
    });
    context.subscriptions.push(deleteApiConfigCommand);

    // Register command to switch role
    const switchRoleCommand = vscode.commands.registerCommand('aiCodeRoaster.switchRole', async () => {
        let currentRoleName = 'Not set';
        try {
            const currentRoleId = configManager.getRoleId();
            const currentRoleConfig = configManager.getRoleConfig(currentRoleId);
            currentRoleName = currentRoleConfig.name;
        } catch {
            // Role not configured or invalid, use default name
        }

        const items = configManager.getAllRoles().map((role: RoleConfig) => ({
            label: role.isCustom ? `${role.name} (Custom)` : role.name,
            description: role.description,
            value: role.id
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: `Current role: ${currentRoleName}`,
            title: 'Switch AI Role'
        });

        if (selected) {
            await configManager.setRole(selected.value);
            vscode.window.showInformationMessage(`Switched to: ${selected.label}`);
            await provider.refresh();
        }
    });
    context.subscriptions.push(switchRoleCommand);

    // Register command to create custom role
    const createCustomRoleCommand = vscode.commands.registerCommand('aiCodeRoaster.createCustomRole', async () => {
        // Role ID
        const roleId = await vscode.window.showInputBox({
            prompt: 'Enter Role ID (letters, numbers, hyphens, underscores only)',
            placeHolder: 'my-custom-role',
            validateInput: (value) => {
                if (!value || !/^[a-zA-Z0-9_-]+$/.test(value)) {
                    return 'Invalid format. Use only letters, numbers, hyphens, and underscores.';
                }
                if (value in PREDEFINED_ROLES) {
                    return 'This ID conflicts with a predefined role.';
                }
                if (configManager.getCustomRoles().some((r: RoleConfig) => r.id === value)) {
                    return 'This ID already exists.';
                }
                return null;
            }
        });

        if (!roleId) { return; }

        // Display name
        const name = await vscode.window.showInputBox({
            prompt: 'Enter display name',
            placeHolder: '🎨 My Custom Role',
            validateInput: (value) => !value ? 'Name is required.' : null
        });

        if (!name) { return; }

        // Description
        const description = await vscode.window.showInputBox({
            prompt: 'Enter description',
            placeHolder: 'A custom role for...',
            validateInput: (value) => !value ? 'Description is required.' : null
        });

        if (!description) { return; }

        // Header
        const header = await vscode.window.showInputBox({
            prompt: 'Enter response header',
            placeHolder: '🎨 Custom Review',
            validateInput: (value) => !value ? 'Header is required.' : null
        });

        if (!header) { return; }

        // System prompt
        const systemPrompt = await vscode.window.showInputBox({
            prompt: 'Enter system prompt (AI behavior instructions)',
            placeHolder: 'You are a code reviewer that...',
            validateInput: (value) => !value ? 'System prompt is required.' : null
        });

        if (!systemPrompt) { return; }

        // Create the custom role
        try {
            await configManager.createCustomRole({
                id: roleId,
                name,
                description,
                header,
                systemPrompt
            });
            vscode.window.showInformationMessage(`Custom role "${name}" created successfully!`);
            await provider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
        }
    });
    context.subscriptions.push(createCustomRoleCommand);

    // Register command to edit custom role
    const editCustomRoleCommand = vscode.commands.registerCommand('aiCodeRoaster.editCustomRole', async () => {
        const customRoles = configManager.getCustomRoles();

        if (customRoles.length === 0) {
            vscode.window.showInformationMessage('No custom roles to edit. Create one first!');
            return;
        }

        // Select role to edit
        const selectedRole = await vscode.window.showQuickPick(
            customRoles.map((role: RoleConfig) => ({
                label: role.name,
                description: role.description,
                value: role
            })),
            {
                placeHolder: 'Select a custom role to edit',
                title: 'Edit Custom Role'
            }
        );

        if (!selectedRole) { return; }

        const role = selectedRole.value;

        // Select field to edit
        const field = await vscode.window.showQuickPick([
            { label: 'Name', value: 'name' },
            { label: 'Description', value: 'description' },
            { label: 'Header', value: 'header' },
            { label: 'System Prompt', value: 'systemPrompt' }
        ], {
            placeHolder: 'Select field to edit',
            title: `Edit ${role.name}`
        });

        if (!field) { return; }

        // Get new value
        const newValue = await vscode.window.showInputBox({
            prompt: `Enter new ${field.label}`,
            value: role[field.value as keyof RoleConfig] as string,
            validateInput: (value) => !value ? 'Value cannot be empty.' : null
        });

        if (!newValue) { return; }

        // Update the role
        try {
            await configManager.updateCustomRole(role.id, {
                [field.value]: newValue
            });
            vscode.window.showInformationMessage(`Custom role "${role.name}" updated successfully!`);
            await provider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
        }
    });
    context.subscriptions.push(editCustomRoleCommand);

    // Register command to delete custom role
    const deleteCustomRoleCommand = vscode.commands.registerCommand('aiCodeRoaster.deleteCustomRole', async () => {
        const customRoles = configManager.getCustomRoles();

        if (customRoles.length === 0) {
            vscode.window.showInformationMessage('No custom roles to delete.');
            return;
        }

        // Select role to delete
        const selectedRole = await vscode.window.showQuickPick(
            customRoles.map((role: RoleConfig) => ({
                label: role.name,
                description: role.description,
                value: role
            })),
            {
                placeHolder: 'Select a custom role to delete',
                title: 'Delete Custom Role'
            }
        );

        if (!selectedRole) { return; }

        const role = selectedRole.value;

        // Confirm deletion
        const confirmed = await vscode.window.showWarningMessage(
            `Delete custom role "${role.name}"?`,
            { modal: true },
            'Delete'
        );

        if (confirmed !== 'Delete') { return; }

        // Delete the role
        try {
            await configManager.deleteCustomRole(role.id);

            // Check if the deleted role was the current role
            try {
                const currentRoleId = configManager.getRoleId();
                if (currentRoleId === role.id) {
                    await configManager.setRole(DEFAULT_ROLE);
                    vscode.window.showInformationMessage(`Custom role "${role.name}" deleted successfully! Reset to default role: ${PREDEFINED_ROLES[DEFAULT_ROLE].name}`);
                } else {
                    vscode.window.showInformationMessage(`Custom role "${role.name}" deleted successfully!`);
                }
            } catch {
                // No valid role configured, just show delete message
                vscode.window.showInformationMessage(`Custom role "${role.name}" deleted successfully!`);
            }
            await provider.refresh();
        } catch (error) {
            vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error));
        }
    });
    context.subscriptions.push(deleteCustomRoleCommand);
}

export function deactivate() { }
