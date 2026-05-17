'use client';

import { KeystoreShell } from '@cfxdevkit/react/keystore';
import { KEYSTORE_API_SNIPPET } from '../../../lib/showcase-guide';
import {
  buttonRowStyle,
  errorStyle,
  inputStyle,
  labelStyle,
  stackStyle,
} from '../../devnode/devnode-ui';
import { CollapsibleCodeExample, type ShowcaseWorkspacePanelsProps, sectionStyle } from '../shared';
import { KeystoreIdentityCard } from './identity-card';
import { cardStyle } from './styles';
import { WalletManagement } from './wallet-management';

export function KeystorePanel(props: ShowcaseWorkspacePanelsProps) {
  return (
    <section
      id="keystore"
      style={props.activeSection === 'keystore' ? sectionStyle : { display: 'none' }}
    >
      <div style={{ padding: '24px', display: 'grid', gap: '20px' }}>
        <KeystoreShell
          blankSlot={({ setup, isBusy, error }) => (
            <div style={cardStyle}>
              <div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--cfx-color-fg-default)',
                    margin: '0 0 8px 0',
                  }}
                >
                  Create keystore
                </h2>
                <p
                  style={{
                    color: 'var(--cfx-color-fg-subtle)',
                    fontSize: 'var(--cfx-text-sm)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Choose a passphrase to protect your wallet keys. You will need it to unlock the
                  keystore in future sessions.
                </p>
              </div>
              {error ? <div style={errorStyle}>{error}</div> : null}
              <label style={stackStyle}>
                <span style={labelStyle}>Passphrase</span>
                <input
                  type="password"
                  style={inputStyle}
                  placeholder="Choose a new passphrase"
                  value={props.passphrase}
                  onChange={(e) => props.onSetPassphrase(e.target.value)}
                />
              </label>
              <div style={buttonRowStyle}>
                <button
                  type="button"
                  disabled={isBusy || !props.passphrase.trim()}
                  onClick={() => void setup(props.passphrase)}
                >
                  {isBusy ? 'Creating…' : 'Create keystore'}
                </button>
                <button type="button" disabled={isBusy} onClick={props.onRefreshKeystore}>
                  {isBusy ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>
          )}
          lockedSlot={({ unlock, isBusy, error }) => (
            <div style={cardStyle}>
              <div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--cfx-color-fg-default)',
                    margin: '0 0 8px 0',
                  }}
                >
                  Keystore locked
                </h2>
                <p
                  style={{
                    color: 'var(--cfx-color-fg-subtle)',
                    fontSize: 'var(--cfx-text-sm)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Enter your passphrase to unlock the keystore and access your mnemonic wallets.
                </p>
              </div>
              {error ? <div style={errorStyle}>{error}</div> : null}
              <label style={stackStyle}>
                <span style={labelStyle}>Passphrase</span>
                <input
                  type="password"
                  style={inputStyle}
                  placeholder="Enter your passphrase"
                  value={props.passphrase}
                  onChange={(e) => props.onSetPassphrase(e.target.value)}
                />
              </label>
              <div style={buttonRowStyle}>
                <button
                  type="button"
                  disabled={isBusy || !props.passphrase.trim()}
                  onClick={() => void unlock(props.passphrase)}
                >
                  {isBusy ? 'Unlocking…' : 'Unlock'}
                </button>
                <button type="button" disabled={isBusy} onClick={props.onRefreshKeystore}>
                  {isBusy ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>
          )}
          noWalletSlot={
            <>
              <WalletManagement props={props} />
              <CollapsibleCodeExample
                code={KEYSTORE_API_SNIPPET}
                label="Backend keystore route surface"
              />
            </>
          }
          activeSlot={
            <>
              <KeystoreIdentityCard onLock={props.onRunLock} />

              {/* Wallet management — add / import wallets */}
              <WalletManagement props={props} />

              {/* Reset guidance */}
              {props.keystoreStatus?.reset ? (
                <div
                  style={{
                    fontSize: 'var(--cfx-text-xs)',
                    color: 'var(--cfx-color-fg-muted)',
                    lineHeight: 1.5,
                    padding: '8px 0',
                  }}
                >
                  <strong>Operator reset:</strong> {props.keystoreStatus.reset.warning} Remove these
                  paths after stopping the node:{' '}
                  {props.keystoreStatus.reset.paths.map((path) => (
                    <span key={path}>
                      <code>{path}</code>{' '}
                    </span>
                  ))}
                </div>
              ) : null}

              <CollapsibleCodeExample
                code={KEYSTORE_API_SNIPPET}
                label="Backend keystore route surface"
              />
            </>
          }
        />
      </div>
    </section>
  );
}
