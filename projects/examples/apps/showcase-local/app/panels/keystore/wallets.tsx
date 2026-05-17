'use client';

import { StatusBadge } from '@cfxdevkit/example-showcase-ui';
import {
  buttonRowStyle,
  inputStyle,
  labelStyle,
  noteStyle,
  rowStyle,
  stackStyle,
} from '../../devnode/devnode-ui';
import {
  disclosureStyle,
  disclosureSummaryStyle,
  type ShowcaseWorkspacePanelsProps,
} from '../shared';
import { cardStyle, sectionLabelStyle } from './styles';

type AddFormProps = Pick<
  ShowcaseWorkspacePanelsProps,
  | 'keystoreBusy'
  | 'keystoreReady'
  | 'walletName'
  | 'walletAccountCount'
  | 'mnemonicDraft'
  | 'onSetWalletName'
  | 'onSetWalletAccountCount'
  | 'onSetMnemonicDraft'
  | 'onCreateWallet'
  | 'onImportWallet'
>;

function WalletAddForm(props: AddFormProps) {
  return (
    <div style={stackStyle}>
      <label style={stackStyle}>
        <span style={labelStyle}>Wallet name</span>
        <input
          type="text"
          style={inputStyle}
          placeholder="Workspace mnemonic"
          value={props.walletName}
          onChange={(e) => props.onSetWalletName(e.target.value)}
        />
      </label>
      <label style={stackStyle}>
        <span style={labelStyle}>Derived account count</span>
        <input
          type="number"
          min={1}
          max={50}
          step={1}
          style={{ ...inputStyle, width: '100px' }}
          value={props.walletAccountCount}
          onChange={(e) => props.onSetWalletAccountCount(e.target.value)}
        />
      </label>
      <label style={stackStyle}>
        <span style={labelStyle}>Mnemonic to import (leave blank to generate new)</span>
        <textarea
          rows={3}
          style={{
            ...inputStyle,
            resize: 'vertical',
            fontFamily: 'monospace',
            fontSize: 'var(--cfx-text-sm)',
          }}
          placeholder="word1 word2 word3 … (12 or 24 words)"
          value={props.mnemonicDraft}
          onChange={(e) => props.onSetMnemonicDraft(e.target.value)}
        />
      </label>
      <div style={noteStyle}>
        Generate creates a fresh mnemonic in the backend keystore. Import stores the phrase you
        provide. The account count is fixed per wallet after creation.
      </div>
      <div style={buttonRowStyle}>
        <button
          type="button"
          disabled={props.keystoreBusy !== null || !props.keystoreReady}
          onClick={props.onCreateWallet}
        >
          {props.keystoreBusy === 'create' ? 'Generating…' : 'Generate new wallet'}
        </button>
        <button
          type="button"
          disabled={
            props.keystoreBusy !== null || !props.keystoreReady || !props.mnemonicDraft.trim()
          }
          onClick={props.onImportWallet}
        >
          {props.keystoreBusy === 'import' ? 'Importing…' : 'Import mnemonic'}
        </button>
      </div>
    </div>
  );
}

export function WalletsSection(props: ShowcaseWorkspacePanelsProps) {
  const addForm = (
    <WalletAddForm
      keystoreBusy={props.keystoreBusy}
      keystoreReady={props.keystoreReady}
      walletName={props.walletName}
      walletAccountCount={props.walletAccountCount}
      mnemonicDraft={props.mnemonicDraft}
      onSetWalletName={props.onSetWalletName}
      onSetWalletAccountCount={props.onSetWalletAccountCount}
      onSetMnemonicDraft={props.onSetMnemonicDraft}
      onCreateWallet={props.onCreateWallet}
      onImportWallet={props.onImportWallet}
    />
  );

  return (
    <>
      {props.wallets.length > 0 ? (
        <div>
          <div style={sectionLabelStyle}>All wallets</div>
          <div style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
            {props.wallets.map((wallet) => (
              <div key={wallet.id} style={cardStyle}>
                <div style={rowStyle}>
                  <strong style={{ color: 'var(--cfx-color-fg-default)' }}>{wallet.name}</strong>
                  <div style={{ display: 'flex', gap: 'var(--cfx-space-2)', alignItems: 'center' }}>
                    {wallet.active ? <StatusBadge label="active" status="ok" /> : null}
                  </div>
                </div>
                {wallet.firstEspaceAddress ? (
                  <div style={noteStyle}>
                    First address:{' '}
                    <code style={{ fontSize: 'var(--cfx-text-xs)' }}>
                      {wallet.firstEspaceAddress}
                    </code>
                  </div>
                ) : null}
                <div style={noteStyle}>
                  {wallet.accountCount} account{wallet.accountCount !== 1 ? 's' : ''} · active index{' '}
                  {wallet.activeAccountIndex}
                </div>
                <label style={stackStyle}>
                  <span style={labelStyle}>Rename</span>
                  <input
                    type="text"
                    style={inputStyle}
                    value={props.walletNameDrafts[wallet.id] ?? wallet.name}
                    onChange={(e) => props.onSetWalletNameDraft(wallet.id, e.target.value)}
                  />
                </label>
                <div style={buttonRowStyle}>
                  {!wallet.active ? (
                    <button
                      type="button"
                      disabled={props.keystoreBusy !== null}
                      onClick={() => props.onActivateWallet(wallet)}
                    >
                      {props.keystoreBusy === 'activate' && props.walletActionId === wallet.id
                        ? 'Activating…'
                        : 'Activate wallet'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={
                      props.keystoreBusy !== null ||
                      (props.walletNameDrafts[wallet.id] ?? wallet.name).trim() === wallet.name
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
        </div>
      ) : null}

      {props.wallets.length === 0 ? (
        <div style={cardStyle}>
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--cfx-color-fg-default)',
                margin: '0 0 6px 0',
              }}
            >
              Add your first wallet
            </h3>
            <p
              style={{
                color: 'var(--cfx-color-fg-subtle)',
                fontSize: 'var(--cfx-text-sm)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Generate a fresh mnemonic or import an existing one. The backend stores it securely
              and derives accounts on demand.
            </p>
          </div>
          {addForm}
        </div>
      ) : (
        <details style={disclosureStyle}>
          <summary style={disclosureSummaryStyle}>Add another wallet</summary>
          <div style={{ padding: '0 16px 16px' }}>{addForm}</div>
        </details>
      )}
    </>
  );
}
