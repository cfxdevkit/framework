import {
  formatCFX,
  formatDrip,
  formatGDrip,
  parseCFX,
  parseDrip,
  parseGDrip,
} from '@cfxdevkit/cdk/units';
import type { ToolingNamespaceDefinition } from '../contracts.js';

const commands = [
  {
    name: 'parse',
    description: 'Parse decimal value into drip-scaled integer',
    usage: 'parse --unit <cfx|drip|gdrip> <value> [--json]',
  },
  {
    name: 'format',
    description: 'Format a drip-scaled integer into display units',
    usage: 'format --unit <cfx|drip|gdrip> <value> [--json]',
  },
] as const;

const helpText = `Usage: cdk units <command> [args]
       pnpm cdk -- units <command> [args]

Commands:
  parse --unit <cfx|drip|gdrip> <value> [--json]
  format --unit <cfx|drip|gdrip> <value> [--json]

Examples:
  cdk units parse --unit cfx 1.25
  cdk units format --unit gdrip 42000000000
`;

export const unitsToolingNamespace: ToolingNamespaceDefinition = {
  name: 'units',
  description: 'Core token/drip unit conversion helpers',
  commands,
  async run(rawArgs) {
    const args = [...rawArgs];
    while (args[0] === '--') args.shift();
    const [command = 'help', ...rest] = args;

    if (isHelpToken(command)) {
      console.log(helpText);
      return;
    }

    if (command === 'parse') {
      const unit = getFlagValue(rest, '--unit');
      const value = getPositionalValue(rest);
      const json = rest.includes('--json');
      if (!unit || value === undefined) {
        console.error('Usage: cdk units parse --unit <cfx|drip|gdrip> <value> [--json]');
        process.exitCode = 1;
        return;
      }
      try {
        const parsed = parseWithUnit(unit, value);
        if (json) {
          console.log(JSON.stringify({ unit, input: value, output: parsed.toString() }, null, 2));
        } else {
          console.log(parsed.toString());
        }
      } catch (error) {
        console.error(toErrorMessage(error));
        process.exitCode = 1;
      }
      return;
    }

    if (command === 'format') {
      const unit = getFlagValue(rest, '--unit');
      const value = getPositionalValue(rest);
      const json = rest.includes('--json');
      if (!unit || value === undefined) {
        console.error('Usage: cdk units format --unit <cfx|drip|gdrip> <value> [--json]');
        process.exitCode = 1;
        return;
      }
      try {
        const parsed = parseIntegerBigInt(value);
        const formatted = formatWithUnit(unit, parsed);
        if (json) {
          console.log(
            JSON.stringify({ unit, input: parsed.toString(), output: formatted }, null, 2),
          );
        } else {
          console.log(formatted);
        }
      } catch (error) {
        console.error(toErrorMessage(error));
        process.exitCode = 1;
      }
      return;
    }

    console.error(`Unknown units command: ${command}`);
    console.log(helpText);
    process.exitCode = 1;
  },
};

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

function getPositionalValue(args: readonly string[]): string | undefined {
  return args.find((arg, index) => {
    const previous = args[index - 1];
    return arg !== '--unit' && arg !== '--json' && previous !== '--unit';
  });
}

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  return args[index + 1];
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}
