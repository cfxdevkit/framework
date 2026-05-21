import {
  type CoreNetworkId,
  type DualAddressAccount,
  deriveDualAccounts,
  generateMnemonic,
  validateMnemonic,
} from '@cfxdevkit/cdk';
import { getBool, getNumber, getString } from '../args.js';

export interface DeriveReport {
  mnemonic: string;
  accountType: 'standard' | 'mining';
  coreNetworkId: number;
  accounts: DualAddressAccount[];
}

export interface RunDeriveOptions {
  mnemonic?: string;
  generate?: boolean;
  count?: number;
  startIndex?: number;
  accountType?: 'standard' | 'mining';
  coreNetworkId?: CoreNetworkId;
  passphrase?: string;
  /** Mnemonic strength when --generate is used. Default 128 (12 words). */
  strength?: 128 | 160 | 192 | 224 | 256;
}

export function runDerive(opts: RunDeriveOptions): DeriveReport {
  const mnemonic =
    opts.mnemonic !== undefined
      ? opts.mnemonic.trim()
      : opts.generate
        ? generateMnemonic(opts.strength ?? 128)
        : (() => {
            throw new Error('Either --mnemonic <phrase> or --generate is required');
          })();

  if (!validateMnemonic(mnemonic)) {
    throw new Error('Mnemonic failed BIP-39 validation');
  }

  const accountType = opts.accountType ?? 'standard';
  const coreNetworkId = opts.coreNetworkId ?? 1029;
  const baseInput: Parameters<typeof deriveDualAccounts>[0] = {
    mnemonic,
    count: opts.count ?? 1,
    startIndex: opts.startIndex ?? 0,
    accountType,
    coreNetworkId,
  };
  if (opts.passphrase !== undefined) baseInput.passphrase = opts.passphrase;

  const accounts = deriveDualAccounts(baseInput);
  return { mnemonic, accountType, coreNetworkId, accounts };
}

export function deriveFromFlags(
  flags: Record<string, string | boolean>,
  out: NodeJS.WritableStream,
): number {
  const opts: RunDeriveOptions = {};
  const mnemonic = getString(flags, 'mnemonic');
  if (mnemonic !== undefined) opts.mnemonic = mnemonic;
  if (getBool(flags, 'generate')) opts.generate = true;
  const count = getNumber(flags, 'count');
  if (count !== undefined) opts.count = count;
  const start = getNumber(flags, 'start');
  if (start !== undefined) opts.startIndex = start;
  const type = getString(flags, 'type');
  if (type === 'standard' || type === 'mining') opts.accountType = type;
  const coreId = getNumber(flags, 'core-network-id');
  if (coreId !== undefined) opts.coreNetworkId = coreId;
  const passphrase = getString(flags, 'passphrase');
  if (passphrase !== undefined) opts.passphrase = passphrase;
  const strength = getNumber(flags, 'strength');
  if (
    strength === 128 ||
    strength === 160 ||
    strength === 192 ||
    strength === 224 ||
    strength === 256
  ) {
    opts.strength = strength;
  }

  const report = runDerive(opts);
  const exposeKeys = getBool(flags, 'show-private-keys');

  if (getBool(flags, 'json')) {
    const safe = exposeKeys
      ? report
      : {
          ...report,
          accounts: report.accounts.map(({ privateKey: _pk, ...rest }) => rest),
        };
    out.write(`${JSON.stringify(safe, null, 2)}\n`);
    return 0;
  }

  if (opts.generate || getBool(flags, 'show-mnemonic')) {
    out.write(`mnemonic: ${report.mnemonic}\n`);
  }
  out.write(`accountType: ${report.accountType}   coreNetworkId: ${report.coreNetworkId}\n`);
  for (const a of report.accounts) {
    out.write(`\n  [${a.index}]\n`);
    out.write(`    evm  : ${a.evmAddress}    (path ${a.paths.evm})\n`);
    out.write(`    core : ${a.coreAddress}    (path ${a.paths.core})\n`);
    if (exposeKeys) {
      out.write(`    pk   : ${a.privateKey}\n`);
    }
  }
  out.write('\n');
  return 0;
}
