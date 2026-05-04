import type { api } from '../lib/api.js';

export interface Capability {
  chains: string;
  contracts: string;
  selectors: string;
  maxValuePerTx: string;
  ttlSeconds: string;
}

export type IssueResult = Awaited<ReturnType<typeof api.sessionKeyIssue>>;
export type VerifyResult = Awaited<ReturnType<typeof api.sessionKeyVerify>>;

export function parseCapability(cap: Capability) {
  const chains = cap.chains
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const contracts = cap.contracts
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const selectors = cap.selectors
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const maxValuePerTx = cap.maxValuePerTx.trim() || undefined;
  const ttl = Number(cap.ttlSeconds);
  const notAfter = ttl > 0 ? Math.floor(Date.now() / 1000) + ttl : undefined;
  return {
    ...(chains.length > 0 ? { chains } : {}),
    ...(contracts.length > 0 ? { contracts } : {}),
    ...(selectors.length > 0 ? { selectors } : {}),
    ...(maxValuePerTx !== undefined ? { maxValuePerTx } : {}),
    ...(notAfter !== undefined ? { notAfter } : {}),
  };
}
