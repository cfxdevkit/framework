import { describe, expect, it } from 'vitest';
import { getTemplate, getTemplateFiles, listTemplates, renderFile } from './templates.js';

describe('listTemplates', () => {
  it('returns list of available templates including new ones', () => {
    const templates = listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);
    const names = templates.map((t) => t.name);
    expect(names).toContain('minimal-dapp');
    expect(names).toContain('wallet-probe');
    expect(names).toContain('project-example');
    // legacy aliases still present
    expect(names).toContain('basic');
    expect(names).toContain('react');
    expect(names).toContain('solidity');
  });
});

describe('getTemplate', () => {
  it('returns template by name', () => {
    const template = getTemplate('minimal-dapp');
    expect(template).toMatchObject({ name: 'minimal-dapp' });
    expect(template?.files.length).toBeGreaterThan(0);
  });
  it('returns legacy alias by name', () => {
    const template = getTemplate('react');
    expect(template).toMatchObject({
      name: 'react',
      description: 'React template (alias for minimal-dapp).',
    });
  });
  it('returns undefined for unknown template', () => {
    expect(getTemplate('unknown')).toBeUndefined();
  });
});

describe('getTemplateFiles', () => {
  it('returns base files for default target', () => {
    const template = getTemplate('minimal-dapp')!;
    const files = getTemplateFiles(template, 'default');
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((f) => typeof f.path === 'string' && typeof f.content === 'string')).toBe(
      true,
    );
  });
  it('merges devcontainer extra files', () => {
    const template = getTemplate('minimal-dapp')!;
    const base = getTemplateFiles(template, 'default');
    const dc = getTemplateFiles(template, 'devcontainer');
    expect(dc.length).toBeGreaterThan(base.length);
    expect(dc.some((f) => f.path.includes('devcontainer'))).toBe(true);
  });
});

describe('renderFile', () => {
  it('replaces placeholders in file content', () => {
    const content = 'Hello {{name}}! Version: {{version}}';
    const rendered = renderFile(content, { name: 'my-project', version: '1.0.0' });
    expect(rendered).toBe('Hello my-project! Version: 1.0.0');
  });
  it('leaves unknown placeholders unchanged', () => {
    const content = 'Hello {{name}}! {{unknown}}';
    const rendered = renderFile(content, { name: 'my-project' });
    expect(rendered).toBe('Hello my-project! {{unknown}}');
  });
});
