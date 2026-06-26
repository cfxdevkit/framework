#!/usr/bin/env node
/**
 * `@cfxdevkit/cdk` CLI — exposes cdk package functions.
 *
 * Usage:
 *   cdk <subcommand> [args...]
 *
 * Subcommands:
 *   status    — chain status via RPC
 *   derive    — derive account from mnemonic
 *   address   — address utilities (validate, convert, normalize)
 *   units     — unit conversion (parse, format)
 *   chains    — list available chains
 */

import { base32ToHex, getCoreAddress, hexToBase32, isBase32Address } from '@cfxdevkit/cdk/address';
import { coreSpaceMainnet, espaceMainnet, listChains } from '@cfxdevkit/cdk/chains';
import { createClient, http } from '@cfxdevkit/cdk/client';
import type { Wei } from '@cfxdevkit/cdk/types';
import { formatCFX, parseCFX } from '@cfxdevkit/cdk/units';
import { deriveAccount, generateMnemonic, validateMnemonic } from '@cfxdevkit/cdk/wallet';

// ── helpers ──────────────────────────────────────────────────────────────────

function error(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

// ── subcommands ──────────────────────────────────────────────────────────────

async function cmdStatus(args: string[]): Promise<void> {
  const chainArg = args[0];
  const rpcUrl = args[1];

  const chain = chainArg === 'core' ? coreSpaceMainnet : espaceMainnet;
  const transport = rpcUrl ? http({ url: rpcUrl }) : http();
  const client = createClient({ chain, transport });

  // Use type-safe access via the chain family
  const family = chain.family;
  if (family === 'core') {
    const status = await (client as any).getStatus();
    const epoch = await (client as any).getEpochNumber();
    console.log(`Chain: ${chain.name} (${chain.displayName})`);
    console.log(`Epoch: ${epoch}`);
    console.log(`RPC: ${rpcUrl || chain.rpc.http[0]}`);
    console.log(`Node: ${status.clientVersion || 'unknown'}`);
  } else {
    const block = await (client as any).getBlockNumber();
    console.log(`Chain: ${chain.name} (${chain.displayName})`);
    console.log(`Block: ${block}`);
    console.log(`RPC: ${rpcUrl || chain.rpc.http[0]}`);
  }
}

function cmdDerive(args: string[]): void {
  const mnemonic = args[0];
  const count = parseInt(args[1] ?? '1', 10);

  if (!mnemonic) {
    const newMnemonic = generateMnemonic();
    console.log(`Generated mnemonic: ${newMnemonic}`);
    return;
  }

  if (!validateMnemonic(mnemonic)) {
    error('Invalid mnemonic');
  }

  for (let i = 0; i < count; i++) {
    const result = deriveAccount({ mnemonic, path: `m/44'/60'/0'/0/${i}` });
    console.log(`Account ${i}: ${result.account.address}`);
  }
}

function cmdAddress(args: string[]): void {
  const action = args[0];
  const address = args[1];

  if (!address) {
    error('Address required');
  }

  switch (action) {
    case 'validate':
      if (isBase32Address(address)) {
        console.log('Valid base32 address');
      } else {
        console.log('Invalid base32 address (may be hex)');
      }
      break;
    case 'convert':
      try {
        if (isBase32Address(address)) {
          console.log(base32ToHex(address).toLowerCase());
        } else if (address.startsWith('0x')) {
          console.log(hexToBase32(address as `0x${string}`, 1029));
        } else {
          error('Hex address must start with 0x');
        }
      } catch (e) {
        error(`Conversion failed: ${(e as Error).message}`);
      }
      break;
    case 'normalize':
      try {
        if (isBase32Address(address)) {
          console.log(getCoreAddress(address));
        } else if (address.startsWith('0x')) {
          console.log(hexToBase32(address as `0x${string}`, 1029));
        } else {
          error('Hex address must start with 0x');
        }
      } catch (e) {
        error(`Normalization failed: ${(e as Error).message}`);
      }
      break;
    default:
      error(`Unknown action: ${action}`);
  }
}

function cmdUnits(args: string[]): void {
  const action = args[0];
  const value = args[1];

  if (!value) {
    error('Value required');
  }

  try {
    switch (action) {
      case 'parse': {
        const parsed = parseCFX(value) as Wei;
        console.log(parsed.toString());
        break;
      }
      case 'format': {
        const formatted = formatCFX(BigInt(value));
        console.log(formatted);
        break;
      }
      default:
        error(`Unknown action: ${action}`);
    }
  } catch (e) {
    error(`Unit conversion failed: ${(e as Error).message}`);
  }
}

function cmdChains(): void {
  const chains = listChains();
  console.log('Available chains:');
  for (const chain of chains) {
    console.log(`  ${chain.name}: ${chain.displayName} (${chain.rpc.http[0]})`);
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  switch (subcommand) {
    case 'status':
      await cmdStatus(args.slice(1));
      break;
    case 'derive':
      cmdDerive(args.slice(1));
      break;
    case 'address':
      cmdAddress(args.slice(1));
      break;
    case 'units':
      cmdUnits(args.slice(1));
      break;
    case 'chains':
      cmdChains();
      break;
    case 'help':
    case '--help':
    case '-h':
      console.log('Usage: cdk <subcommand> [args...]');
      console.log('');
      console.log('Subcommands:');
      console.log('  status    — chain status via RPC');
      console.log('  derive    — derive account from mnemonic');
      console.log('  address   — address utilities (validate, convert, normalize)');
      console.log('  units     — unit conversion (parse, format)');
      console.log('  chains    — list available chains');
      break;
    default:
      if (subcommand) {
        error(`Unknown subcommand: ${subcommand}`);
      }
      console.log('Run `cdk help` for usage information');
      process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
