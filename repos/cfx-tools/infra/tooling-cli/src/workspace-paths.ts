import { findWorkspaceRoot } from '@cfxdevkit/workspace-utils';

export { findWorkspaceRoot };

/** Convenience alias — same as findWorkspaceRoot. */
export function findRepoRoot(startDir: string): string {
  return findWorkspaceRoot(startDir);
}

export function relativeParent(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parent = normalized.slice(0, normalized.lastIndexOf('/')) || normalized;
  return parent === normalized ? normalized : parent;
}
