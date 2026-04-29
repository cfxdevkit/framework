import { describe, expect, it } from 'vitest';
import { parseArgs } from './args.js';
import { runDerive } from './commands/derive.js';
import { runGenerate } from './commands/generate.js';
import { run } from './run.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

class StringStream {
  data = '';
  write(chunk: string): boolean {
    this.data += chunk;
    return true;
  }
}

describe('parseArgs', () => {
  it('parses command + positionals + flags', () => {
    const p = parseArgs(['derive', 'extra', '--count', '3', '--generate', '--type=mining']);
    expect(p.command).toBe('derive');
    expect(p.positionals).toEqual(['extra']);
    expect(p.flags).toEqual({ count: '3', generate: true, type: 'mining' });
  });

  it('handles --key=value form', () => {
    const p = parseArgs(['status', '--chain=core-mainnet']);
    expect(p.flags).toEqual({ chain: 'core-mainnet' });
  });

  it('returns undefined command on empty argv', () => {
    expect(parseArgs([]).command).toBeUndefined();
  });
});

describe('runDerive', () => {
  it('derives a single dual-space account from a mnemonic', () => {
    const r = runDerive({ mnemonic: TEST_MNEMONIC, count: 1, coreNetworkId: 2029 });
    expect(r.accounts).toHaveLength(1);
    const acc = r.accounts[0];
    if (!acc) throw new Error('expected account');
    expect(acc.evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(acc.coreAddress.startsWith('net2029:')).toBe(true);
    expect(acc.paths.evm).toBe("m/44'/60'/0'/0/0");
    expect(acc.paths.core).toBe("m/44'/503'/0'/0/0");
  });

  it('derives multiple sequential indices', () => {
    const r = runDerive({ mnemonic: TEST_MNEMONIC, count: 3, startIndex: 7, coreNetworkId: 1 });
    expect(r.accounts.map((a) => a.index)).toEqual([7, 8, 9]);
    for (const a of r.accounts) {
      expect(a.coreAddress.startsWith('cfxtest:')).toBe(true);
    }
  });

  it("mining accountType uses the 1' BIP-44 segment", () => {
    const r = runDerive({ mnemonic: TEST_MNEMONIC, accountType: 'mining' });
    const acc = r.accounts[0];
    if (!acc) throw new Error('expected account');
    expect(acc.paths.evm).toBe("m/44'/60'/1'/0/0");
  });

  it('--generate produces a valid mnemonic when none is supplied', () => {
    const r = runDerive({ generate: true, count: 1 });
    expect(r.mnemonic.split(' ')).toHaveLength(12);
  });

  it('throws if neither --mnemonic nor --generate is supplied', () => {
    expect(() => runDerive({})).toThrow(/--mnemonic.*--generate/);
  });

  it('throws on an invalid mnemonic', () => {
    expect(() => runDerive({ mnemonic: 'not a real mnemonic phrase here' })).toThrow(/BIP-39/);
  });
});

describe('runGenerate', () => {
  it('generates a 12-word mnemonic by default', () => {
    const r = runGenerate();
    expect(r.wordCount).toBe(12);
    expect(r.valid).toBe(true);
  });

  it('honours --strength 256', () => {
    const r = runGenerate({ strength: 256 });
    expect(r.wordCount).toBe(24);
  });
});

describe('run() integration', () => {
  it('prints help with no args (exit 1)', async () => {
    const out = new StringStream();
    const err = new StringStream();
    const code = await run([], { stdout: out, stderr: err });
    expect(out.data).toMatch(/Conflux developer CLI/);
    expect(code).toBe(1);
  });

  it('--help exits 0', async () => {
    const out = new StringStream();
    const err = new StringStream();
    const code = await run(['--help'], { stdout: out, stderr: err });
    expect(code).toBe(0);
  });

  it('unknown command exits 2 and writes to stderr', async () => {
    const out = new StringStream();
    const err = new StringStream();
    const code = await run(['nope'], { stdout: out, stderr: err });
    expect(code).toBe(2);
    expect(err.data).toMatch(/unknown command/);
  });

  it('derive --mnemonic prints addresses', async () => {
    const out = new StringStream();
    const err = new StringStream();
    const code = await run(
      ['derive', '--mnemonic', TEST_MNEMONIC, '--count', '2', '--core-network-id', '2029'],
      { stdout: out, stderr: err },
    );
    expect(code).toBe(0);
    expect(out.data).toMatch(/0x[0-9a-fA-F]{40}/);
    expect(out.data).toMatch(/net2029:/);
    expect(out.data).not.toMatch(/pk\s*:/);
  });

  it('derive --json emits parseable JSON without private keys by default', async () => {
    const out = new StringStream();
    const err = new StringStream();
    const code = await run(['derive', '--mnemonic', TEST_MNEMONIC, '--json', '--count', '1'], {
      stdout: out,
      stderr: err,
    });
    expect(code).toBe(0);
    const parsed = JSON.parse(out.data);
    expect(parsed.accounts).toHaveLength(1);
    expect(parsed.accounts[0].privateKey).toBeUndefined();
    expect(parsed.accounts[0].evmAddress).toMatch(/^0x/);
  });

  it('derive --show-private-keys exposes private material', async () => {
    const out = new StringStream();
    const err = new StringStream();
    const code = await run(
      ['derive', '--mnemonic', TEST_MNEMONIC, '--json', '--count', '1', '--show-private-keys'],
      { stdout: out, stderr: err },
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(out.data);
    expect(parsed.accounts[0].privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('generate prints a mnemonic', async () => {
    const out = new StringStream();
    const err = new StringStream();
    const code = await run(['generate'], { stdout: out, stderr: err });
    expect(code).toBe(0);
    expect(out.data.trim().split(' ')).toHaveLength(12);
  });
});
