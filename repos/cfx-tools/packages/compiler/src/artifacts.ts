/**
 * Artifact helpers — read/write to disk and selector extraction.
 *
 * The on-disk format is plain JSON (one file per artifact). Callers are
 * free to use a different format; these helpers are a convenience for the
 * common case of "compile then save".
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Hex } from '@cfxdevkit/cdk';
import { type Abi, toFunctionSelector } from 'viem';
import { CompileError } from './errors.js';
import type { Artifact } from './types.js';

/** All 4-byte function selectors from an ABI. Constructor + fallback excluded. */
export function selectorsOf(abi: Abi): readonly Hex[] {
  const out: Hex[] = [];
  for (const item of abi) {
    if (item.type !== 'function') continue;
    out.push(toFunctionSelector(item) as Hex);
  }
  return out;
}

export async function readArtifact(path: string): Promise<Artifact> {
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as Artifact;
  } catch (e) {
    throw new CompileError({
      code: 'compiler/io-failure',
      message: `failed to read artifact at ${path}: ${e instanceof Error ? e.message : String(e)}`,
      meta: { path },
    });
  }
}

export async function writeArtifact(path: string, artifact: Artifact): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  } catch (e) {
    throw new CompileError({
      code: 'compiler/io-failure',
      message: `failed to write artifact to ${path}: ${e instanceof Error ? e.message : String(e)}`,
      meta: { path },
    });
  }
}
