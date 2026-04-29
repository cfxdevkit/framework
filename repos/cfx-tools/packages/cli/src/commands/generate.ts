import { generateMnemonic, validateMnemonic } from '@cfxdevkit/core';
import { getBool, getNumber } from '../args.js';

export interface GenerateReport {
  mnemonic: string;
  wordCount: number;
  valid: boolean;
}

export interface RunGenerateOptions {
  strength?: 128 | 160 | 192 | 224 | 256;
}

export function runGenerate(opts: RunGenerateOptions = {}): GenerateReport {
  const mnemonic = generateMnemonic(opts.strength ?? 128);
  return {
    mnemonic,
    wordCount: mnemonic.split(' ').length,
    valid: validateMnemonic(mnemonic),
  };
}

export function generateFromFlags(
  flags: Record<string, string | boolean>,
  out: NodeJS.WritableStream,
): number {
  const opts: RunGenerateOptions = {};
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
  const report = runGenerate(opts);
  if (getBool(flags, 'json')) {
    out.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    out.write(`${report.mnemonic}\n`);
  }
  return 0;
}
