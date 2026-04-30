// lib

export { ConnectWall } from './components/ConnectWall.js';
// components
export { CopyButton } from './components/CopyButton.js';
export { LogBox } from './components/LogBox.js';
export { WalletPickerModal } from './components/WalletPickerModal.js';
export { copy } from './lib/copy.js';
export { errMsg } from './lib/err.js';
export type { LogEntry, LogLevel } from './lib/log.js';
export { makeEntry, useLogList } from './lib/log.js';
export type { CoreChainConfig, FluentProvider, WalletStatus } from './lib/use-core-wallet.js';
export {
  buildAddChainParams,
  CORE_CHAIN_CONFIGS,
  detectFluentCore,
  formatProviderError,
  getCoreChainConfig,
  getFluentCoreProvider,
  normalizeCoreChainId,
  rpcCoreAccounts,
  rpcCoreChainId,
  rpcRequestCoreAccounts,
  switchConfluxChain,
  useCoreWallet,
  waitForCoreChain,
} from './lib/use-core-wallet.js';
export type { CorePillState, CoreWalletStatus, ESpacePillState } from './lib/wallet-state.js';
// wallet state
export {
  coreChainLabel,
  deriveCoreState,
  deriveESpaceState,
  espaceChainLabel,
  needsESpaceSwitch,
} from './lib/wallet-state.js';
