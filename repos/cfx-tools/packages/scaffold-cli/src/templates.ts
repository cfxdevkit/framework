export interface TemplateDefinition {
  name: string;
  description: string;
  files: string[];
}

const templates: TemplateDefinition[] = [
  { name: 'basic', description: 'Basic template', files: ['package.json', 'README.md'] },
  { name: 'react', description: 'React template', files: ['package.json', 'README.md'] },
  { name: 'solidity', description: 'Solidity template', files: ['package.json', 'README.md'] },
];

export function listTemplates(): TemplateDefinition[] {
  return templates.map((template) => ({ ...template, files: [...template.files] }));
}

export function getTemplate(name: string): TemplateDefinition | undefined {
  const template = templates.find((item) => item.name === name);
  return template ? { ...template, files: [...template.files] } : undefined;
}

export function renderFile(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, key: string) => values[key] ?? match);
}
