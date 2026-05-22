# `@cfxdevkit/create` — Public API

> Project scaffolder (npm create @cfxdevkit).

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 11 symbols |
| `./templates` | 7 symbols |

---

## `.`

### Usage

```typescript
import { parseArgs, scaffoldProject, validateName } from '@cfxdevkit/create';

const args = parseArgs();
if (validateName(args.name)) {
  scaffoldProject(args.name, {
    name: args.name,
    description: 'Generated project'
  });
}
```

```ts
// The name of the package
export declare const __packageName: "@cfxdevkit/create";
// Parses command-line arguments passed to the CLI
export declare function parseArgs(): { name: string; description?: string };
// Scaffolds a new project using a template, writing files to disk
export declare function scaffoldProject(projectName: string, options: { name: string; description?: string }): Promise<void>;
// Defines the structure of a project template
export interface TemplateDefinition {
  name: string;
  description: string;
  files: TemplateFile[];
  target?: TemplateTarget;
}
// Defines a single file within a template, including its name and content
export interface TemplateFile {
  name: string;
  content: string;
}
// Defines the target context (e.g., root, src) for where template files should be placed
export type TemplateTarget = 'root' | 'src' | string;
// Retrieves a template by its registered name
export declare function getTemplate(name: string): TemplateDefinition | undefined;
// Retrieves the resolved file list for a given template, optionally scoped to a target context
export declare function getTemplateFiles(template: TemplateDefinition, target?: TemplateTarget): TemplateFile[];
// Lists all available registered templates
export declare function listTemplates(): TemplateDefinition[];
// Renders template content (e.g., with Mustache-style placeholders) using provided values
export declare function renderFile(content: string, values: Record<string, string>): string;
// Validates whether a given project name conforms to naming conventions (e.g., npm package name rules)
export declare function validateName(name: string): boolean;
```

---

## `./templates`

### Usage

```typescript
// Example usage of `TemplateDefinition`
const templateDefinition = {
  name: 'my-template',
  description: 'A sample template',
  files: [
    { name: 'index.html', content: '<h1>Hello, World!</h1>' },
    { name: 'style.css', content: 'body { background-color: #f0f0f0; }' }
  ]
};

// Example usage of `getTemplateFiles`
const files = getTemplateFiles(templateDefinition, 'src');
console.log(files);

// Example usage of `listTemplates`
const templates = listTemplates();
console.log(templates);

// Example usage of `getTemplate`
const template = getTemplate('my-template');
console.log(template);

// Example usage of `renderFile`
const content = renderFile('Hello {{name}}!', { name: 'John Doe' });
console.log(content); // => "Hello John Doe!"
```

```ts
// Defines the structure of a project template
export interface TemplateDefinition {
  name: string;
  description: string;
  files: TemplateFile[];
  target?: TemplateTarget;
}
// Defines a single file within a template
export interface TemplateFile {
  name: string;
  content: string;
}
// Defines the target context for template files
export type TemplateTarget = 'root' | 'src' | string;
// Lists all available templates registered in the system
export declare function listTemplates(): TemplateDefinition[];
// Retrieves a template by its registered name, returning `undefined` if not found
export declare function getTemplate(name: string): TemplateDefinition | undefined;
// Renders template content (e.g., with placeholders like `{{name}}`) using provided key-value pairs
export declare function renderFile(content: string, values: Record<string, string>): string;
// Resolves and returns the list of files for a given template, optionally filtered by target context
export declare function getTemplateFiles(template: TemplateDefinition, target?: TemplateTarget): TemplateFile[];
```

<!-- api-hash: 2ec45b9aff43938ba23d3686f9598edefb3b6826e7982bfec161b33de5894d10 -->
