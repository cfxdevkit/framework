/**
 * Units commands for cfx CLI.
 *
 * Moved from @cfxdevkit/tooling-cli to @cfxdevkit/cli as part of domain separation.
 */

import {
  formatCFX,
  formatDrip,
  formatGDrip,
  parseCFX,
  parseDrip,
  parseGDrip,
} from '@cfxdevkit/cdk/units';
import { getBool, getString } from '../args.js';

const HELP = `cfx units — Core token/drip unit conversion helpers

Usage:
  cfx units parse --unit <cfx|drip|gdrip> <value> [--json]
  cfx units format --unit <cfx|drip|gdrip> <value> [--json]

Examples:
  cfx units parse --unit cfx 1.25
  cfx units format --unit gdrip 42000000000
`;

export function unitsFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const subcommand = flags._ ?? '';
  if (subcommand === 'help' || subcommand === '') {
    stdout.write(HELP);
    return Promise.resolve(1);
  }

  if (subcommand === 'parse') return unitsParseFromFlags(flags, stdout);
  if (subcommand === 'format') return unitsFormatFromFlags(flags, stdout);

  stdout.write(`cfx units: unknown subcommand "${subcommand}"\n\n${HELP}`);
  return Promise.resolve(2);
}

async function unitsParseFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const unit = getString(flags, 'unit');
  const value = flags._1 as string;
  const json = getBool(flags, 'json');
  if (!unit || value === undefined) {
    stdout.write('Usage: cfx units parse --unit <cfx|drip|gdrip> <value> [--json]\n');
    return 1;
  }
  try {
    const parsed = parseWithUnit(unit, value);
    if (json) {
      stdout.write(
        JSON.stringify({ unit, input: value, output: parsed.toString() }, null, 2) + '\n',
      );
    } else {
      stdout.write(parsed.toString() + '\n');
    }
    return 0;
  } catch (error) {
    stdout.write(`cfx units: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

async function unitsFormatFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const unit = getString(flags, 'unit');
  const value = flags._1 as string;
  const json = getBool(flags, 'json');
  if (!unit || value === undefined) {
    stdout.write('Usage: cfx units format --unit <cfx|drip|gdrip> <value> [--json]\n');
    return 1;
  }
  try {
    const parsed = parseIntegerBigInt(value);
    const formatted = formatWithUnit(unit, parsed);
    if (json) {
      stdout.write(
        JSON.stringify({ unit, input: parsed.toString(), output: formatted }, null, 2) + '\n',
      );
    } else {
      stdout.write(formatted + '\n');
    }
    return 0;
  } catch (error) {
    stdout.write(`cfx units: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function parseWithUnit(unit: string, value: string): bigint {
  switch (unit) {
    case 'cfx':
      return parseCFX(value);
    case 'drip':
      return parseDrip(value);
    case 'gdrip':
      return parseGDrip(value);
    default:
      throw new Error(`Invalid --unit value: ${unit}`);
  }
}

function formatWithUnit(unit: string, value: bigint): string {
  switch (unit) {
    case 'cfx':
      return formatCFX(value);
    case 'drip':
      return formatDrip(value);
    case 'gdrip':
      return formatGDrip(value);
    default:
      throw new Error(`Invalid --unit value: ${unit}`);
  }
}

function parseIntegerBigInt(value: string): bigint {
  const trimmed = value.trim();
  const normalized = trimmed.endsWith('n') ? trimmed.slice(0, -1) : trimmed;
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`Expected integer bigint value, got: ${value}`);
  }
  return BigInt(normalized);
}
