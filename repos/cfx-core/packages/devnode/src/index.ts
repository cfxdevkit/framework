/**
 * `@cfxdevkit/devnode` — local Conflux node lifecycle.
 *
 * Wraps the native `@xcfx/node` binary so a single call from a test, script,
 * or the showcase can bring up a dual-space (Core + eSpace) Conflux chain on
 * deterministic ports with pre-funded genesis accounts.
 *
 * Defaults match `@cfxdevkit/cdk/chains`'s `core-local` (chainId 2029, port
 * 12537) and `espace-local` (chainId 2030, port 8545), so a plain
 * `createClient({ chain: coreSpaceLocal, transport: http() })` works against
 * the spawned node with no extra config.
 *
 * **Dev / test only.** Never import this from a browser or production
 * bundle — `@xcfx/node` ships a native binary and only resolves under
 * Node.js.
 */

export { DevNodeError, type DevNodeErrorCode } from './errors.js';
export { createDevNode, DevNode, type DevNodeUrls } from './node.js';
export type {
  DevNodeAccount,
  DevNodeConfig,
  DevNodeStatus,
  MiningStatus,
} from './types.js';
