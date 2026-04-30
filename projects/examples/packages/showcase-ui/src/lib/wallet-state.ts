/**
 * wallet-state — pure derivation functions for wallet pill UI state.
 *
 * These helpers sit between raw hook outputs and the rendered JSX so that
 * the state-machine logic can be unit-tested without any React scaffolding.
 */

// ── Core (window.conflux / @cfxjs/use-wallet-react) ────────────────────

/**
 * Lifecycle states emitted by `@cfxjs/use-wallet-react`.
 * Keep in sync with the library's type definitions.
 */
export type CoreWalletStatus =
  | 'not-installed' // window.conflux not found in the browser
  | 'in-detecting' // SDK is probing for the provider (brief on-load phase)
  | 'in-activating' // user accepted the connect popup, waiting for accounts
  | 'not-active' // provider present but user has not connected
  | 'chain-error' // connected but on an unrecognised chain
  | 'active'; // connected, accounts available

export interface CorePillState {
  /** True while a connect request is in-flight — disable the Connect button. */
  isPending: boolean;
  /** Wallet is fully connected and at least one account is authorised. */
  isActive: boolean;
  /**
   * Connect button should be shown and enabled.
   * False when not-installed, in-flight, or already active.
   */
  canConnect: boolean;
  /**
   * The wallet's current chain matches the app's selected network.
   * Always true when not active (no mismatch to report).
   */
  onCorrectChain: boolean;
  /**
   * Show a "Switch to <network>" button.
   * Only relevant when active and on the wrong chain.
   */
  showSwitch: boolean;
}

/**
 * Derive Core pill display state from raw hook outputs.
 *
 * @param status     - raw value from `useStatus()`
 * @param chainId    - raw value from `useChainId()` (hex string, e.g. "0x405")
 * @param targetHex  - the hex chain-id the app expects for the current network
 */
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

// ── eSpace (wagmi / EIP-1193) ───────────────────────────────────────────

export interface ESpacePillState {
  /** Wagmi account is connected. */
  isConnected: boolean;
  /**
   * The connected wallet's chainId matches the app's selected network.
   * Always true when not connected.
   */
  onCorrectChain: boolean;
  /**
   * Show a "Switch" badge / button.
   * Only relevant when connected and on the wrong chain.
   */
  showSwitch: boolean;
}

/**
 * Derive eSpace pill display state.
 *
 * @param isConnected   - wagmi `useAccount().isConnected`
 * @param chainId       - wagmi `useChainId()` (decimal number)
 * @param targetChainId - decimal chain-id the app expects for the current network
 */
export function deriveESpaceState(
  isConnected: boolean,
  chainId: number,
  targetChainId: number,
): ESpacePillState {
  const onCorrectChain = !isConnected || chainId === targetChainId;
  const showSwitch = isConnected && !onCorrectChain;
  return { isConnected, onCorrectChain, showSwitch };
}

// ── Network sync guard ──────────────────────────────────────────────────

/**
 * Returns true when WagmiNetworkSync should fire `switchChain`.
 *
 * The guard prevents unnecessary wallet prompts:
 * - skip when no wallet is connected (nothing to switch)
 * - skip when the connected chain already matches the target
 *
 * @param isConnected       - wagmi `useAccount().isConnected`
 * @param connectedChainId  - wagmi `useChainId()` (decimal)
 * @param targetChainId     - decimal chain-id for the selected network
 */
export function needsESpaceSwitch(
  isConnected: boolean,
  connectedChainId: number,
  targetChainId: number,
): boolean {
  return isConnected && connectedChainId !== targetChainId;
}

// ── Human-readable labels ───────────────────────────────────────────────

export function coreChainLabel(chainId: string | undefined): string {
  if (!chainId) return 'unknown';
  switch (chainId.toLowerCase()) {
    case '0x405':
      return 'Core Mainnet';
    case '0x1':
      return 'Core Testnet';
    case '0xc9':
      return 'Core Local';
    default:
      return `chain ${chainId}`;
  }
}

export function espaceChainLabel(chainId: number): string {
  switch (chainId) {
    case 1030:
      return 'eSpace Mainnet';
    case 71:
      return 'eSpace Testnet';
    case 2030:
      return 'eSpace Local';
    default:
      return `chain ${chainId}`;
  }
}
