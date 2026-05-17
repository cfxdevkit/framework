'use client';

import { CodeSnippet } from '@cfxdevkit/example-showcase-ui';
import type { ReactNode } from 'react';
import type { ShowcaseContractRecord } from '../../lib/contracts-types';
import type {
  DevnodeAccountSummary,
  DevnodeProfileStateResponse,
  DevnodeStatusResponse,
} from '../../lib/devnode-types';
import type {
  KeystoreActiveWalletSummary,
  KeystoreStatusResponse,
  KeystoreWalletAccountSummary,
  KeystoreWalletSummary,
} from '../../lib/keystore-types';
import type {
  CompileArtifact,
  CustomBlockNumberResponse,
  DeployResponse,
  NetworkId,
  SessionKeyIssueResponse,
  SessionKeyVerifyResponse,
  SpaceId,
  WorkspaceSectionId,
} from '../workspace/shared';
import type { LocalPanelSpec } from './registry';

export {
  chainIdFor,
  displayNetwork,
  isAddressLike,
  isSelectorLike,
  normalizedTtl,
  splitValues,
} from '../workspace/shared';

export interface ShowcaseWorkspacePanelsProps {
  accountsBusy: 'refresh' | 'activate' | null;
  accountsError: string | null;
  accountActionIndex: number | null;
  activePanel: LocalPanelSpec | null;
  activeSection: WorkspaceSectionId;
  activeWallet: KeystoreActiveWalletSummary | null;
  artifact: CompileArtifact | null;
  clearLog(): void;
  compileBusy: boolean;
  compileError: string | null;
  contractName: string;
  contracts: readonly ShowcaseContractRecord[];
  contractsBusy: boolean;
  customBlockError: string | null;
  customBlockResult: CustomBlockNumberResponse | null;
  deployBusy: boolean;
  deployError: string | null;
  deployResult: DeployResponse | null;
  devnode: DevnodeStatusResponse | null;
  devnodeAccounts: readonly DevnodeAccountSummary[];
  devnodeBadge: ReactNode;
  devnodeBusy: 'refresh' | 'start' | 'restart' | 'stop' | 'wipe' | 'mine' | null;
  devnodeError: string | null;
  entries: readonly unknown[];
  environmentFaucets: ReadonlyArray<{ href: string; label: string }>;
  faucet: DevnodeAccountSummary | null;
  faucetAddress: string;
  faucetAmount: string;
  faucetBusy: boolean;
  faucetError: string | null;
  issuedSession: SessionKeyIssueResponse | null;
  keystoreBadge: ReactNode;
  keystoreBusy:
    | 'refresh'
    | 'setup'
    | 'unlock'
    | 'lock'
    | 'import'
    | 'create'
    | 'activate'
    | 'delete'
    | 'rename'
    | null;
  keystoreError: string | null;
  keystoreReady: boolean;
  keystoreStatus: KeystoreStatusResponse | null;
  localRpc: string | undefined;
  localWriteBlocked: boolean;
  mineCount: string;
  mnemonicDraft: string;
  network: NetworkId;
  nodeProfileActionId: string | null;
  nodeProfileBusy: 'select' | null;
  nodeProfileError: string | null;
  nodeProfileLocked: boolean;
  nodeProfiles: NonNullable<DevnodeProfileStateResponse['profiles']>;
  passphrase: string;
  readyForWrite: boolean;
  selectedContract: ShowcaseContractRecord | null;
  selectedContractFunctions: readonly string[];
  selectedContractId: string | null;
  selectedFaucet: { href: string; label: string };
  selectedNodeProfile: DevnodeProfileStateResponse['selectedProfile'];
  sessionBusy: 'idle' | 'issuing' | 'verifying';
  sessionContracts: string;
  sessionError: string | null;
  sessionMaxValue: string;
  sessionSelectors: string;
  sessionTtlMinutes: string;
  sessionVerify: SessionKeyVerifyResponse | null;
  solcVersion: string;
  source: string;
  space: SpaceId;
  walletAccountCount: string;
  walletAccounts: readonly KeystoreWalletAccountSummary[];
  walletActionId: string | null;
  walletName: string;
  walletNameDrafts: Record<string, string>;
  wallets: readonly KeystoreWalletSummary[];
  onActivateAccount(account: KeystoreWalletAccountSummary): void;
  onActivateWallet(wallet: KeystoreWalletSummary): void;
  onCreateWallet(): void;
  onDeleteWallet(wallet: KeystoreWalletSummary): void;
  onImportWallet(): void;
  onLoadSelectedContractIntoSession(): void;
  onLocalFund(): void;
  onMineBlocks(): void;
  onOpenDialog(dialog: 'compiler' | 'deploy' | 'session-key' | 'custom-operation'): void;
  onRefreshContracts(): void;
  onRefreshDevnode(): void;
  onRefreshKeystore(): void;
  onRenameWallet(wallet: KeystoreWalletSummary): void;
  onRestartDevnode(): void;
  onRunLock(): void;
  onRunSetupKeystore(): void;
  onRunUnlockKeystore(): void;
  onSelectContract(id: string): void;
  onSelectNodeProfile(wallet: KeystoreWalletSummary): void;
  onSelectSection(section: WorkspaceSectionId): void;
  onSetFaucetAddress(value: string): void;
  onSetFaucetAmount(value: string): void;
  onSetMineCount(value: string): void;
  onSetMnemonicDraft(value: string): void;
  onSetPassphrase(value: string): void;
  onSetSpace(space: SpaceId): void;
  onSetWalletAccountCount(value: string): void;
  onSetWalletName(value: string): void;
  onSetWalletNameDraft(id: string, value: string): void;
  onStartDevnode(): void;
  onStopDevnode(): void;
  onWipeDevnode(): void;
  onVerifySession(): void;
}

export const preStyle = {
  background: 'var(--cfx-color-bg-emphasis)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  fontFamily: 'var(--cfx-font-mono)',
  fontSize: 'var(--cfx-text-xs)',
  margin: 0,
  overflowX: 'auto',
  padding: 'var(--cfx-space-3)',
  whiteSpace: 'pre-wrap',
} as const;

export const sectionStyle = {
  display: 'grid',
} as const;

export const disclosureStyle = {
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  overflow: 'hidden',
} as const;

export const disclosureSummaryStyle = {
  cursor: 'pointer',
  fontSize: 'var(--cfx-text-sm)',
  fontWeight: 600,
  listStyle: 'none',
  padding: 'var(--cfx-space-3)',
} as const;

export function formatSpace(space: SpaceId): string {
  return space === 'espace' ? 'eSpace' : 'Core';
}

export function formatDeployedAt(value: number): string {
  const deployedAt = new Date(value);
  return Number.isNaN(deployedAt.getTime()) ? String(value) : deployedAt.toLocaleString();
}

export function CollapsibleCodeExample({ code, label }: { code: string; label: string }) {
  return (
    <details style={disclosureStyle}>
      <summary style={disclosureSummaryStyle}>{label}</summary>
      <div style={{ padding: '0 var(--cfx-space-3) var(--cfx-space-3)' }}>
        <CodeSnippet code={code} label={label} />
      </div>
    </details>
  );
}
