import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('showcase gateway', () => {
  it('exports a React app component', () => {
    expect(App).toBeTypeOf('function');
  });
});
