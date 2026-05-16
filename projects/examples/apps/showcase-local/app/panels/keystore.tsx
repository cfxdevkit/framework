'use client';

import { CopyButton, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { KEYSTORE_API_SNIPPET } from '../../lib/showcase-guide';
import {
  buttonRowStyle,
  DevnodeStat,
  errorStyle,
  inputStyle,
  labelStyle,
  noteStyle,
  rowStyle,
  stackStyle,
  statsGridStyle,
} from '../devnode/devnode-ui';
import { KeystoreWalletList } from './keystore-wallets';
import { CollapsibleCodeExample, type ShowcaseWorkspacePanelsProps, sectionStyle } from './shared';

export function KeystorePanel(props: ShowcaseWorkspacePanelsProps) {
  return (
    <section
      id="keystore"
      style={props.activeSection === 'keystore' ? sectionStyle : { display: 'none' }}
    >
      <div style={{ padding: '24px', backgroundColor: '#1e1e1e' }}>
        <div
          style={{
            paddingBottom: '16px',
            borderBottom: '1px solid #3c3c3c',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              margin: 0,
              fontWeight: 500,
              color: '#e7e7e7',
              marginBottom: '8px',
            }}
          >
            Wallet Roots
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            Generate, import, unlock, rename, activate, and delete mnemonic roots here without
            keeping the whole workspace cluttered with wallet controls.
          </p>
        </div>
        <div style={stackStyle}>
          <div style={rowStyle}>
            <span style={labelStyle}>Status</span>
            {props.keystoreBadge}
          </div>

          <div style={statsGridStyle}>
            <DevnodeStat
              label="Initialized"
              value={
                props.keystoreStatus ? (props.keystoreStatus.initialized ? 'yes' : 'no') : 'loading'
              }
            />
            <DevnodeStat
              label="Access"
              value={
                !props.keystoreStatus
                  ? 'loading'
                  : !props.keystoreStatus.initialized
                    ? 'setup required'
                    : props.keystoreStatus.locked
                      ? 'locked'
                      : 'ready'
              }
            />
            <DevnodeStat
              label="Wallet refs"
              value={props.keystoreStatus ? String(props.keystoreStatus.walletCount) : '0'}
            />
          </div>

          <label style={stackStyle}>
            <span style={labelStyle}>Keystore passphrase</span>
            <input
              type="password"
              style={inputStyle}
              value={props.passphrase}
              onChange={(event) => props.onSetPassphrase(event.target.value)}
            />
          </label>

          {props.keystoreError ? <div style={errorStyle}>{props.keystoreError}</div> : null}

          <div style={buttonRowStyle}>
            <button
              type="button"
              disabled={props.keystoreBusy !== null || Boolean(props.keystoreStatus?.initialized)}
              onClick={props.onRunSetupKeystore}
            >
              {props.keystoreBusy === 'setup' ? 'Setting up…' : 'Setup keystore'}
            </button>
            <button
              type="button"
              disabled={
                props.keystoreBusy !== null ||
                !props.keystoreStatus?.initialized ||
                !props.keystoreStatus?.locked
              }
              onClick={props.onRunUnlockKeystore}
            >
              {props.keystoreBusy === 'unlock' ? 'Unlocking…' : 'Unlock'}
            </button>
            <button
              type="button"
              disabled={
                props.keystoreBusy !== null ||
                !props.keystoreStatus?.initialized ||
                Boolean(props.keystoreStatus?.locked)
              }
              onClick={props.onRunLock}
            >
              {props.keystoreBusy === 'lock' ? 'Locking…' : 'Lock'}
            </button>
            <button
              type="button"
              disabled={props.keystoreBusy !== null}
              onClick={props.onRefreshKeystore}
            >
              {props.keystoreBusy === 'refresh' ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {props.activeWallet ? (
            <div style={statsGridStyle}>
              <div
                style={{
                  border: '1px solid var(--cfx-color-border-default)',
                  borderRadius: 'var(--cfx-radius-md)',
                  display: 'grid',
                  gap: 'var(--cfx-space-2)',
                  padding: 'var(--cfx-space-3)',
                }}
              >
                <div style={rowStyle}>
                  <strong>{props.activeWallet.name}</strong>
                  <StatusBadge label="active" status="ok" />
                </div>
                <div style={noteStyle}>
                  Path: <code>{props.activeWallet.derivationPath}</code>
                </div>
                <div style={noteStyle}>
                  eSpace: <code>{props.activeWallet.address}</code>
                </div>
                {props.activeWallet.coreAddress ? (
                  <div style={noteStyle}>
                    Core: <code>{props.activeWallet.coreAddress}</code>
                  </div>
                ) : null}
                <div style={buttonRowStyle}>
                  <CopyButton label="copy eSpace" text={props.activeWallet.address} />
                  {props.activeWallet.coreAddress ? (
                    <CopyButton label="copy Core" text={props.activeWallet.coreAddress} />
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div style={noteStyle}>
              Import or activate a wallet ref to make the signer available to session-key and
              deploy.
            </div>
          )}

          <label style={stackStyle}>
            <span style={labelStyle}>Mnemonic label</span>
            <input
              type="text"
              style={inputStyle}
              placeholder="Workspace mnemonic"
              value={props.walletName}
              onChange={(event) => props.onSetWalletName(event.target.value)}
            />
          </label>
          <label style={stackStyle}>
            <span style={labelStyle}>Mnemonic to import</span>
            <textarea
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={props.mnemonicDraft}
              onChange={(event) => props.onSetMnemonicDraft(event.target.value)}
            />
          </label>
          <div style={noteStyle}>
            Generate creates a fresh mnemonic inside the backend keystore. Import stores the phrase
            shown above, which starts with the demo seed so the local flow has a ready reference.
          </div>
          <div style={buttonRowStyle}>
            <button
              type="button"
              disabled={props.keystoreBusy !== null || !props.keystoreReady}
              onClick={props.onCreateWallet}
            >
              {props.keystoreBusy === 'create' ? 'Generating…' : 'Generate mnemonic'}
            </button>
            <button
              type="button"
              disabled={props.keystoreBusy !== null || !props.keystoreReady}
              onClick={props.onImportWallet}
            >
              {props.keystoreBusy === 'import' ? 'Importing…' : 'Import mnemonic'}
            </button>
          </div>

          <KeystoreWalletList {...props} />

          <CollapsibleCodeExample
            code={KEYSTORE_API_SNIPPET}
            label="Backend keystore route surface"
          />
        </div>
      </div>
    </section>
  );
}
