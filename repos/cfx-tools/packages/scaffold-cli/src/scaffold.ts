import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getTemplate, getTemplateFiles, renderFile, type TemplateTarget } from './templates.js';

export interface ScaffoldOptions {
  name: string;
  version?: string;
  description?: string;
  target?: TemplateTarget;
  skipInstall?: boolean;
  force?: boolean;
  [key: string]: string | boolean | undefined;
}

export async function scaffoldProject(
  projectDir: string,
  templateName: string,
  options: ScaffoldOptions,
): Promise<void> {
  const template = getTemplate(templateName);
  if (!template) throw new Error(`Template not found: ${templateName}`);
  if (existsSync(projectDir) && !options.force) {
    throw new Error(`Target directory already exists: ${projectDir}`);
  }
  mkdirSync(projectDir, { recursive: true });

  const values: Record<string, string> = {
    name: options.name,
    version: options.version ?? '0.1.0',
    description: options.description ?? '',
    ...Object.fromEntries(
      Object.entries(options)
        .filter(([, v]) => typeof v === 'string')
        .map(([k, v]) => [k, v as string]),
    ),
  };

  const files = getTemplateFiles(template, options.target ?? 'default');
  for (const file of files) {
    const dest = resolve(projectDir, file.path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, renderFile(file.content, values), 'utf8');
  }

  if (!options.skipInstall) {
    spawnSync('npm', ['install'], { stdio: 'inherit', cwd: projectDir });
  }
}
