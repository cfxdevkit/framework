import {
  ensureSignerJsonGitignored,
  readSignerConfig,
  type SignerConfig,
  type SignerEntry,
  writeSignerConfig,
} from '@cfxdevkit/signer-session';
import { input, select } from '@inquirer/prompts';
import { isHelpToken } from './agent-runtime.js';
import type { ToolingNamespaceDefinition } from './contracts.js';

export const signerToolingNamespace: ToolingNamespaceDefinition = {
  name: 'signer',
  description: 'Configure and manage the active signing identity (.cfxdevkit/signer.json)',
  commands: [
    { name: 'setup', description: 'Interactive wizard to configure a signer', usage: 'setup' },
    {
      name: 'status',
      description: 'Show the active signer and its configuration',
      usage: 'status [--json]',
    },
    { name: 'list', description: 'List all configured signers', usage: 'list [--json]' },
    {
      name: 'set',
      description: 'Set a config value non-interactively',
      usage: 'set <key> <value>',
    },
    { name: 'use', description: 'Switch the default signer', usage: 'use <name>' },
  ],
  run: runSignerCli,
};

async function runSignerCli(args: readonly string[]): Promise<void> {
  const [sub, ...rest] = args;
  if (!sub || isHelpToken(sub)) {
    printSignerHelp();
    return;
  }

  switch (sub) {
    case 'setup':
      return runSignerSetup();
    case 'status':
      return runSignerStatus(rest.includes('--json'));
    case 'list':
      return runSignerList(rest.includes('--json'));
    case 'set':
      return runSignerSet(rest);
    case 'use':
      return runSignerUse(rest[0]);
    default:
      process.stderr.write(`Unknown signer command: '${sub}'\n`);
      printSignerHelp();
      process.exitCode = 1;
  }
}

// ─── setup ────────────────────────────────────────────────────────────────────

async function runSignerSetup(): Promise<void> {
  process.stdout.write('\nConfigure your signing identity for this workspace.\n\n');

  const kind = await select({
    message: 'Choose a signer backend:',
    choices: [
      {
        name: 'Memory wallet  (ephemeral — fresh key each session, for quick testing)',
        value: 'memory',
      },
      {
        name: 'File keystore  (encrypted mnemonic on disk, recommended for dev)',
        value: 'file-keystore',
      },
      { name: 'OneKey Classic S1  (hardware wallet, WebUSB)', value: 'onekey' },
      { name: 'Ledger  (hardware wallet, WebHID / NodeHID)', value: 'ledger' },
    ],
  });

  const signerName = await input({
    message: 'Signer name (label for this entry):',
    default: kind === 'memory' ? 'quick' : kind === 'file-keystore' ? 'dev-wallet' : 'hardware',
  });

  let entry: SignerEntry;

  if (kind === 'file-keystore') {
    const path = await input({
      message: 'Keystore file path:',
      default: '.cfxdevkit/keystore.json',
    });
    const service = await input({ message: 'Service namespace:', default: 'cfxdevkit' });
    const account = await input({ message: 'Account name:', default: 'default' });
    const indexStr = await input({ message: 'Account index (HD derivation):', default: '0' });
    entry = {
      kind: 'file-keystore',
      path,
      service,
      account,
      accountIndex: Number(indexStr) || 0,
    };
  } else if (kind === 'onekey') {
    process.stdout.write(
      '\n  OneKey: connectId and deviceId are resolved at runtime when you plug in the device.\n',
    );
    const indexStr = await input({ message: 'Account index:', default: '0' });
    const idx = Number(indexStr) || 0;
    entry = {
      kind: 'onekey',
      espacePath: `m/44'/60'/0'/0/${idx}`,
      corePath: `m/44'/503'/0'/0/${idx}`,
    };
  } else if (kind === 'ledger') {
    const indexStr = await input({ message: 'Account index:', default: '0' });
    const idx = Number(indexStr) || 0;
    entry = { kind: 'ledger', espaceChainId: 1030 + idx - idx }; // keep index for future use
  } else {
    entry = { kind: 'memory' };
  }

  // Read existing config and merge
  const existing = await readSignerConfig();
  const updated: SignerConfig = {
    defaultSigner: signerName,
    signers: { ...existing.signers, [signerName]: entry },
  };

  await writeSignerConfig(updated);
  const gitignored = await ensureSignerJsonGitignored();
  process.stdout.write(`\n✓ Signer '${signerName}' configured (${kind})\n`);
  process.stdout.write(`  Written to: .cfxdevkit/signer.json\n`);
  if (gitignored) process.stdout.write(`  Added .cfxdevkit/signer.json to .gitignore\n`);

  if (kind === 'memory') {
    process.stdout.write(
      '\n  ⚠ Memory signer is ephemeral — a fresh key is generated each session.\n',
    );
    process.stdout.write('  Use `cdk sign message "Hello"` to test it.\n');
  } else if (kind === 'file-keystore') {
    process.stdout.write('\n  Set CFX_PASSPHRASE to use without prompts:\n');
    process.stdout.write('    export CFX_PASSPHRASE=<your-passphrase>\n');
    process.stdout.write('  Then: cdk sign message "Hello"\n');
  } else {
    process.stdout.write('\n  Connect your device and run: cdk sign message "Hello" to test.\n');
  }
}

