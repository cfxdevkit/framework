import { describe, expect, it } from 'vitest';
import { getTemplate, listTemplates, renderFile } from './templates.js';

describe('listTemplates', () => {
  it('returns list of available templates', () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(3);
    expect(templates[0]).toMatchObject({ name: 'basic', description: 'Basic template' });
    expect(templates[1]).toMatchObject({ name: 'react', description: 'React template' });
    expect(templates[2]).toMatchObject({ name: 'solidity', description: 'Solidity template' });
  });
});
describe('getTemplate', () => {
  it('returns template by name', () => {
    const template = getTemplate('react');
    expect(template).toMatchObject({ name: 'react', description: 'React template' });
  });
  it('returns undefined for unknown template', () => {
    expect(getTemplate('unknown')).toBeUndefined();
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
