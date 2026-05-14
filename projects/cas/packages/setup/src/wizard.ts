
export type Network = 'testnet' | 'mainnet' | 'local';

export interface WizardState {
  /** Target Conflux eSpace network */
  network: Network;
  /** JSON-RPC endpoint URL */
  rpcUrl: string;
  /** AutomationManager contract address */
  automationManagerAddress: string;
  /** PermitHandler contract address */
  permitHandlerAddress: string;
  /** SwappiPriceAdapter contract address */
  priceAdapterAddress: string;
  /** Swappi router address */
  swappiRouterAddress: string;
  /** Wrapped CFX (WCFX) token address */
  wcfxAddress: string;
  /** Whether keeper mode is enabled */
  keeperEnabled: boolean;
  /** Signer private key (0x-prefixed hex) — only set when keeperEnabled */
  signerKey?: string;
  /** Comma-separated list of admin addresses */
  adminAddresses: string;
  /** Skip overwrite prompts for .env files */
  force: boolean;
}

export const EMPTY_STATE: WizardState = {
  network: 'testnet',
  rpcUrl: '',
  automationManagerAddress: '',
  permitHandlerAddress: '',
  priceAdapterAddress: '',
  swappiRouterAddress: '0x62B0873055Bf896Dd869e172119871ac24aeA305',
  wcfxAddress: '',
  keeperEnabled: false,
  adminAddresses: '',
  force: false,
};

type Phase = (state: WizardState) => Promise<WizardState>;

export async function runWizard(initialState: WizardState): Promise<void> {
  // Dynamic imports keep each phase tree-shaken and independently testable
  const { checkEnv } = await import('./steps/check-env.js');
  const { selectNetwork } = await import('./steps/select-network.js');
  const { contractMode } = await import('./steps/contract-mode.js');
  const { configureKeeper } = await import('./steps/configure-keeper.js');
  const { writeEnv } = await import('./steps/write-env.js');
  const { launch } = await import('./steps/launch.js');

  const phases: Phase[] = [
    checkEnv,
    selectNetwork,
    contractMode,
    configureKeeper,
    writeEnv,
    launch,
  ];

  let state = initialState;
  for (const phase of phases) {
    state = await phase(state);
  }
}
