// Public surface for @cfxdevkit/create.
// Implementations land here as the package is filled in. See ./API.md.
export const __packageName = '@cfxdevkit/create' as const;
export { parseArgs } from './args.js';
export { scaffoldProject } from './scaffold.js';
export type { TemplateDefinition, TemplateFile, TemplateTarget } from './templates.js';
export { getTemplate, getTemplateFiles, listTemplates, renderFile } from './templates.js';
export { validateName } from './validate.js';
