import { describe, expect, it } from 'vitest';

// Mirror the rule list and scan logic to keep tests self-contained.
type SecretRule = { name: string; pattern: RegExp; message: string };

const rules: SecretRule[] = [
  {
    name: 'no-vscode-state-secret-persistence',
    pattern:
      /workspaceState\.update\([^\n]*(STATE_.*(MNEMONIC|PRIVATE_KEY|PASSPHRASE|SECRET)|\b(mnemonic|privateKey|passphrase|secret)\b)/,
    message: 'Do not persist mnemonic/private-key/passphrase material in VS Code workspaceState.',
  },
  {
    name: 'no-secret-output-channel',
    pattern:
      /appendLine\([^\n]*(\$\{[^}]*\b(mnemonic|privateKey|passphrase|secret)\b|\b(mnemonic|privateKey|passphrase|secret)\b\s*[),.])/,
    message: 'Do not write mnemonic/private-key/passphrase material to output channels.',
  },
  {
    name: 'no-secret-console-output',
    pattern:
      /console\.(log|info|warn|error)\([^\n]*(\$\{[^}]*\b(mnemonic|privateKey|passphrase|secret)\b|\b(mnemonic|privateKey|passphrase|secret)\b\s*[),.])/,
    message: 'Do not write mnemonic/private-key/passphrase material to console output.',
  },
  {
    name: 'no-recovery-mnemonic-output-label',
    pattern: /appendLine\([^\n]*Recovery mnemonic/i,
    message: 'Do not expose recovery mnemonic labels in runtime output.',
  },
  {
    name: 'no-hardcoded-api-key',
    pattern: /\b(apiKey|api_key|API_KEY)\s*[=:]\s*['"][^'"]{8,}['"]/,
    message: 'Do not hardcode API keys in source files. Use environment variables instead.',
  },
  {
    name: 'no-hardcoded-private-key',
    pattern: /\b(privateKey|private_key|PRIVATE_KEY)\s*[=:]\s*['"]0x[0-9a-fA-F]{64}['"]/,
    message:
      'Do not hardcode private keys in source files. Use a keystore or environment variable.',
  },
  {
    name: 'no-hardcoded-jwt',
    pattern: /['"]eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}['"]/,
    message: 'Do not hardcode JWT tokens in source files.',
  },
];

function matchedRules(line: string): string[] {
  return rules.filter((r) => r.pattern.test(line)).map((r) => r.name);
}

describe('secret rules — VS Code patterns', () => {
  it('flags mnemonic persisted in workspaceState', () => {
    expect(matchedRules(`ctx.workspaceState.update('key', mnemonic)`)).toContain(
      'no-vscode-state-secret-persistence',
    );
  });

  it('flags secret written to output channel', () => {
    expect(matchedRules(`channel.appendLine(mnemonic)`)).toContain('no-secret-output-channel');
  });

  it('flags secret written to console', () => {
    expect(matchedRules(`console.log(secret)`)).toContain('no-secret-console-output');
  });

  it('flags recovery mnemonic label', () => {
    expect(matchedRules(`channel.appendLine('Recovery mnemonic: ' + phrase)`)).toContain(
      'no-recovery-mnemonic-output-label',
    );
  });
});

describe('secret rules — generic patterns', () => {
  it('flags hardcoded apiKey assignment', () => {
    expect(matchedRules(`const apiKey = 'sk-abcdefghij1234';`)).toContain('no-hardcoded-api-key');
    expect(matchedRules(`{ api_key: 'longapikey12345' }`)).toContain('no-hardcoded-api-key');
  });

  it('does not flag apiKey from environment variable', () => {
    expect(matchedRules(`const apiKey = process.env.OPENAI_API_KEY ?? '';`)).not.toContain(
      'no-hardcoded-api-key',
    );
  });

  it('flags hardcoded private key (0x hex)', () => {
    const key = `0x${'a'.repeat(64)}`;
    expect(matchedRules(`const privateKey = '${key}';`)).toContain('no-hardcoded-private-key');
  });

  it('does not flag private key variable without hex literal', () => {
    expect(matchedRules(`const privateKey = await keystore.get();`)).not.toContain(
      'no-hardcoded-private-key',
    );
  });

  it('flags JWT-shaped string literal', () => {
    // A minimal 3-segment base64url string starting with eyJ ({"...} encoded)
    const jwt =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    expect(matchedRules(`const token = '${jwt}';`)).toContain('no-hardcoded-jwt');
  });

  it('does not flag a short eyJ string (too short to be a JWT)', () => {
    expect(matchedRules(`const x = 'eyJhbG.eyJzd.short';`)).not.toContain('no-hardcoded-jwt');
  });
});
