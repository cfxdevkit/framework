# `@cfxdevkit/create` — Public API

> Project scaffolder (npm create @cfxdevkit).

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 11 symbols |
| `./templates` | 7 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/create";
export { parseArgs }
export { scaffoldProject }
export { TemplateDefinition }
export { TemplateFile }
export { TemplateTarget }
export { getTemplate }
export { getTemplateFiles }
export { listTemplates }
export { renderFile }
export { validateName }
```

---

## `./templates`

```ts
export { TemplateDefinition }
export { TemplateFile }
export { TemplateTarget }
export declare function listTemplates(): TemplateDefinition[];
export declare function getTemplate(name: string): TemplateDefinition | undefined;
export declare function renderFile(content: string, values: Record<string, string>): string;
export declare function getTemplateFiles(template: TemplateDefinition, target?: TemplateTarget): TemplateFile[];
```

<!-- api-hash: 1b9551fc80790d1bdc426f3ce568b5fa96a38b35068a3fc59d19e1e3506ae724 -->
