# AGENTS.md

This file provides guidelines for AI coding agents working on the AI Code Roaster project.

## Project Overview

AI Code Roaster is a Visual Studio Code extension built with TypeScript. The project follows standard VSCode extension development patterns.

## Build, Lint, and Test Commands

### Compilation

- `npm run compile` - Compile TypeScript to JavaScript (outputs to `out/` directory)
- `npm run watch` - Compile in watch mode for development

### Linting

- `npm run lint` - Run ESLint on all TypeScript files in `src/`
- Uses typescript-eslint with ESLint 9

### Testing

- `npm run test` - Run VSCode extension tests using `@vscode/test-electron`
- `npm run pretest` - Runs `npm run compile` and `npm run lint` before tests (required before running tests)

### Single Test Execution

To run a single test, modify the test file directly or use the `--grep` flag with vscode-test. The test framework uses Mocha.

## Code Style Guidelines

### TypeScript Configuration

- Target: ES2022
- Module: Node16
- Strict mode: enabled (all strict type-checking options)
- Source maps: enabled
- Root directory: `src/`
- Output directory: `out/`

### ESLint Rules

The following rules are enforced:

- `curly` - Require curly braces for all control statements
- `eqeqeq` - Require `===` and `!==` instead of `==` and `!=`
- `no-throw-literal` - Only throw Error objects, not strings or expressions
- `semi` - Require semicolons
- `@typescript-eslint/naming-convention` - Imports must use camelCase or PascalCase

### Imports

- Use `import * as moduleName from 'module'` for named imports
- VSCode API: `import * as vscode from 'vscode'`
- Standard library: `import * as assert from 'assert'`
- Use `Node16` module resolution

### Naming Conventions

- Functions: camelCase (e.g., `activate`, `deactivate`)
- Classes/Interfaces: PascalCase (e.g., `ExtensionContext`)
- Constants: camelCase or UPPER_SNAKE_CASE as appropriate
- Import naming: camelCase or PascalCase (per ESLint rule)

### Formatting

- Indentation: Use editor/VSCode default (Tabs)
- Semicolons: Required at end of statements
- Braces: Always use curly braces for control statements
- Equality: Use strict equality (`===`, `!==`)

### Error Handling

- Only throw `Error` objects, never primitives or expressions
- Use `try/catch` for async operations
- Console.log for diagnostic output during development
- Console.error for errors

### VSCode Extension Patterns

- Activate extension in `activate()` function
- Register commands with `vscode.commands.registerCommand`
- Push disposables to `context.subscriptions`
- Clean up resources in `deactivate()` if needed
- Commands defined in `package.json` `contributes.commands`

### File Structure

- Source files: `src/extension.ts`, `src/test/extension.test.ts`
- Output: `out/` (compiled JavaScript)
- Configuration: `tsconfig.json`, `eslint.config.mjs`
- Package manifest: `package.json`

### Type Annotations

- Enable strict TypeScript checking
- Use explicit types for function parameters and return values when not inferable
- Use `vscode` namespace types (e.g., `vscode.ExtensionContext`)

### Comments

- Use JSDoc for public API documentation
- Add comments for complex logic or non-obvious behavior
- Keep comments up to date with code changes

### Testing

- Use Mocha framework with Node.js assert
- Use `suite()` and `test()` functions
- VSCode API can be used in tests (import `* as vscode`)
- Run `npm run pretest` before tests to ensure compilation and linting pass
