import { getCoreChainConfig } from './coreWalletPrimitives.js';

export type CoreWalletStatus =
  | 'not-installed'
  | 'in-detecting'
  | 'in-activating'
  | 'not-active'
  | 'chain-error'
  | 'active';

export interface CorePillState {
  isPending: boolean;
  isActive: boolean;
  canConnect: boolean;
  onCorrectChain: boolean;
  showSwitch: boolean;
}

export interface ESpacePillState {
  isConnected: boolean;
  onCorrectChain: boolean;
  showSwitch: boolean;
}

export function deriveCoreState(
  status: string,
  chainId: string | undefined,
  targetHex: string,
): CorePillState {
  const isPending = status === 'in-detecting' || status === 'in-activating';
  const isActive = status === 'active';
  const canConnect = !isPending && !isActive && status !== 'not-installed';
  const onCorrectChain =
    !isActive || (chainId !== undefined && chainId.toLowerCase() === targetHex.toLowerCase());
  const showSwitch = isActive && !onCorrectChain;
  return { isPending, isActive, canConnect, onCorrectChain, showSwitch };
}

export function deriveESpaceState(
  isConnected: boolean,
  chainId: number,
  targetChainId: number,
): ESpacePillState {
  const onCorrectChain = !isConnected || chainId === targetChainId;
  const showSwitch = isConnected && !onCorrectChain;
  return { isConnected, onCorrectChain, showSwitch };
}

export function needsESpaceSwitch(
  isConnected: boolean,
  connectedChainId: number,
  targetChainId: number,
): boolean {
  return isConnected && connectedChainId !== targetChainId;
}

export function coreChainLabel(chainId: string | undefined): string {
  if (!chainId) return 'unknown';
  return getCoreChainConfig(chainId)?.label ?? `chain ${chainId}`;
}

export function espaceChainLabel(chainId: number | undefined): string {
  switch (chainId) {
    case 1030:
      return 'eSpace Mainnet';
    case 71:
      return 'eSpace Testnet';
    case 2030:
      return 'eSpace Local';
    default:
      return `chain ${String(chainId ?? 'unknown')}`;
  }
}
