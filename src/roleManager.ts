import * as vscode from "vscode";
import { PREDEFINED_ROLES } from "./constants";
import { TextDecoder, TextEncoder } from "util";

// Role configuration interface
export interface RoleConfig {
    id: string;
    name: string;
    description: string;
    header: string;  // title displayed before the response
    systemPrompt: string;
    isCustom: boolean;  // true for custom roles, false for predefined roles
}

const CUSTOM_ROLES_FILE = "customRoles.json";

/**
 * Manages role configurations including predefined and custom roles.
 * - Predefined roles are hardcoded in constants.ts
 * - Custom roles are stored in globalStorageUri as a JSON file
 */
export class RoleManager {
    private customRoles: RoleConfig[] = [];

    constructor(private context: vscode.ExtensionContext) { }

    /**
     * Gets the file URI for custom roles storage.
     */
    private getStorageFileUri(): vscode.Uri {
        return vscode.Uri.joinPath(this.context.globalStorageUri, CUSTOM_ROLES_FILE);
    }

    /**
     * Loads custom roles from file.
     * Creates an empty file if it doesn't exist.
     * Uses EAFP pattern with comprehensive error handling.
     */
    async loadCustomRoles(): Promise<void> {
        // Ensure directory exists
        await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);

        const fileUri = this.getStorageFileUri();

        try {
            // Directly attempt to read the file (EAFP pattern)
            const readData = await vscode.workspace.fs.readFile(fileUri);
            const jsonString = new TextDecoder().decode(readData);
            const stored = JSON.parse(jsonString) as { customRoles: RoleConfig[] };
            this.customRoles = stored?.customRoles ?? [];

        } catch (error: unknown) {
            // Case A: File not found
            if (error instanceof vscode.FileSystemError || (error as any)?.code === 'FileNotFound') {
                await this.initDefaultFile(fileUri);
            }
            // Case B: JSON parse error (corrupted file)
            else if (error instanceof SyntaxError) {
                console.error('Custom roles JSON file is corrupted, resetting to default', error);
                await this.initDefaultFile(fileUri);
            }
            // Case C: Other errors (permission issues, etc.)
            else {
                console.error('Failed to read custom roles file', error);
                this.customRoles = [];
            }
        }
    }

    /**
     * Initializes the default custom roles file with empty array.
     */
    private async initDefaultFile(uri: vscode.Uri): Promise<void> {
        const defaultData = { customRoles: [] };
        const content = new TextEncoder().encode(JSON.stringify(defaultData, null, 2));
        await vscode.workspace.fs.writeFile(uri, content);
        this.customRoles = [];
    }

    /**
     * Saves custom roles to file.
     */
    private async saveCustomRoles(): Promise<void> {
        // Ensure directory exists
        await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);

        // Serialize and write
        const fileUri = this.getStorageFileUri();
        const content = Buffer.from(JSON.stringify({ customRoles: this.customRoles }, null, 2), 'utf-8');
        await vscode.workspace.fs.writeFile(fileUri, content);
    }

    /**
     * Gets a role configuration by ID.
     * Returns predefined role if found, otherwise returns custom role if found.
     * @throws Error if role ID is invalid.
     */
    getRoleConfig(id: string): RoleConfig {
        if (id in PREDEFINED_ROLES) {
            return PREDEFINED_ROLES[id as keyof typeof PREDEFINED_ROLES];
        }
        const customRole = this.customRoles.find(role => role.id === id);
        if (customRole) {
            return customRole;
        }
        throw new Error(`Role "${id}" not found.`);
    }

    /**
     * Validates if a role ID is valid (predefined or custom).
     */
    isValidRole(id: string): boolean {
        return id in PREDEFINED_ROLES || this.customRoles.some(role => role.id === id);
    }

    /**
     * Returns all roles (predefined + custom).
     */
    getAllRoles(): RoleConfig[] {
        return [...Object.values(PREDEFINED_ROLES), ...this.customRoles];
    }

    /**
     * Returns all custom roles only.
     */
    getCustomRoles(): RoleConfig[] {
        return [...this.customRoles];
    }

    /**
     * Creates a new custom role.
     * @throws Error if validation fails
     */
    async createCustomRole(role: Omit<RoleConfig, 'isCustom'>): Promise<void> {
        // Load latest data from file
        await this.loadCustomRoles();

        // Validate ID format
        if (!/^[a-zA-Z0-9_-]+$/.test(role.id)) {
            throw new Error(`Invalid role ID format. Only letters, numbers, hyphens, and underscores are allowed.`);
        }

        // Check conflict with predefined roles
        if (role.id in PREDEFINED_ROLES) {
            throw new Error(`Role ID "${role.id}" conflicts with a predefined role.`);
        }

        // Check conflict with existing custom roles
        if (this.customRoles.some(r => r.id === role.id)) {
            throw new Error(`Role ID "${role.id}" already exists.`);
        }

        // Validate required fields
        if (!role.name || !role.description || !role.header || !role.systemPrompt) {
            throw new Error(`All fields (name, description, header, systemPrompt) are required.`);
        }

        const customRole: RoleConfig = { ...role, isCustom: true };
        this.customRoles.push(customRole);
        await this.saveCustomRoles();
    }

    /**
     * Updates an existing custom role.
     * @throws Error if role not found
     */
    async updateCustomRole(id: string, updates: Partial<Omit<RoleConfig, 'id' | 'isCustom'>>): Promise<void> {
        // Load latest data from file
        await this.loadCustomRoles();

        const index = this.customRoles.findIndex(role => role.id === id);
        if (index === -1) {
            throw new Error(`Custom role "${id}" not found.`);
        }

        // Apply updates, later items overwrite earlier ones
        this.customRoles[index] = { ...this.customRoles[index], ...updates };
        await this.saveCustomRoles();
    }

    /**
     * Deletes a custom role by ID.
     * @throws Error if role not found
     */
    async deleteCustomRole(id: string): Promise<void> {
        // Load latest data from file
        await this.loadCustomRoles();

        const index = this.customRoles.findIndex(role => role.id === id);
        if (index === -1) {
            throw new Error(`Custom role "${id}" not found.`);
        }

        this.customRoles.splice(index, 1);
        await this.saveCustomRoles();
    }
}
