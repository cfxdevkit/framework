/**
 * Public type surface for `@cfxdevkit/compiler`. See `./API.md`.
 *
 * The shapes mirror solc's standard-json model where useful but stay
 * framework-agnostic so callers can persist artifacts in whatever format
 * they like (the package only ships `selectorsOf` + read/write helpers).
 */
import type { Hex } from '@cfxdevkit/cdk';
import type { Abi } from 'viem';

/** A single compilation unit. `path` is what solc sees in error messages and source maps. */
export interface Source {
  path: string;
  content: string;
}

/** A diagnostic returned by the compiler that did not fail the build. */
export interface CompileDiagnostic {
  message: string;
  severity: 'warning' | 'info';
  /** Source path the message refers to (when solc provides one). */
  sourceLocation?: { file: string; start: number; end: number };
  /** solc error type, e.g. `Warning`, `ParserError`, `Info`. */
  type?: string;
}

/** Optional resolver invoked when solc requests an import it cannot find inline. */
export interface ImportResolver {
  resolve(input: { from: string; importPath: string }): Promise<Source | null>;
}

/** Inputs accepted by the high-level {@link compile} entry point. */
export interface CompileInput {
  sources: readonly Source[];
  /** Exact solc version, e.g. `"0.8.26"`. No version ranges. */
  solcVersion: string;
  optimizer?: { enabled: boolean; runs: number };
  /** EVM target, e.g. `"london"`, `"paris"`, `"shanghai"`. Defaults to solc's choice. */
  evmVersion?: string;
  /** Foundry-style remappings, e.g. `["@openzeppelin/=node_modules/@openzeppelin/"]`. */
  remappings?: readonly string[];
  /** Resolver chain for unresolved imports. */
  resolver?: ImportResolver;
  /** Additional output selection. Defaults to abi + bytecode + deployedBytecode + metadata. */
  outputSelection?: Record<string, Record<string, readonly string[]>>;
  signal?: AbortSignal;
}

/** A single compiled contract. */
export interface Artifact {
  /** Source path relative to the input set. */
  path: string;
  contractName: string;
  abi: Abi;
  bytecode: Hex;
  deployedBytecode: Hex;
  /** Standard solc metadata blob (JSON string). */
  metadata: string;
  sourceMap?: string;
}

/** Result returned by {@link compile}. */
export interface CompileOutput {
  artifacts: readonly Artifact[];
  warnings: readonly CompileDiagnostic[];
  /** sha-256 of the normalised solc standard-json input. Stable across runs. */
  inputHash: string;
  solcVersion: string;
}
