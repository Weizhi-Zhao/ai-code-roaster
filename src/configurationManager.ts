import * as vscode from "vscode";
import { CONSTANTS } from "./constants";

export interface ApiConfig {
  baseUrl: string;
  model: string;
}

/**
 * Manages all configuration storage for the extension.
 * - Non-sensitive configuration (API base URL, model name) uses globalState
 * - Sensitive data (API key) uses the secure secrets API
 */
export class ConfigurationManager {
  private readonly STORAGE_KEY = "aiCodeRoaster.config";
  private readonly DEFAULT_CONFIG: ApiConfig = {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    model: "nvidia/nemotron-3-nano-30b-a3b:free",
  };

  constructor(private context: vscode.ExtensionContext) { }

  // ========== API Key Management (Secure Storage) ==========

  /**
   * Retrieves the stored API key from secure storage.
   */
  async getApiKey(): Promise<string | undefined> {
    return await this.context.secrets.get(CONSTANTS.SECRET_KEY);
  }

  /**
   * Stores the API key in secure storage.
   */
  async storeApiKey(key: string): Promise<void> {
    await this.context.secrets.store(CONSTANTS.SECRET_KEY, key);
  }

  /**
   * Deletes the API key from secure storage.
   */
  async deleteApiKey(): Promise<void> {
    await this.context.secrets.delete(CONSTANTS.SECRET_KEY);
  }

  // ========== API Configuration Management (Global State) ==========

  /**
   * Gets the current API configuration, falling back to defaults if not set.
   */
  async getConfig(): Promise<ApiConfig> {
    const stored = this.context.globalState.get<ApiConfig>(this.STORAGE_KEY);
    return stored || { ...this.DEFAULT_CONFIG };
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
   * Resets the configuration to default values.
   */
  async resetToDefaults(): Promise<void> {
    await this.context.globalState.update(this.STORAGE_KEY, {
      ...this.DEFAULT_CONFIG,
    });
  }

  /**
   * Gets the default configuration (without modifying stored config).
   */
  getDefaultConfig(): ApiConfig {
    return { ...this.DEFAULT_CONFIG };
  }
}
