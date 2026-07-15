import { base32ToHex, getCoreAddress, hexToBase32, isBase32Address } from '@cfxdevkit/cdk/address';
import { getBool, getString } from '../args.js';

const HELP = `cfx address — Core address validation and conversion helpers

Usage:
  cfx address validate <address> [--json]
  cfx address convert --to <hex|base32> <address> [--network-id <id>] [--json]
  cfx address normalize <address> [--json]

Examples:
  cfx address validate cfx:aam2rra2...
  cfx address convert --to hex cfx:aam2rra2...
  cfx address convert --to base32 --network-id 1029 0x0123456789012345678901234567890123456789
`;

export function addressFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const subcommand = flags._ ?? '';
  if (subcommand === 'help' || subcommand === '') {
    stdout.write(HELP);
    return Promise.resolve(1);
  }

  if (subcommand === 'validate') return addressValidateFromFlags(flags, stdout);
  if (subcommand === 'convert') return addressConvertFromFlags(flags, stdout);
  if (subcommand === 'normalize') return addressNormalizeFromFlags(flags, stdout);

  stdout.write(`cfx address: unknown subcommand "${subcommand}"\n\n${HELP}`);
  return Promise.resolve(2);
}

async function addressValidateFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const input = flags._1 as string;
  if (!input) {
    stdout.write('Usage: cfx address validate <address> [--json]\n');
    return 1;
  }
  const json = getBool(flags, 'json');
  const isHex = isHexAddress(input);
  const isBase32 = isBase32Address(input);
  const result = {
    input,
    valid: isHex || isBase32,
    encoding: isHex ? 'hex' : isBase32 ? 'base32' : 'unknown',
  } as const;
  if (json) {
    stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    stdout.write(`${result.valid ? 'valid' : 'invalid'} ${result.encoding} address\n`);
  }
  return result.valid ? 0 : 1;
}

async function addressConvertFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const targetEncoding = getString(flags, 'to');
  const address = flags._1 as string;
  const json = getBool(flags, 'json');

  if (!targetEncoding || !address) {
    stdout.write(
      'Usage: cfx address convert --to <hex|base32> <address> [--network-id <id>] [--json]\n',
    );
    return 1;
  }

  try {
    const networkId = parseNetworkId(getString(flags, 'network-id'));
    const converted =
      targetEncoding === 'hex'
        ? base32ToHex(address)
        : targetEncoding === 'base32'
          ? hexToBase32(address as `0x${string}`, networkId)
          : null;
    if (!converted) {
      stdout.write(`Invalid --to value: ${targetEncoding}\n`);
      return 1;
    }
    if (json) {
      stdout.write(
        JSON.stringify({ input: address, to: targetEncoding, output: converted }, null, 2) + '\n',
      );
    } else {
      stdout.write(converted + '\n');
    }
    return 0;
  } catch (error) {
    stdout.write(`cfx address: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

async function addressNormalizeFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const input = flags._1 as string;
  if (!input) {
    stdout.write('Usage: cfx address normalize <address> [--json]\n');
    return 1;
  }
  const json = getBool(flags, 'json');
  try {
    const normalized = getCoreAddress(input);
    if (json) {
      stdout.write(JSON.stringify({ input, normalized }, null, 2) + '\n');
    } else {
      stdout.write(normalized + '\n');
    }
    return 0;
  } catch (error) {
    stdout.write(`cfx address: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function parseNetworkId(value: string | undefined): number {
  if (!value) return 1029;
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  throw new Error(`Invalid --network-id value: ${value}`);
}

function isHexAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}
