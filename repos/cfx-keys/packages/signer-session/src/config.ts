/**
 * Signer configuration layer — parallel to `.pi/providers.json` for LLM config.
 *
 * Config file: `.cfxdevkit/signer.json` in the workspace root.
 *
 * Resolution order:
 *   1. Explicit `name` argument
 *   2. `CFX_SIGNER_NAME` env var
 *   3. `defaultSigner` field in the config file
 *   4. Built-in fallback: `{ kind: 'memory' }` (ephemeral, no setup required)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { findWorkspaceRoot } from './workspace-root.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignerKind = 'memory' | 'file-keystore' | 'onekey' | 'ledger';

export interface MemorySignerEntry {
  readonly kind: 'memory';
}

export interface FileKeystoreSignerEntry {
  readonly kind: 'file-keystore';
  readonly path?: string;
  readonly service?: string;
  readonly account?: string;
  readonly accountIndex?: number;
  readonly espaceChainId?: number;
  readonly coreNetworkId?: number;
}

export interface OneKeySignerEntry {
  readonly kind: 'onekey';
  readonly espacePath?: string;
  readonly corePath?: string;
  readonly espaceChainId?: number;
  readonly coreNetworkId?: number;
}

export interface LedgerSignerEntry {
  readonly kind: 'ledger';
  readonly espaceChainId?: number;
  readonly coreNetworkId?: number;
}

export type SignerEntry =
  | MemorySignerEntry
  | FileKeystoreSignerEntry
  | OneKeySignerEntry
  | LedgerSignerEntry;

export interface SignerConfig {
  readonly defaultSigner: string;
  readonly signers: Record<string, SignerEntry>;
}

// ─── Paths ────────────────────────────────────────────────────────────────────

/** Resolve the signer config path from the workspace root. */
export function signerConfigPath(cwd = process.cwd()): string {
  try {
    return join(findWorkspaceRoot(cwd), '.cfxdevkit', 'signer.json');
  } catch {
    return join(cwd, '.cfxdevkit', 'signer.json');
  }
}

// ─── Defaults ────────────────────────────────────────────────────────────────

/** Built-in default config: a single memory (ephemeral) signer. */
export function defaultSignerConfig(): SignerConfig {
  return {
    defaultSigner: 'quick',
    signers: {
      quick: { kind: 'memory' },
    },
  };
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

/** Read the signer config. Returns `defaultSignerConfig()` if the file does not exist. */
export async function readSignerConfig(cwd = process.cwd()): Promise<SignerConfig> {
  const path = signerConfigPath(cwd);
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as SignerConfig;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultSignerConfig();
    }
    throw err;
  }
}

/** Write the signer config, creating `.cfxdevkit/` if needed. */
export async function writeSignerConfig(config: SignerConfig, cwd = process.cwd()): Promise<void> {
  const path = signerConfigPath(cwd);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

// ─── Resolution ──────────────────────────────────────────────────────────────

/**
 * Resolve the active signer entry.
 * Priority: explicit `name` → `CFX_SIGNER_NAME` env → `config.defaultSigner`.
 */
export function resolveSignerEntry(
  config: SignerConfig,
  name?: string | null,
): { name: string; entry: SignerEntry } {
  const resolved = name ?? process.env.CFX_SIGNER_NAME ?? config.defaultSigner;
  const entry = config.signers[resolved];
  if (!entry) {
    const available = Object.keys(config.signers).join(', ');
    throw new Error(
      `Signer '${resolved}' not found in signer config. Available: ${available || '(none)'}`,
    );
  }
  return { name: resolved, entry };
}

// ─── Gitignore helper ─────────────────────────────────────────────────────────

/** Add `.cfxdevkit/signer.json` to `.gitignore` if not already present. */
export async function ensureSignerJsonGitignored(cwd = process.cwd()): Promise<boolean> {
  let root: string;
  try {
    root = findWorkspaceRoot(cwd);
  } catch {
    root = cwd;
  }
  const gitignorePath = join(root, '.gitignore');
  const entry = '.cfxdevkit/signer.json';
  try {
    const existing = await readFile(gitignorePath, 'utf8');
    if (existing.includes(entry)) return false; // already present
    const separator = existing.endsWith('\n') ? '' : '\n';
    await writeFile(gitignorePath, `${existing}${separator}${entry}\n`, 'utf8');
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeFile(gitignorePath, `${entry}\n`, 'utf8');
      return true;
    }
    throw err;
  }
}
