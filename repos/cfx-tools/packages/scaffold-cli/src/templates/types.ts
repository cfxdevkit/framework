export interface TemplateFile {
  /** Relative path to write inside the project root. */
  path: string;
  /** Raw content — supports `{{name}}` / `{{version}}` / `{{description}}` placeholders. */
  content: string;
}

export type TemplateTarget = 'default' | 'devcontainer' | 'docker';

export interface TemplateDefinition {
  name: string;
  description: string;
  /** Base files present in all targets. */
  files: TemplateFile[];
  /** Extra files per deployment target (merged with base files). */
  targets?: Partial<Record<TemplateTarget, TemplateFile[]>>;
}
