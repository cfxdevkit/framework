import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getTemplate, renderFile } from './templates.js';

export interface ScaffoldOptions {
  name: string;
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
  const values = Object.fromEntries(
    Object.entries(options)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [key, value as string]),
  );
  for (const file of template.files) {
    const destination = resolve(projectDir, file);
    const content = readFileSync(destination, 'utf8');
    writeFileSync(destination, renderFile(content, values));
  }
  if (!options.skipInstall) {
    spawnSync('npm', ['install'], { stdio: 'inherit', cwd: projectDir });
  }
}
