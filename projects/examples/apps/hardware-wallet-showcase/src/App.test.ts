import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('hardware wallet showcase', () => {
  it('exports a React app component', () => {
    expect(App).toBeTypeOf('function');
  });
});
