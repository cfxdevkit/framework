'use client';

import {
  buttonRowStyle,
  errorStyle,
  inputStyle,
  labelStyle,
  stackStyle,
} from '../../devnode/devnode-ui';
import type { ShowcaseWorkspacePanelsProps } from '../shared';
import { cardStyle } from './styles';

export function WalletManagement({ props }: { props: ShowcaseWorkspacePanelsProps }) {
  return (
    <div style={cardStyle}>
      <h3
        style={{
          fontSize: 'var(--cfx-text-sm)',
          fontWeight: 600,
          color: 'var(--cfx-color-fg-default)',
          margin: 0,
        }}
      >
        Wallets ({props.wallets.length})
      </h3>

      {props.wallets.map((wallet) => (
        <div
          key={wallet.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--cfx-space-2)',
            padding: 'var(--cfx-space-2) 0',
            borderBottom: '1px solid var(--cfx-color-border-muted)',
          }}
        >
          <div style={{ display: 'grid', gap: '2px' }}>
            <span style={{ fontSize: 'var(--cfx-text-sm)' }}>{wallet.name}</span>
            <input
              type="text"
              style={{ ...inputStyle, fontSize: 'var(--cfx-text-xs)', width: '200px' }}
              value={props.walletNameDrafts[wallet.id] ?? wallet.name}
              onChange={(e) => props.onSetWalletNameDraft(wallet.id, e.target.value)}
            />
          </div>
          <div style={buttonRowStyle}>
            <button
              type="button"
              onClick={() => props.onRenameWallet(wallet)}
              style={{ fontSize: 'var(--cfx-text-xs)' }}
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => props.onActivateWallet(wallet)}
              style={{ fontSize: 'var(--cfx-text-xs)' }}
            >
              Activate
            </button>
            <button
              type="button"
              onClick={() => props.onDeleteWallet(wallet)}
              style={{ fontSize: 'var(--cfx-text-xs)' }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {props.keystoreError ? <div style={errorStyle}>{props.keystoreError}</div> : null}

      {/* Add wallet */}
      <details style={{ marginTop: 'var(--cfx-space-3)' }}>
        <summary style={{ cursor: 'pointer', fontSize: 'var(--cfx-text-sm)', fontWeight: 600 }}>
          Add wallet
        </summary>
        <div
          style={{ display: 'grid', gap: 'var(--cfx-space-2)', marginTop: 'var(--cfx-space-2)' }}
        >
          <label style={stackStyle}>
            <span style={labelStyle}>Wallet name</span>
            <input
              type="text"
              style={inputStyle}
              placeholder="My Wallet"
              value={props.walletName}
              onChange={(e) => props.onSetWalletName(e.target.value)}
            />
          </label>
          <label style={stackStyle}>
            <span style={labelStyle}>Account count</span>
            <input
              type="number"
              style={inputStyle}
              min={1}
              max={50}
              value={props.walletAccountCount}
              onChange={(e) => props.onSetWalletAccountCount(e.target.value)}
            />
          </label>
          <div style={buttonRowStyle}>
            <button
              type="button"
              disabled={props.keystoreBusy !== null}
              onClick={props.onCreateWallet}
            >
              {props.keystoreBusy === 'create' ? 'Creating…' : 'Generate'}
            </button>
          </div>
        </div>
      </details>

      {/* Import wallet */}
      <details style={{ marginTop: 'var(--cfx-space-2)' }}>
        <summary style={{ cursor: 'pointer', fontSize: 'var(--cfx-text-sm)', fontWeight: 600 }}>
          Import mnemonic
        </summary>
        <div
          style={{ display: 'grid', gap: 'var(--cfx-space-2)', marginTop: 'var(--cfx-space-2)' }}
        >
          <label style={stackStyle}>
            <span style={labelStyle}>Mnemonic phrase</span>
            <textarea
              style={{ ...inputStyle, minHeight: '80px' }}
              placeholder="Enter BIP-39 mnemonic phrase"
              value={props.mnemonicDraft}
              onChange={(e) => props.onSetMnemonicDraft(e.target.value)}
            />
          </label>
          <label style={stackStyle}>
            <span style={labelStyle}>Wallet name</span>
            <input
              type="text"
              style={inputStyle}
              placeholder="My Wallet"
              value={props.walletName}
              onChange={(e) => props.onSetWalletName(e.target.value)}
            />
          </label>
          <label style={stackStyle}>
            <span style={labelStyle}>Account count</span>
            <input
              type="number"
              style={inputStyle}
              min={1}
              max={50}
              value={props.walletAccountCount}
              onChange={(e) => props.onSetWalletAccountCount(e.target.value)}
            />
          </label>
          <div style={buttonRowStyle}>
            <button
              type="button"
              disabled={props.keystoreBusy !== null}
              onClick={props.onImportWallet}
            >
              {props.keystoreBusy === 'import' ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
