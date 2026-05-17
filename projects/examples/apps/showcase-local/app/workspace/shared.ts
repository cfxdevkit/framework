import type { DevnodeAccountSummary } from '../../lib/devnode-types';
import type { KeystoreWalletSummary } from '../../lib/keystore-types';

export type NetworkId = 'local' | 'mainnet' | 'testnet';
export type SpaceId = 'core' | 'espace';
export type WorkspaceSectionId =
  | 'setup'
  | 'keystore'
  | 'accounts'
  | 'devnode'
  | 'session-key'
  | 'compiler'
  | 'deploy'
  | 'contract-context'
  | 'custom-operation'
  | 'reveal';

export type WorkspaceDialogId = 'compiler' | 'deploy' | 'session-key' | 'custom-operation' | null;

const WORKSPACE_SECTIONS = [
  'setup',
  'keystore',
  'accounts',
  'devnode',
  'session-key',
  'compiler',
  'deploy',
  'contract-context',
  'custom-operation',
  'reveal',
] as const satisfies readonly WorkspaceSectionId[];

export const WORKSPACE_STEPS = [
  'keystore',
  'accounts',
  'setup',
  'deploy',
  'session-key',
] as const satisfies readonly WorkspaceSectionId[];

interface CompileWarning {
  message: string;
  severity: string;
}

export interface CompileArtifact {
  abi: unknown[];
  bytecode: string;
  contractName: string;
  deployedBytecode: string;
  inputHash: string;
  warnings: CompileWarning[];
}

interface DeployReceiptSummary {
  blockHash: string | null;
  blockNumber: string | null;
  status: string | null;
  transactionHash: string | null;
}

export interface DeployResponse {
  address: string | null;
  hash: string;
  network: NetworkId;
  ok: boolean;
  receipt: DeployReceiptSummary | null;
  space: SpaceId;
}

export interface SessionKeyIssueResponse {
  attestation: { digest: string; message: string; signature: string };
  capability: Record<string, unknown>;
  ok: boolean;
  parent: string;
  session: string;
}

export interface SessionKeyVerifyResponse {
  message: string;
  ok: boolean;
  valid: boolean;
}

export interface CustomBlockNumberResponse {
  chainId: number;
  family: 'core' | 'espace';
  head: string;
  network: NetworkId;
  ok: boolean;
  rpcUrl: string;
  space: SpaceId;
}

export interface LocalFundResponse {
  ok: boolean;
  txHash: string;
  space: SpaceId;
  error?: string;
}

export const DEFAULT_PASSPHRASE = 'local-demo-passphrase';
export const DEFAULT_SOURCE = `pragma solidity ^0.8.26;

contract Counter {
  uint256 public value;

  function increment() external {
    value += 1;
  }

  function set(uint256 nextValue) external {
    value = nextValue;
  }
}`;
export const STORAGE_PREFIX = 'showcase-workspace';

export function workspaceSections(): readonly WorkspaceSectionId[] {
  return WORKSPACE_SECTIONS;
}

export function syncWalletDrafts(
  current: Record<string, string>,
  wallets: readonly KeystoreWalletSummary[],
): Record<string, string> {
  const next = { ...current };
  let changed = false;
  for (const wallet of wallets) {
    if (typeof next[wallet.id] !== 'string') {
      next[wallet.id] = wallet.name;
      changed = true;
    }
  }
  return changed ? next : current;
}

export function faucetLinksFor(
  network: NetworkId,
  space: SpaceId,
): Array<{ href: string; label: string }> {
  if (network === 'testnet') {
    return space === 'espace'
      ? [
          { href: 'https://efaucet.confluxnetwork.org/', label: 'eSpace testnet faucet' },
          { href: 'https://faucet.confluxnetwork.org/', label: 'Core testnet faucet' },
        ]
      : [
          { href: 'https://faucet.confluxnetwork.org/', label: 'Core testnet faucet' },
          { href: 'https://efaucet.confluxnetwork.org/', label: 'eSpace testnet faucet' },
        ];
  }
  if (network === 'mainnet') {
    return [{ href: 'https://conflux-faucets.com/', label: 'Conflux faucets portal' }];
  }
  return [{ href: 'https://conflux-faucets.com/', label: 'Local help / faucet reference' }];
}

export function isAddressLike(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isSelectorLike(value: string): boolean {
  return /^0x[a-fA-F0-9]{8}$/.test(value);
}

export function readStoredString(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback;
  }
  return window.localStorage.getItem(key) ?? fallback;
}

export function writeStoredString(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(key, value);
}

export function faucetFor(
  network: NetworkId,
  space: SpaceId,
  devnodeAccounts: DevnodeAccountSummary[],
): { href: string; label: string } {
  if (network === 'local') {
    const account = devnodeAccounts[0];
    return account
      ? { href: account.evmAddress, label: `Local faucet (${account.evmAddress.slice(0, 10)}…)` }
      : { href: '', label: 'Local faucet (not available)' };
  }
  if (network === 'testnet') {
    return space === 'espace'
      ? { href: 'https://efaucet.confluxnetwork.org/', label: 'eSpace testnet faucet' }
      : { href: 'https://faucet.confluxnetwork.org/', label: 'Core testnet faucet' };
  }
  return { href: 'https://conflux-faucets.com/', label: 'Conflux faucets portal' };
}

export function extractContractFunctions(abi: unknown[]): string[] {
  return (abi as Array<{ type?: string; name?: string }>)
    .filter((entry) => entry.type === 'function' && typeof entry.name === 'string')
    .map((entry) => entry.name as string);
}

export function normalizedTtl(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 60;
  }
  return Math.max(1, Math.min(1440, Math.floor(parsed)));
}

export function readStoredEnum<TValue extends string>(
  key: string,
  fallback: TValue,
  allowed: readonly TValue[],
): TValue {
  if (typeof window === 'undefined') {
    return fallback;
  }
  const stored = window.localStorage.getItem(key);
  return allowed.includes(stored as TValue) ? (stored as TValue) : fallback;
}

export async function requestWorkspace<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, cache: 'no-store' });
  const payload = (await response.json()) as T & { error?: string };
  if (payload.error) {
    throw new Error(payload.error ?? `${init.method ?? 'GET'} ${path} failed`);
  }
  return payload;
}

export function splitValues(value: string, validate: (entry: string) => boolean): string[] {
  return value
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter(validate);
}

export function displayNetwork(network: NetworkId): string {
  if (network === 'local') return 'Local';
  if (network === 'testnet') return 'Testnet';
  return 'Mainnet';
}

export function chainIdFor(network: NetworkId, space: SpaceId): number {
  if (network === 'local') return space === 'core' ? 2029 : 2030;
  if (network === 'testnet') return space === 'core' ? 1 : 71;
  return space === 'core' ? 1029 : 1030;
}

export function appendDelimitedValue(current: string, nextValue: string): string {
  const values = splitValues(current, () => true);
  if (!values.includes(nextValue)) {
    values.push(nextValue);
  }
  return values.join(', ');
}
