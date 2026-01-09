import * as vscode from "vscode";
import { DEFAULT_ROLE, RoleType, ROLES } from "./constants";

export interface ApiConfig {
    baseUrl: string;
    model: string;
}

/**
 * Manages all configuration storage for the extension.
 * - Non-sensitive configuration (API base URL, model name, role) uses globalState
 * - Sensitive data (API key) uses the secure secrets API
 */
export class ConfigurationManager {
    private readonly STORAGE_KEY = "aiCodeRoaster.config";
    private readonly SECRET_KEY = "aiCodeRoaster-api-key";
    private readonly ROLE_STORAGE_KEY = "aiCodeRoaster.role";

    constructor(private context: vscode.ExtensionContext) { }

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

    // ========== API Configuration Management (Global State) ==========

    /**
     * Gets the current API configuration. Returns undefined if not configured.
     */
    async getConfig(): Promise<ApiConfig | undefined> {
        return this.context.globalState.get<ApiConfig>(this.STORAGE_KEY);
    }

    /**
     * Saves a new API configuration after validating it.
     * @throws Error if validation fails
     */
    async saveConfig(config: ApiConfig): Promise<void> {
        // Validate URL - must be HTTPS or localhost
        const trimmedUrl = config.baseUrl.trim();
        if (
            !trimmedUrl.startsWith("https://") &&
            !trimmedUrl.startsWith("http://localhost")
        ) {
            throw new Error(
                "API Base URL must use HTTPS (or http://localhost for local development)"
            );
        }

        try {
            new URL(trimmedUrl);
        } catch {
            throw new Error("Invalid API Base URL format");
        }

        // Validate model name
        const trimmedModel = config.model.trim();
        if (!trimmedModel) {
            throw new Error("Model name cannot be empty");
        }

        const validatedConfig: ApiConfig = {
            baseUrl: trimmedUrl,
            model: trimmedModel,
        };

        await this.context.globalState.update(this.STORAGE_KEY, validatedConfig);
    }

    /**
     * Deletes the stored configuration.
     */
    async deleteConfig(): Promise<void> {
        await this.context.globalState.update(this.STORAGE_KEY, undefined);
    }

    // ========== Role Management (Global State) ==========

    /**
     * Gets the current role. Returns default role if not configured or if the stored role is invalid.
     */
    async getRole(): Promise<RoleType> {
        const storedRole = this.context.globalState.get<RoleType>(this.ROLE_STORAGE_KEY, DEFAULT_ROLE);
        // Check if storedRole is a valid key in ROLES (handles migration from old role IDs)
        if (storedRole in ROLES) {
            return storedRole;
        }
        // If stored role is invalid, update storage to default
        await this.setRole(DEFAULT_ROLE);
        return DEFAULT_ROLE;
    }

    /**
     * Sets the role preference.
     */
    async setRole(role: RoleType): Promise<void> {
        await this.context.globalState.update(this.ROLE_STORAGE_KEY, role);
    }
}
