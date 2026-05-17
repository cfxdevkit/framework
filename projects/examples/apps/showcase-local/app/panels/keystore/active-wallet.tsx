'use client';

import { CopyButton, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { buttonRowStyle, noteStyle, rowStyle } from '../../devnode/devnode-ui';
import type { ShowcaseWorkspacePanelsProps } from '../shared';
import { addressRowStyle, cardStyle, sectionLabelStyle } from './styles';

export function ActiveWalletCard({
  activeWallet,
  wallets,
}: Pick<ShowcaseWorkspacePanelsProps, 'activeWallet' | 'wallets'>) {
  if (!activeWallet) {
    return wallets.length > 0 ? (
      <div style={{ ...cardStyle, borderColor: 'var(--cfx-color-border-default)' }}>
        <div style={noteStyle}>
          Activate a wallet below to make the backend signer available for deploy and session keys.
        </div>
      </div>
    ) : null;
  }

  return (
    <div>
      <div style={sectionLabelStyle}>Active wallet</div>
      <div
        style={{
          ...cardStyle,
          marginTop: '8px',
          border: '1px solid #3b82f6',
          backgroundColor: 'rgba(59,130,246,0.04)',
        }}
      >
        <div style={rowStyle}>
          <strong style={{ color: 'var(--cfx-color-fg-default)' }}>{activeWallet.name}</strong>
          <StatusBadge label="active" status="ok" />
        </div>
        <div style={{ display: 'grid', gap: 'var(--cfx-space-2)' }}>
          <div style={addressRowStyle}>
            <span style={{ ...sectionLabelStyle, minWidth: '56px' }}>eSpace</span>
            <code
              style={{
                fontSize: 'var(--cfx-text-xs)',
                color: 'var(--cfx-color-fg-default)',
                flex: 1,
                wordBreak: 'break-all',
              }}
            >
              {activeWallet.address}
            </code>
            <CopyButton label="copy" text={activeWallet.address} />
          </div>
          <div style={addressRowStyle}>
            <span style={{ ...sectionLabelStyle, minWidth: '56px' }}>Core</span>
            {activeWallet.coreAddress ? (
              <>
                <code
                  style={{
                    fontSize: 'var(--cfx-text-xs)',
                    color: 'var(--cfx-color-fg-default)',
                    flex: 1,
                    wordBreak: 'break-all',
                  }}
                >
                  {activeWallet.coreAddress}
                </code>
                <CopyButton label="copy" text={activeWallet.coreAddress} />
              </>
            ) : (
              <span style={{ color: 'var(--cfx-color-fg-muted)', fontSize: 'var(--cfx-text-xs)' }}>
                not yet derived
              </span>
            )}
          </div>
          <div style={addressRowStyle}>
            <span style={{ ...sectionLabelStyle, minWidth: '56px' }}>Path</span>
            <code style={{ fontSize: 'var(--cfx-text-xs)', color: 'var(--cfx-color-fg-subtle)' }}>
              {activeWallet.derivationPath}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DerivedAccountsList(
  props: Pick<
    ShowcaseWorkspacePanelsProps,
    'walletAccounts' | 'activeWallet' | 'accountsBusy' | 'accountActionIndex' | 'onActivateAccount'
  >,
) {
  if (props.walletAccounts.length === 0) {
    return props.activeWallet ? <div style={noteStyle}>Loading derived accounts…</div> : null;
  }

  return (
    <div>
      <div style={sectionLabelStyle}>Derived accounts</div>
      <div style={{ display: 'grid', gap: '10px', marginTop: '8px' }}>
        {props.walletAccounts.map((account) => (
          <div
            key={account.index}
            style={{
              ...cardStyle,
              ...(account.active
                ? { border: '1px solid #3b82f6', backgroundColor: 'rgba(59,130,246,0.04)' }
                : {}),
            }}
          >
            <div style={rowStyle}>
              <strong style={{ color: 'var(--cfx-color-fg-default)' }}>
                {props.activeWallet?.name ?? 'Account'} #{account.index}
              </strong>
              {account.active ? <StatusBadge label="active signer" status="ok" /> : null}
            </div>
            <div style={{ display: 'grid', gap: 'var(--cfx-space-2)' }}>
              <div style={addressRowStyle}>
                <span style={{ ...sectionLabelStyle, minWidth: '56px' }}>eSpace</span>
                <code
                  style={{
                    fontSize: 'var(--cfx-text-xs)',
                    color: 'var(--cfx-color-fg-default)',
                    flex: 1,
                    wordBreak: 'break-all',
                  }}
                >
                  {account.address}
                </code>
                <CopyButton label="copy" text={account.address} />
              </div>
              <div style={addressRowStyle}>
                <span style={{ ...sectionLabelStyle, minWidth: '56px' }}>Core</span>
                {account.coreAddress ? (
                  <>
                    <code
                      style={{
                        fontSize: 'var(--cfx-text-xs)',
                        color: 'var(--cfx-color-fg-default)',
                        flex: 1,
                        wordBreak: 'break-all',
                      }}
                    >
                      {account.coreAddress}
                    </code>
                    <CopyButton label="copy" text={account.coreAddress} />
                  </>
                ) : (
                  <span
                    style={{ color: 'var(--cfx-color-fg-muted)', fontSize: 'var(--cfx-text-xs)' }}
                  >
                    —
                  </span>
                )}
              </div>
            </div>
            {!account.active ? (
              <div style={buttonRowStyle}>
                <button
                  type="button"
                  disabled={props.accountsBusy !== null}
                  onClick={() => props.onActivateAccount(account)}
                >
                  {props.accountsBusy === 'activate' && props.accountActionIndex === account.index
                    ? 'Activating…'
                    : 'Activate as signer'}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
