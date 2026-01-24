import * as vscode from "vscode";
import { RoleManager } from "./roleManager";
import { RoleConfig } from "./roleManager";
import { DEFAULT_ROLE } from "./constants";

export interface ApiConfig {
    baseUrl: string;
    model: string;
}

/**
 * Manages all configuration storage for the extension.
 * - Non-sensitive configuration (API base URL, model name, role) uses VSCode settings
 * - Sensitive data (API key) uses the secure secrets API
 * - One-time migration from old globalState to new settings system
 */
export class ConfigurationManager {
    private readonly SECRET_KEY = "aiCodeRoaster-api-key";
    private readonly OLD_CONFIG_KEY = "aiCodeRoaster.config";
    private readonly OLD_ROLE_KEY = "aiCodeRoaster.role";
    private readonly CONFIG_SECTION = "aiCodeRoaster";
    private migrated = false;
    private roleManager: RoleManager;

    constructor(private context: vscode.ExtensionContext) {
        this.roleManager = new RoleManager(context);
    }

    // ========== Migration (One-time) ==========

    /**
     * One-time migration: migrates old configuration from globalState to VSCode settings.
     * Clears old data after migration. Only runs once per session.
     */
    async migrateIfNeeded(): Promise<void> {
        if (this.migrated) {
            return;
        }

        const oldConfig = this.context.globalState.get<ApiConfig>(this.OLD_CONFIG_KEY);
        const oldRole = this.context.globalState.get<string>(this.OLD_ROLE_KEY);

        if (oldConfig || oldRole) {
            const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);

            // Migrate API config
            if (oldConfig) {
                await config.update("apiBaseUrl", oldConfig.baseUrl);
                await config.update("modelName", oldConfig.model);
            }

            // Migrate Role
            if (oldRole) {
                await config.update("role", oldRole);
            }

            // Clear old configuration
            await this.context.globalState.update(this.OLD_CONFIG_KEY, undefined);
            await this.context.globalState.update(this.OLD_ROLE_KEY, undefined);
        }

        this.migrated = true;
    }

    /**
     * Initializes custom roles by loading from file.
     * Should be called once during extension activation.
     */
    async initRoles(): Promise<void> {
        await this.roleManager.loadCustomRoles();
    }

    // ========== Configuration from VSCode Settings ==========

    /**
     * Gets the current API configuration from settings. Returns undefined if not configured.
     */
    async getApiConfig(): Promise<ApiConfig | undefined> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        const baseUrl = config.get<string>("apiBaseUrl");
        const model = config.get<string>("modelName");

        if (!baseUrl || !model) {
            return undefined;
        }
        return { baseUrl, model };
    }

    // ========== Role Management ==========

    /**
     * Gets the current role ID from settings.
     * @throws Error if role is not set or invalid
     */
    getRoleId(): string {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        const role = config.get<string>("role");

        // Validate role using RoleManager
        if (!role) {
            throw new Error("Role is not configured");
        }
        if (!this.roleManager.isValidRole(role)) {
            throw new Error(`Invalid role: ${role}`);
        }
        return role;
    }

    /**
     * Sets the role preference in settings.
     */
    async setRole(role: string): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        await config.update("role", role);
    }

    // ========== Role Management Delegation ==========

    /**
     * Gets a role configuration by ID.
     * @throws Error if role ID is not found
     */
    getRoleConfig(id: string): RoleConfig {
        return this.roleManager.getRoleConfig(id);
    }

    /**
     * Returns all roles (predefined + custom).
     */
    getAllRoles(): RoleConfig[] {
        return this.roleManager.getAllRoles();
    }

    /**
     * Returns all custom roles only.
     */
    getCustomRoles(): RoleConfig[] {
        return this.roleManager.getCustomRoles();
    }

    /**
     * Creates a new custom role.
     */
    async createCustomRole(role: Omit<RoleConfig, 'isCustom'>): Promise<void> {
        return await this.roleManager.createCustomRole(role);
    }

    /**
     * Updates an existing custom role.
     */
    async updateCustomRole(id: string, updates: Partial<Omit<RoleConfig, 'id' | 'isCustom'>>): Promise<void> {
        return await this.roleManager.updateCustomRole(id, updates);
    }

    /**
     * Deletes a custom role by ID.
     */
    async deleteCustomRole(id: string): Promise<void> {
        return await this.roleManager.deleteCustomRole(id);
    }

    // ========== API Key Management (Secure Storage) ==========

    /**
     * Retrieves the stored API key from secure storage.
     */
    async getApiKey(): Promise<string | undefined> {
        return await this.context.secrets.get(this.SECRET_KEY);
    }

    /**
     * Stores the API key in secure storage.
     */
    async storeApiKey(key: string): Promise<void> {
        await this.context.secrets.store(this.SECRET_KEY, key);
    }

    /**
     * Deletes the API key from secure storage.
     */
    async deleteApiKey(): Promise<void> {
        await this.context.secrets.delete(this.SECRET_KEY);
    }

    /**
     * Deletes all configuration (API URL, model, role) from settings.
     * Role is reset to DEFAULT_ROLE instead of undefined.
     */
    async deleteAllConfig(): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        await config.update('apiBaseUrl', undefined);
        await config.update('modelName', undefined);
        await config.update('role', DEFAULT_ROLE);
    }
}
