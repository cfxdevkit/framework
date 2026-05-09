import type { CasHexAddress } from '@cfxdevkit/cas-shared';
import { LogOut, Network, ShieldCheck, Wallet } from 'lucide-react';
import type { EspaceChainConfig } from '../lib/ethereum';
import { IconButton, Metric, Notice, Panel, PanelBody, StatusGrid } from './ui';

export interface WalletPanelProps {
  account: CasHexAddress | null;
  chainId: number | null;
  targetChain: EspaceChainConfig;
  token: string;
  busy: boolean;
  onConnect: () => void;
  onSwitchChain: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function WalletPanel({
  account,
  chainId,
  targetChain,
  token,
  busy,
  onConnect,
  onSwitchChain,
  onSignIn,
  onSignOut,
}: WalletPanelProps) {
  const wrongChain = chainId !== null && chainId !== targetChain.chainId;
  return (
    <Panel title="Wallet" icon={<Wallet size={16} />}>
      <StatusGrid>
        <Metric
          label="Account"
          value={account ? `${account.slice(0, 6)}…${account.slice(-4)}` : 'not connected'}
        />
        <Metric label="Network" value={chainId ? String(chainId) : 'unknown'} />
        <Metric label="Session" value={token ? 'signed in' : 'not signed in'} />
      </StatusGrid>
      <PanelBody>
        {wrongChain && (
          <Notice tone="error">Switch to {targetChain.name} before creating strategies.</Notice>
        )}
        <div className="inline-actions">
          <button className="button" type="button" onClick={onConnect} disabled={busy}>
            <Wallet size={17} />
            Connect
          </button>
          <button
            className="button"
            type="button"
            onClick={onSwitchChain}
            disabled={busy || !account}
          >
            <Network size={17} />
            Switch
          </button>
          <button
            className="button primary"
            type="button"
            onClick={onSignIn}
            disabled={busy || !account}
          >
            <ShieldCheck size={17} />
            Sign in
          </button>
          <IconButton title="Sign out" onClick={onSignOut} disabled={busy || !token}>
            <LogOut size={16} />
          </IconButton>
        </div>
      </PanelBody>
    </Panel>
  );
}
