/**
 * `@cfxdevkit/compiler` — error codes.
 *
 * All errors derive from `CfxError` and carry a stable string `code` so
 * callers can branch on it without parsing messages.
 */
import { CfxError, type CfxErrorInit } from '@cfxdevkit/core';

export type CompileErrorCode =
  /** solc returned one or more `severity: error` diagnostics. */
  | 'compiler/solc/syntax'
  /** An import could not be resolved by any registered resolver. */
  | 'compiler/resolver/not-found'
  /** A pragma in source conflicts with the requested `solcVersion`. */
  | 'compiler/version-mismatch'
  /** solc binary could not be downloaded or located. */
  | 'compiler/solc/binary-unavailable'
  /** A required argument was missing or malformed. */
  | 'compiler/invalid-argument'
  /** Filesystem I/O failed (artifact read/write). */
  | 'compiler/io-failure';

export class CompileError extends CfxError {
  constructor(init: CfxErrorInit & { code: CompileErrorCode }) {
    super(init);
    this.name = 'CompileError';
  }
}
