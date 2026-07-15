import type { ChainFamily, Network } from '@cfxdevkit/cdk/chains';
import { getChain, listChains } from '@cfxdevkit/cdk/chains';
import { getBool, getString } from '../args.js';

const HELP = `cfx chain — Core chain catalog and resolution utilities

Usage:
  cfx chain list [--family <core|espace>] [--network <mainnet|testnet|devnet|local>] [--json]
  cfx chain show <id|name> [--json]
  cfx chain resolve <alias|id|name> [--json]

Examples:
  cfx chain list
  cfx chain list --family core
  cfx chain show 71
  cfx chain resolve conflux-espace-testnet
`;

const aliases: Readonly<Record<string, string>> = {
  'conflux-espace-mainnet': 'espace-mainnet',
  'conflux-espace-testnet': 'espace-testnet',
  'conflux-espace-local': 'espace-local',
  'conflux-core-mainnet': 'core-mainnet',
  'conflux-core-testnet': 'core-testnet',
  'conflux-core-local': 'core-local',
};

export function chainFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const subcommand = flags._ ?? '';
  if (subcommand === 'help' || subcommand === '') {
    stdout.write(HELP);
    return Promise.resolve(1);
  }

  if (subcommand === 'list') return chainListFromFlags(flags, stdout);
  if (subcommand === 'show') return chainShowFromFlags(flags, stdout);
  if (subcommand === 'resolve') return chainResolveFromFlags(flags, stdout);

  stdout.write(`cfx chain: unknown subcommand "${subcommand}"\n\n${HELP}`);
  return Promise.resolve(2);
}

async function chainListFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const json = getBool(flags, 'json');
  const family = parseChainFamily(getString(flags, 'family'));
  const network = parseNetwork(getString(flags, 'network'));

  void json; // Used in conditional below
  if (flags.family && !family) {
    stdout.write(`Invalid --family value: ${getString(flags, 'family')}\n`);
    return 1;
  }
  if (flags.network && !network) {
    stdout.write(`Invalid --network value: ${getString(flags, 'network')}\n`);
    return 1;
  }

  const chains = listChains({
    ...(family ? { family } : {}),
    ...(network ? { network } : {}),
  });

  if (json) {
    stdout.write(JSON.stringify(chains, null, 2) + '\n');
  } else {
    for (const chain of chains) {
      stdout.write(
        `${chain.name.padEnd(14)} ${chain.family.padEnd(6)} ${chain.network.padEnd(7)} id=${chain.id}\n`,
      );
    }
  }
  return 0;
}

async function chainShowFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const target = getString(flags, '_');
  if (!target) {
    stdout.write('Usage: cfx chain show <id|name> [--json]\n');
    return 1;
  }
  const chain = getChain(parseChainTarget(target));
  if (getBool(flags, 'json')) {
    stdout.write(JSON.stringify(chain, null, 2) + '\n');
  } else {
    stdout.write(`${chain.name} (id=${chain.id}, family=${chain.family})\n`);
  }
  return 0;
}

async function chainResolveFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const target = getString(flags, '_');
  if (!target) {
    stdout.write('Usage: cfx chain resolve <alias|id|name> [--json]\n');
    return 1;
  }
  const json = getBool(flags, 'json');
  const resolved = resolveAlias(target);
  const chain = getChain(parseChainTarget(resolved));
  if (json) {
    stdout.write(JSON.stringify(chain, null, 2) + '\n');
  } else {
    stdout.write(`${target} -> ${chain.name} (id=${chain.id}, family=${chain.family})\n`);
  }
  return 0;
}

function resolveAlias(value: string): string {
  return aliases[value] ?? value;
}

function parseChainTarget(value: string): number | string {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0 && `${parsed}` === value) {
    return parsed;
  }
  return value;
}

function parseChainFamily(value: string | undefined): ChainFamily | undefined {
  return value && (value === 'core' || value === 'espace') ? value : undefined;
}

function parseNetwork(value: string | undefined): Network | undefined {
  if (!value) return undefined;
  if (value === 'mainnet' || value === 'testnet' || value === 'devnet' || value === 'local')
    return value as Network;
  return undefined;
}
