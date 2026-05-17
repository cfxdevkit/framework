'use client';

import { KEYSTORE_API_SNIPPET } from '../../../lib/showcase-guide';
import { buttonRowStyle, errorStyle } from '../../devnode/devnode-ui';
import { CollapsibleCodeExample, type ShowcaseWorkspacePanelsProps, sectionStyle } from '../shared';
import { ActiveWalletCard, DerivedAccountsList } from './active-wallet';
import { SetupCard } from './setup-card';
import { WalletsSection } from './wallets';

export function KeystorePanel(props: ShowcaseWorkspacePanelsProps) {
  const phase = props.keystoreStatus?.phase;
  const isUnlocked = phase === 'unlocked' || phase === 'active-wallet';

  return (
    <section
      id="keystore"
      style={props.activeSection === 'keystore' ? sectionStyle : { display: 'none' }}
    >
      <div style={{ padding: '24px', display: 'grid', gap: '20px' }}>
        {phase === undefined ? (
          <div
            style={{
              color: 'var(--cfx-color-fg-subtle)',
              fontSize: 'var(--cfx-text-sm)',
              padding: '24px 0',
            }}
          >
            Loading keystore status…
          </div>
        ) : null}

        {phase === 'blank' || phase === 'locked' ? <SetupCard {...props} /> : null}

        {isUnlocked ? (
          <>
            {/* Status bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--cfx-space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cfx-space-2)' }}>
                {props.keystoreBadge}
                <span
                  style={{ fontSize: 'var(--cfx-text-sm)', color: 'var(--cfx-color-fg-subtle)' }}
                >
                  {props.wallets.length} wallet{props.wallets.length !== 1 ? 's' : ''}
                  {phase === 'active-wallet' ? ' · signer ready' : ''}
                </span>
              </div>
              <div style={buttonRowStyle}>
                <button
                  type="button"
                  disabled={props.keystoreBusy !== null}
                  onClick={props.onRunLock}
                >
                  {props.keystoreBusy === 'lock' ? 'Locking…' : 'Lock'}
                </button>
                <button
                  type="button"
                  disabled={props.keystoreBusy !== null}
                  onClick={props.onRefreshKeystore}
                >
                  Refresh
                </button>
              </div>
            </div>

            {props.keystoreError ? <div style={errorStyle}>{props.keystoreError}</div> : null}

            <ActiveWalletCard activeWallet={props.activeWallet} wallets={props.wallets} />

            <DerivedAccountsList
              walletAccounts={props.walletAccounts}
              activeWallet={props.activeWallet}
              accountsBusy={props.accountsBusy}
              accountActionIndex={props.accountActionIndex}
              onActivateAccount={props.onActivateAccount}
            />

            <WalletsSection {...props} />

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
        ) : null}
      </div>
    </section>
  );
}
