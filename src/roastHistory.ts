import * as vscode from 'vscode';
import { diffLines } from 'diff';
import { CONSTANTS } from './constants';

/**
 * Represents the history of a code roast operation.
 */
export class RoastHistory {
    readonly timestamp: string;
    readonly filePath: string;
    readonly fileContent: string;
    readonly response: string;

    constructor(document: vscode.TextDocument, response: string) {
        this.timestamp = new Date().toISOString();
        this.filePath = document.uri.toString();
        this.fileContent = document.getText();
        this.response = response;
    }

    /**
     * Calculate the number of different lines between this history and a new document.
     * @param newDocument The new document to compare against
     * @returns The number of lines that are different (added or removed)
     */
    private getDifferentLineCount(newDocument: vscode.TextDocument): number {
        const newContent = newDocument.getText();
        const changes = diffLines(this.fileContent, newContent);

        let differentLines = 0;
        for (const change of changes) {
            if (change.added || change.removed) {
                differentLines += change.count || 0;
            }
        }

        return differentLines;
    }

    /**
     * Check if the difference between this history and a new document is significant.
     * Returns true if:
     * - Time has exceeded MIN_TIME_INTERVAL AND there are line changes > 0, OR
     * - Line changes exceed MIN_LINE_CHANGES
     * @param newDocument The new document to compare against
     * @returns true if the difference is significant, false otherwise
     */
    isSignificantChange(newDocument: vscode.TextDocument): boolean {
        const currentTimestamp = new Date().toISOString();
        const timeDiff = new Date(currentTimestamp).getTime() - new Date(this.timestamp).getTime();
        const lineChangeCount = this.getDifferentLineCount(newDocument);

        const isTimeoutWithChanges = timeDiff >= CONSTANTS.MIN_TIME_INTERVAL && lineChangeCount > 0;
        const isLargeChange = lineChangeCount > CONSTANTS.MIN_LINE_CHANGES;

        return isTimeoutWithChanges || isLargeChange;
    }
}
