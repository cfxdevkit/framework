'use client';

import { StatusBadge } from '@cfxdevkit/example-showcase-ui';
import {
  buttonRowStyle,
  DevnodeStat,
  inputStyle,
  labelStyle,
  noteStyle,
  rowStyle,
  stackStyle,
  statsGridStyle,
} from './devnode/devnode-ui';
import type { ShowcaseWorkspacePanelsProps } from './workspace-panels-shared';

export function KeystoreWalletList(props: ShowcaseWorkspacePanelsProps) {
  if (props.wallets.length === 0) {
    return null;
  }

  return (
    <div style={stackStyle}>
      {props.wallets.map((wallet) => (
        <div
          key={wallet.id}
          style={{
            border: '1px solid var(--cfx-color-border-default)',
            borderRadius: 'var(--cfx-radius-md)',
            display: 'grid',
            gap: 'var(--cfx-space-2)',
            padding: 'var(--cfx-space-3)',
          }}
        >
          <div style={rowStyle}>
            <strong>{wallet.name}</strong>
            <div style={{ alignItems: 'center', display: 'flex', gap: 'var(--cfx-space-2)' }}>
              {wallet.active ? <StatusBadge label="active" status="ok" /> : null}
              {props.selectedNodeProfile?.id === wallet.id ? (
                <StatusBadge label="node profile" status="info" />
              ) : null}
            </div>
          </div>
          <div style={statsGridStyle}>
            <DevnodeStat label="Accounts" value={String(wallet.accountCount)} />
            <DevnodeStat label="Active account" value={String(wallet.activeAccountIndex)} />
          </div>
          {wallet.firstAddress ? (
            <div style={noteStyle}>
              First address: <code>{wallet.firstAddress}</code>
            </div>
          ) : null}
          <label style={stackStyle}>
            <span style={labelStyle}>Rename mnemonic</span>
            <input
              type="text"
              style={inputStyle}
              value={props.walletNameDrafts[wallet.id] ?? wallet.name}
              onChange={(event) => props.onSetWalletNameDraft(wallet.id, event.target.value)}
            />
          </label>
          <div style={buttonRowStyle}>
            <button
              type="button"
              disabled={props.keystoreBusy !== null || !props.keystoreReady || wallet.active}
              onClick={() => props.onActivateWallet(wallet)}
            >
              {props.keystoreBusy === 'activate' && props.walletActionId === wallet.id
                ? 'Activating…'
                : 'Activate'}
            </button>
            <button
              type="button"
              disabled={
                props.keystoreBusy !== null ||
                !props.keystoreReady ||
                (props.walletNameDrafts[wallet.id] ?? wallet.name).trim() === wallet.name ||
                (props.nodeProfileLocked && props.selectedNodeProfile?.id === wallet.id)
              }
              onClick={() => props.onRenameWallet(wallet)}
            >
              {props.keystoreBusy === 'rename' && props.walletActionId === wallet.id
                ? 'Saving…'
                : 'Save name'}
            </button>
            <button
              type="button"
              disabled={
                props.keystoreBusy !== null ||
                !props.keystoreReady ||
                (props.nodeProfileLocked && props.selectedNodeProfile?.id === wallet.id)
              }
              onClick={() => props.onDeleteWallet(wallet)}
            >
              {props.keystoreBusy === 'delete' && props.walletActionId === wallet.id
                ? 'Removing…'
                : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
