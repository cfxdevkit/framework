import { base32ToHex, getCoreAddress, hexToBase32, isBase32Address } from '@cfxdevkit/cdk/address';
import type { ToolingNamespaceDefinition } from '../contracts.js';

const commands = [
  {
    name: 'validate',
    description: 'Validate and classify an address',
    usage: 'validate <address> [--json]',
  },
  {
    name: 'convert',
    description: 'Convert address encoding between hex and core base32',
    usage: 'convert --to <hex|base32> <address> [--network-id <id>] [--json]',
  },
  {
    name: 'normalize',
    description: 'Normalize a core-space base32 address',
    usage: 'normalize <address> [--json]',
  },
] as const;

const helpText = `Usage: cdk address <command> [args]
       pnpm cdk -- address <command> [args]

Commands:
  validate <address> [--json]
  convert --to <hex|base32> <address> [--network-id <id>] [--json]
  normalize <address> [--json]

Examples:
  cdk address validate cfx:aam2rra2...
  cdk address convert --to hex cfx:aam2rra2...
  cdk address convert --to base32 --network-id 1029 0x0123456789012345678901234567890123456789
`;

export const addressToolingNamespace: ToolingNamespaceDefinition = {
  name: 'address',
  description: 'Core address validation and conversion helpers',
  commands,
  async run(rawArgs) {
    const args = [...rawArgs];
    while (args[0] === '--') args.shift();
    const [command = 'help', ...rest] = args;

    if (isHelpToken(command)) {
      console.log(helpText);
      return;
    }

    if (command === 'validate') {
      const [input, ...flags] = rest;
      if (!input) {
        console.error('Usage: cdk address validate <address> [--json]');
        process.exitCode = 1;
        return;
      }
      const json = flags.includes('--json');
      const isHex = isHexAddress(input);
      const isBase32 = isBase32Address(input);
      const result = {
        input,
        valid: isHex || isBase32,
        encoding: isHex ? 'hex' : isBase32 ? 'base32' : 'unknown',
      } as const;
      if (json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`${result.valid ? 'valid' : 'invalid'} ${result.encoding} address`);
      }
      if (!result.valid) {
        process.exitCode = 1;
      }
      return;
    }

    if (command === 'convert') {
      const targetEncoding = getFlagValue(rest, '--to');
      const networkIdFlag = getFlagValue(rest, '--network-id');
      const json = rest.includes('--json');
      const positional = rest.filter((arg, index) => {
        const previous = rest[index - 1];
        return (
          arg !== '--to' &&
          arg !== '--network-id' &&
          arg !== '--json' &&
          previous !== '--to' &&
          previous !== '--network-id'
        );
      });
      const input = positional[0];

      if (!targetEncoding || !input) {
        console.error('Usage: cdk address convert --to <hex|base32> <address> [--network-id <id>]');
        process.exitCode = 1;
        return;
      }

      try {
        const converted =
          targetEncoding === 'hex'
            ? base32ToHex(input)
            : targetEncoding === 'base32'
              ? hexToBase32(input as `0x${string}`, parseNetworkId(networkIdFlag))
              : null;
        if (!converted) {
          console.error(`Invalid --to value: ${targetEncoding}`);
          process.exitCode = 1;
          return;
        }
        if (json) {
          console.log(JSON.stringify({ input, to: targetEncoding, output: converted }, null, 2));
        } else {
          console.log(converted);
        }
      } catch (error) {
        console.error(toErrorMessage(error));
        process.exitCode = 1;
      }
      return;
    }

    if (command === 'normalize') {
      const [input, ...flags] = rest;
      if (!input) {
        console.error('Usage: cdk address normalize <address> [--json]');
        process.exitCode = 1;
        return;
      }
      const json = flags.includes('--json');
      try {
        const normalized = getCoreAddress(input);
        if (json) {
          console.log(JSON.stringify({ input, normalized }, null, 2));
        } else {
          console.log(normalized);
        }
      } catch (error) {
        console.error(toErrorMessage(error));
        process.exitCode = 1;
      }
      return;
    }

    console.error(`Unknown address command: ${command}`);
    console.log(helpText);
    process.exitCode = 1;
  },
};

function parseNetworkId(value: string | undefined): number {
  if (!value) return 1029;
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  throw new Error(`Invalid --network-id value: ${value}`);
}

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  return args[index + 1];
}

function isHexAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}
