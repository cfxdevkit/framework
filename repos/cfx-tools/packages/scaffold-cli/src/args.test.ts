import { describe, expect, it } from 'vitest';
import { parseArgs } from './args.js';

describe('parseArgs', () => {
  it('returns empty object for empty args', () => {
    expect(parseArgs([])).toEqual({});
  });
  it('parses positional arguments', () => {
    expect(parseArgs(['my-project'])).toEqual({ positional: ['my-project'] });
  });
  it('parses short flags', () => {
    expect(parseArgs(['-t', 'react'])).toEqual({ template: 'react' });
  });
  it('parses long flags', () => {
    expect(parseArgs(['--template', 'react'])).toEqual({ template: 'react' });
  });
  it('parses boolean flags', () => {
    expect(parseArgs(['--force'])).toEqual({ force: true });
  });
  it('handles mixed args', () => {
    expect(parseArgs(['my-project', '--template', 'react', '--force'])).toEqual({
      positional: ['my-project'],
      template: 'react',
      force: true,
    });
  });
  it('ignores unknown flags', () => {
    expect(parseArgs(['--unknown'])).toEqual({});
  });
});