// ─── status ───────────────────────────────────────────────────────────────────

async function runSignerStatus(json: boolean): Promise<void> {
  const config = await readSignerConfig();
  const name = process.env.CFX_SIGNER_NAME ?? config.defaultSigner;
  const entry = config.signers[name];

  if (!entry) {
    process.stderr.write(`No signer '${name}' in config. Run 'cdk signer list' to see options.\n`);
    process.exitCode = 1;
    return;
  }

  let address: string | null = null;
  if (entry.kind === 'file-keystore' && process.env.CFX_PASSPHRASE) {
    try {
      const { createSignerSession } = await import('@cfxdevkit/signer-session');
      const session = await createSignerSession({ ...entry, kind: 'file-keystore' });
      address = session.eSpace.account.address;
      await session.dispose();
    } catch {
      /* passphrase may be wrong; skip address */
    }
  }

  const out = {
    activeSigner: name,
    kind: entry.kind,
    config: { ...entry, kind: undefined },
    ...(address ? { espaceAddress: address } : {}),
    configFile: '.cfxdevkit/signer.json',
  };

  if (json) {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
  } else {
    process.stdout.write(`Active signer : ${name} (${entry.kind})\n`);
    if (entry.kind === 'file-keystore') {
      process.stdout.write(`  Path        : ${entry.path ?? '(env: CFX_KEYSTORE_PATH)'}\n`);
      process.stdout.write(
        `  Account     : ${entry.service ?? 'cfxdevkit'}/${entry.account ?? 'default'}[${entry.accountIndex ?? 0}]\n`,
      );
    } else if (entry.kind === 'onekey') {
      process.stdout.write(`  eSpace path : ${entry.espacePath ?? "m/44'/60'/0'/0/0"}\n`);
      process.stdout.write(`  Core path   : ${entry.corePath ?? "m/44'/503'/0'/0/0"}\n`);
    } else if (entry.kind === 'memory') {
      process.stdout.write(`  ⚠ ephemeral — fresh key each session\n`);
    }
    if (address) process.stdout.write(`  eSpace addr : ${address}\n`);
    process.stdout.write(`  Config file : .cfxdevkit/signer.json\n`);
  }
}

// ─── list ─────────────────────────────────────────────────────────────────────

async function runSignerList(json: boolean): Promise<void> {
  const config = await readSignerConfig();
  if (json) {
    process.stdout.write(`${JSON.stringify(config, null, 2)}\n`);
    return;
  }
  process.stdout.write(`Configured signers (default: ${config.defaultSigner}):\n\n`);
  for (const [name, entry] of Object.entries(config.signers)) {
    const active = name === config.defaultSigner ? ' ← default' : '';
    process.stdout.write(`  ${name} (${entry.kind})${active}\n`);
  }
}

// ─── set ──────────────────────────────────────────────────────────────────────

async function runSignerSet(args: readonly string[]): Promise<void> {
  const [key, ...valueParts] = args;
  const value = valueParts.join(' ');
  if (!key || !value) {
    process.stderr.write(
      'Usage: cdk signer set <key> <value>\nExample: cdk signer set defaultSigner dev-wallet\n',
    );
    process.exitCode = 1;
    return;
  }
  const config = await readSignerConfig();
  if (key === 'defaultSigner') {
    if (!config.signers[value]) {
      process.stderr.write(`Signer '${value}' not found. Run 'cdk signer list' to see options.\n`);
      process.exitCode = 1;
      return;
    }
    await writeSignerConfig({ ...config, defaultSigner: value });
    process.stdout.write(`✓ defaultSigner → ${value}\n`);
  } else {
    process.stderr.write(`Unknown config key: '${key}'. Supported: defaultSigner\n`);
    process.exitCode = 1;
  }
}

// ─── use ──────────────────────────────────────────────────────────────────────

async function runSignerUse(name: string | undefined): Promise<void> {
  if (!name) {
    process.stderr.write('Usage: cdk signer use <name>\n');
    process.exitCode = 1;
    return;
  }
  await runSignerSet(['defaultSigner', name]);
}

// ─── help ─────────────────────────────────────────────────────────────────────

function printSignerHelp(): void {
  process.stdout.write(`cdk signer — manage signing identity (.cfxdevkit/signer.json)

Commands:
  cdk signer setup          Interactive wizard to configure a signer
  cdk signer status         Show the active signer and config
  cdk signer list           List all configured signers
  cdk signer set <k> <v>    Non-interactive config mutation (key: defaultSigner)
  cdk signer use <name>     Switch the default signer

Signer kinds:
  memory        Ephemeral — fresh key each session (⚠ for testing only)
  file-keystore Encrypted mnemonic file (recommended for dev)
  onekey        OneKey Classic S1 hardware wallet
  ledger        Ledger hardware wallet

Env vars:
  CFX_SIGNER_NAME   Override the active signer name
  CFX_PASSPHRASE    Passphrase for file-keystore (avoids prompt)
`);
}
