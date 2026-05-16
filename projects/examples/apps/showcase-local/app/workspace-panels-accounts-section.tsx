'use client';

import { CopyButton, StatusBadge } from '@cfxdevkit/example-showcase-ui';
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
} from './devnode/devnode-ui';
import { type ShowcaseWorkspacePanelsProps, sectionStyle } from './workspace-panels-shared';

export function AccountsPanel(props: ShowcaseWorkspacePanelsProps) {
  return (
    <section
      id="accounts"
      style={props.activeSection === 'accounts' ? sectionStyle : { display: 'none' }}
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
            Accounts
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            Derived accounts are grouped by position and keep eSpace and Core addresses together.
            Activate the signer position here instead of mixing it into wallet-root management.
          </p>
        </div>
        <div style={stackStyle}>
          <div style={statsGridStyle}>
            <DevnodeStat label="Wallet" value={props.activeWallet?.name ?? 'not ready'} />
            <DevnodeStat
              label="Active index"
              value={props.activeWallet ? String(props.activeWallet.activeAccountIndex) : 'n/a'}
            />
            <DevnodeStat
              label="Path"
              mono
              value={props.activeWallet?.derivationPath ?? 'unlock and activate a wallet root'}
            />
          </div>

          {props.accountsError ? <div style={errorStyle}>{props.accountsError}</div> : null}

          {props.activeWallet ? (
            props.walletAccounts.length > 0 ? (
              <div style={stackStyle}>
                {props.walletAccounts.map((account) => (
                  <div
                    key={account.index}
                    style={{
                      border: '1px solid var(--cfx-color-border-default)',
                      borderRadius: 'var(--cfx-radius-md)',
                      display: 'grid',
                      gap: 'var(--cfx-space-2)',
                      padding: 'var(--cfx-space-3)',
                    }}
                  >
                    <div style={rowStyle}>
                      <strong>
                        {props.activeWallet?.name} #{account.index}
                      </strong>
                      {account.active ? <StatusBadge label="active" status="ok" /> : null}
                    </div>
                    <div style={noteStyle}>
                      Path: <code>{account.derivationPath}</code>
                    </div>
                    <div style={noteStyle}>
                      eSpace: <code>{account.address}</code>
                    </div>
                    <div style={noteStyle}>
                      Core: <code>{account.coreAddress ?? 'n/a'}</code>
                    </div>
                    <div style={buttonRowStyle}>
                      <button
                        type="button"
                        disabled={props.accountsBusy !== null || account.active}
                        onClick={() => props.onActivateAccount(account)}
                      >
                        {props.accountsBusy === 'activate' &&
                        props.accountActionIndex === account.index
                          ? 'Activating…'
                          : account.active
                            ? 'Active account'
                            : 'Activate account'}
                      </button>
                      <CopyButton label="copy eSpace" text={account.address} />
                      {account.coreAddress ? (
                        <CopyButton label="copy Core" text={account.coreAddress} />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={noteStyle}>
                {props.accountsBusy === 'refresh'
                  ? 'Loading derived accounts…'
                  : 'No derived accounts are loaded for the active wallet yet.'}
              </div>
            )
          ) : (
            <div style={noteStyle}>
              Unlock the backend keystore and activate a wallet root first.
            </div>
          )}

          {props.network === 'local' ? (
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
                  <strong>Local faucet</strong>
                  <StatusBadge
                    label={props.faucet ? 'ready' : 'offline'}
                    status={props.faucet ? 'ok' : 'info'}
                  />
                </div>
                {props.faucet ? (
                  <>
                    <div style={noteStyle}>
                      eSpace: <code>{props.faucet.evmAddress}</code>
                    </div>
                    <div style={noteStyle}>
                      Core: <code>{props.faucet.coreAddress}</code>
                    </div>
                  </>
                ) : (
                  <div style={noteStyle}>
                    Start the local node to expose the backend faucet signer and local funding
                    route.
                  </div>
                )}
                <div style={noteStyle}>
                  Accepts both <code>0x…</code> and <code>cfx:…</code> addresses. Local funding uses
                  the backend bridge path automatically.
                </div>
                <label style={stackStyle}>
                  <span style={labelStyle}>Recipient address</span>
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder="0x… or cfx:…"
                    value={props.faucetAddress}
                    onChange={(event) => props.onSetFaucetAddress(event.target.value)}
                  />
                </label>
                <div style={buttonRowStyle}>
                  {props.activeWallet ? (
                    <button
                      type="button"
                      onClick={() => props.onSetFaucetAddress(props.activeWallet?.address ?? '')}
                    >
                      Use active eSpace
                    </button>
                  ) : null}
                  {props.activeWallet?.coreAddress ? (
                    <button
                      type="button"
                      onClick={() =>
                        props.onSetFaucetAddress(props.activeWallet?.coreAddress ?? '')
                      }
                    >
                      Use active Core
                    </button>
                  ) : null}
                </div>
                <label style={stackStyle}>
                  <span style={labelStyle}>Amount (CFX)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    style={inputStyle}
                    value={props.faucetAmount}
                    onChange={(event) => props.onSetFaucetAmount(event.target.value)}
                  />
                </label>
                {props.faucetError ? <div style={errorStyle}>{props.faucetError}</div> : null}
                <div style={buttonRowStyle}>
                  <button
                    type="button"
                    disabled={props.faucetBusy || !props.faucet}
                    onClick={props.onLocalFund}
                  >
                    {props.faucetBusy ? 'Funding…' : 'Send local funds'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
