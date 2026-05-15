// Framework re-exports

export type { CoreChainConfig, CoreWalletStatus } from '@cfxdevkit/wallet-connect';
export {
  CORE_CHAIN_CONFIGS,
  coreChainLabel,
  deriveCoreState,
  getFluentCoreProvider,
  useCoreWallet,
} from '@cfxdevkit/wallet-connect';
export { ConnectButton, WalletPickerModal } from '@cfxdevkit/wallet-connect/ui';

// Components
export type { CodeSnippetProps } from './components/CodeSnippet';
export { CodeSnippet } from './components/CodeSnippet';
export { ConnectWall } from './components/ConnectWall';
export { CopyButton } from './components/CopyButton';
export type { DemoCardProps } from './components/DemoCard';
export { DemoCard } from './components/DemoCard';
export { LogBox } from './components/LogBox';
export type { NavItem, PanelGroupLike, PanelLike, ShellProps } from './components/Shell';
export {
  PanelSidebar,
  SharedDevNodePill,
  Shell,
  ShowcaseNav,
  ShowcaseOpsPanel,
  useActivePanelState,
} from './components/Shell';
export type { SidebarGroup, SidebarItem, SidebarProps } from './components/Sidebar';
export { Sidebar } from './components/Sidebar';
export type { BadgeStatus, StatusBadgeProps } from './components/StatusBadge';
export { StatusBadge } from './components/StatusBadge';

// Utilities
export { copy } from './lib/copy';
export { errMsg } from './lib/err';
export type { LogEntry, LogLevel } from './lib/log';
export { makeEntry, useLogList } from './lib/log';
