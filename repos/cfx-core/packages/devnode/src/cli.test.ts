import { describe, expect, it } from 'vitest';
import { parseArgs, printHelp } from './cli.js';

describe('parseArgs', () => {
  it('parses default config with no arguments', () => {
    const result = parseArgs([]);
    expect(result.config).toEqual({});
    expect(result.help).toBe(false);
    expect(result.noMining).toBe(false);
  });

  it('parses --core-port and --espace-port', () => {
    const result = parseArgs(['--core-port', '3000', '--espace-port', '4000']);
    expect(result.config.coreRpcPort).toBe(3000);
    expect(result.config.evmRpcPort).toBe(4000);
  });

  it('parses --accounts and --balance', () => {
    const result = parseArgs(['--accounts', '5', '--balance', '500']);
    expect(result.config.accounts).toBe(5);
    expect(result.config.balanceCfx).toBe('500');
  });

  it('parses --no-mining sets miningIntervalMs to 0', () => {
    const result = parseArgs(['--no-mining']);
    expect(result.noMining).toBe(true);
    expect(result.config.miningIntervalMs).toBe(0);
  });

  it('parses --logging flag', () => {
    const result = parseArgs(['--logging']);
    expect(result.config.logging).toBe(true);
  });

  it('throws on missing value for argument', () => {
    expect(() => parseArgs(['--accounts'])).toThrow(/missing value/);
  });

  it('throws on unknown argument', () => {
    expect(() => parseArgs(['--unknown'])).toThrow(/unknown argument/);
  });
});

describe('printHelp', () => {
  it('writes help to stdout', () => {
    const originalWrite = process.stdout.write;
    let output = '';
    process.stdout.write = (chunk: string | Buffer) => {
      output += chunk.toString();
      return true;
    };
    try {
      printHelp();
      expect(output).toContain('cfxdevkit-devnode');
      expect(output).toContain('--core-port');
      expect(output).toContain('--help');
    } finally {
      process.stdout.write = originalWrite;
    }
  });
});
