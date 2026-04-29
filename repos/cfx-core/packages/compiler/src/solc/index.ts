/**
 * Public surface for `@cfxdevkit/compiler/solc` — the low-level binary
 * loader plus the standard-json `compile` shim that powers the high-level
 * `@cfxdevkit/compiler` entry point.
 */

export { compile } from './compile.js';
export { ensureSolc, listInstalledSolc, type SolcInstance } from './loader.js';
