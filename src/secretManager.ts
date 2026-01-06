import * as vscode from 'vscode';
import { CONSTANTS } from './constants';

export class SecretManager {
  constructor(private context: vscode.ExtensionContext) {}

  async getApiKey(): Promise<string | undefined> {
    return await this.context.secrets.get(CONSTANTS.SECRET_KEY);
  }

  async storeApiKey(key: string): Promise<void> {
    await this.context.secrets.store(CONSTANTS.SECRET_KEY, key);
  }

  async deleteApiKey(): Promise<void> {
    await this.context.secrets.delete(CONSTANTS.SECRET_KEY);
  }
}