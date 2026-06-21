import type { ChainFamily, Network } from '@cfxdevkit/cdk/chains';
import { getChain, listChains } from '@cfxdevkit/cdk/chains';
import type { ToolingNamespaceDefinition } from '../contracts.js';

const commands = [
  {
    name: 'list',
    description: 'List known chain configurations',
    usage: 'list [--family <core|espace>] [--network <mainnet|testnet|devnet|local>] [--json]',
  },
  {
    name: 'show',
    description: 'Show a chain config by id or name',
    usage: 'show <id|name> [--json]',
  },
  {
    name: 'resolve',
    description: 'Resolve common aliases to a chain config',
    usage: 'resolve <alias|id|name> [--json]',
  },
] as const;

const helpText = `Usage: cdk chain <command> [args]
       pnpm cdk -- chain <command> [args]

Commands:
  list [--family <core|espace>] [--network <mainnet|testnet|devnet|local>] [--json]
  show <id|name> [--json]
  resolve <alias|id|name> [--json]

Examples:
  cdk chain list
  cdk chain list --family core
  cdk chain show 71
  cdk chain resolve conflux-espace-testnet
`;

const aliases: Readonly<Record<string, string>> = {
  'conflux-espace-mainnet': 'espace-mainnet',
  'conflux-espace-testnet': 'espace-testnet',
  'conflux-espace-local': 'espace-local',
  'conflux-core-mainnet': 'core-mainnet',
  'conflux-core-testnet': 'core-testnet',
  'conflux-core-local': 'core-local',
};

export const chainToolingNamespace: ToolingNamespaceDefinition = {
  name: 'chain',
  description: 'Core chain catalog and resolution utilities',
  commands,
  async run(rawArgs) {
    const args = [...rawArgs];
    while (args[0] === '--') args.shift();
    const [command = 'help', ...rest] = args;

    if (isHelpToken(command)) {
      console.log(helpText);
      return;
    }

    if (command === 'list') {
      const json = rest.includes('--json');
      const familyRaw = getFlagValue(rest, '--family');
      const networkRaw = getFlagValue(rest, '--network');
      const family = parseChainFamily(familyRaw);
      if (familyRaw && !family) {
        console.error(`Invalid --family value: ${familyRaw}`);
        process.exitCode = 1;
        return;
      }
      const network = parseNetwork(networkRaw);
      if (networkRaw && !network) {
        console.error(`Invalid --network value: ${networkRaw}`);
        process.exitCode = 1;
        return;
      }

      const chains = listChains({
        ...(family ? { family } : {}),
        ...(network ? { network } : {}),
      });
      if (json) {
        console.log(JSON.stringify(chains, null, 2));
      } else {
        for (const chain of chains) {
          console.log(
            `${chain.name.padEnd(14)} ${chain.family.padEnd(6)} ${chain.network.padEnd(7)} id=${chain.id}`,
          );
        }
      }
      return;
    }

    if (command === 'show') {
      const [target, ...flags] = rest;
      if (!target) {
        console.error('Usage: cdk chain show <id|name> [--json]');
        process.exitCode = 1;
        return;
      }
      const json = flags.includes('--json');
      const chain = getChain(parseChainTarget(target));
      if (json) {
        console.log(JSON.stringify(chain, null, 2));
      } else {
        console.log(JSON.stringify(chain, null, 2));
      }
      return;
    }

    if (command === 'resolve') {
      const [target, ...flags] = rest;
      if (!target) {
        console.error('Usage: cdk chain resolve <alias|id|name> [--json]');
        process.exitCode = 1;
        return;
      }
      const json = flags.includes('--json');
      const resolved = resolveAlias(target);
      const chain = getChain(parseChainTarget(resolved));
      if (json) {
        console.log(JSON.stringify(chain, null, 2));
      } else {
        console.log(`${target} -> ${chain.name} (id=${chain.id}, family=${chain.family})`);
      }
      return;
    }

    console.error(`Unknown chain command: ${command}`);
    console.log(helpText);
    process.exitCode = 1;
  },
};

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

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  return args[index + 1];
}

function isChainFamily(value: string): value is ChainFamily {
  return value === 'core' || value === 'espace';
}

function isNetwork(value: string): value is Network {
  return value === 'mainnet' || value === 'testnet' || value === 'devnet' || value === 'local';
}

function parseChainFamily(value: string | undefined): ChainFamily | undefined {
  return value && isChainFamily(value) ? value : undefined;
}

function parseNetwork(value: string | undefined): Network | undefined {
  return value && isNetwork(value) ? value : undefined;
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}
