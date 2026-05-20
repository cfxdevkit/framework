/**
 * `@cfxdevkit/compiler` — barrel export.
 *
 * Solidity compilation pipeline: a typed `compile(input)` powered by solc
 * standard-json, plus import resolvers, a curated template registry, and
 * artifact I/O helpers. See `./API.md` for the full surface and
 * `./STRUCTURE.md` for layout.
 *
 * Prefer the sub-paths (`./solc`, `./resolver`, `./templates`) when you
 * can for tighter tree-shaking.
 */

export { readArtifact, selectorsOf, writeArtifact } from './artifacts.js';
export { CompileError, type CompileErrorCode } from './errors.js';
export { compose, npmResolver, remappingResolver } from './resolver/index.js';
export { compile, ensureSolc, listInstalledSolc, type SolcInstance } from './solc/index.js';
export {
  basicErc20,
  basicErc721,
  getTemplate,
  listTemplates,
  type TemplateMeta,
} from './templates/index.js';
export type {
  Artifact,
  CompileDiagnostic,
  CompileInput,
  CompileOutput,
  ImportResolver,
  Source,
} from './types.js';
export const __packageName = '@cfxdevkit/compiler' as const;
