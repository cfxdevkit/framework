'use client';

import {
  KeystoreAccountSwitcher,
  KeystoreIdentityStrip,
  KeystoreWalletSwitcher,
} from '@cfxdevkit/react/keystore';
import { useState } from 'react';
import { buttonRowStyle } from '../../devnode/devnode-ui';
import { cardStyle } from './styles';

interface KeystoreIdentityCardProps {
  onLock: () => void;
}

export function KeystoreIdentityCard({ onLock }: KeystoreIdentityCardProps) {
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  return (
    <div style={cardStyle}>
      <KeystoreIdentityStrip
        isWalletOpen={isWalletOpen}
        isAccountOpen={isAccountOpen}
        onWalletOpen={() => setIsWalletOpen(true)}
        onWalletClose={() => setIsWalletOpen(false)}
        onAccountOpen={() => setIsAccountOpen(true)}
        onAccountClose={() => setIsAccountOpen(false)}
        onLock={onLock}
        walletTriggerSlot={({ walletName, onClick }) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--cfx-space-2)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--cfx-text-sm)',
                fontWeight: 600,
                color: 'var(--cfx-color-fg-default)',
              }}
            >
              {walletName}
            </span>
            <div style={buttonRowStyle}>
              <button type="button" onClick={onClick}>
                Wallets ▾
              </button>
            </div>
          </div>
        )}
        accountTriggerSlot={({ accountIndex, onClick }) => (
          <button
            type="button"
            style={{ fontSize: 'var(--cfx-text-xs)', color: 'var(--cfx-color-fg-subtle)' }}
            onClick={onClick}
          >
            Account #{accountIndex} ▾
          </button>
        )}
        espaceSlot={(identity) => (
          <div style={{ display: 'grid', gap: 'var(--cfx-space-1)' }}>
            <span style={addressLabelStyle}>eSpace</span>
            <code style={addressCodeStyle}>{identity.espaceAddress}</code>
            <span style={pathStyle}>{identity.espaceDerivationPath}</span>
          </div>
        )}
        coreSlot={(identity) => (
          <div style={{ display: 'grid', gap: 'var(--cfx-space-1)' }}>
            <span style={addressLabelStyle}>Core</span>
            <code style={addressCodeStyle}>{identity.coreAddress}</code>
            <span style={pathStyle}>{identity.coreDerivationPath}</span>
          </div>
        )}
        walletSwitcherSlot={({ isOpen, onClose }) =>
          isOpen ? (
            <div style={dropdownStyle}>
              <KeystoreWalletSwitcher
                onClose={onClose}
                walletRowSlot={({ wallet, isActive, onActivate }) => (
                  <div key={wallet.id} style={walletRowStyle(isActive)}>
                    <span
                      style={{ fontSize: 'var(--cfx-text-sm)', fontWeight: isActive ? 600 : 400 }}
                    >
                      {wallet.name}
                    </span>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={onActivate}
                        style={{ fontSize: 'var(--cfx-text-xs)' }}
                      >
                        Activate
                      </button>
                    )}
                    {isActive && (
                      <span
                        style={{
                          fontSize: 'var(--cfx-text-xs)',
                          color: 'var(--cfx-color-accent-fg)',
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                )}
              />
              <div
                style={{
                  borderTop: '1px solid var(--cfx-color-border-muted)',
                  paddingTop: 'var(--cfx-space-3)',
                  marginTop: 'var(--cfx-space-2)',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{ fontSize: 'var(--cfx-text-xs)', color: 'var(--cfx-color-fg-subtle)' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : null
        }
        accountSwitcherSlot={({ isOpen, onClose }) =>
          isOpen ? (
            <div style={dropdownStyle}>
              <KeystoreAccountSwitcher
                onClose={onClose}
                accountRowSlot={({ account, isActive, onActivate }) => (
                  <div key={account.index} style={walletRowStyle(isActive)}>
                    <div style={{ display: 'grid', gap: 'var(--cfx-space-1)' }}>
                      <span
                        style={{ fontSize: 'var(--cfx-text-xs)', fontWeight: isActive ? 600 : 400 }}
                      >
                        #{account.index}
                        {isActive ? ' (active)' : ''}
                      </span>
                      <code style={addressCodeStyle}>{account.espaceAddress}</code>
                      <code style={addressCodeStyle}>{account.coreAddress}</code>
                    </div>
                    {!isActive && (
                      <button
                        type="button"
                        onClick={onActivate}
                        style={{ fontSize: 'var(--cfx-text-xs)' }}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                )}
              />
              <div
                style={{
                  borderTop: '1px solid var(--cfx-color-border-muted)',
                  paddingTop: 'var(--cfx-space-3)',
                  marginTop: 'var(--cfx-space-2)',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{ fontSize: 'var(--cfx-text-xs)', color: 'var(--cfx-color-fg-subtle)' }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const addressLabelStyle = {
  fontSize: 'var(--cfx-text-xs)',
  fontWeight: 600,
  color: 'var(--cfx-color-fg-subtle)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const addressCodeStyle = {
  fontFamily: 'var(--cfx-font-mono)',
  fontSize: 'var(--cfx-text-xs)',
  color: 'var(--cfx-color-fg-default)',
  wordBreak: 'break-all' as const,
};

const pathStyle = {
  fontFamily: 'var(--cfx-font-mono)',
  fontSize: 'var(--cfx-text-xs)',
  color: 'var(--cfx-color-fg-muted)',
};

const dropdownStyle = {
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  background: 'var(--cfx-color-bg-overlay)',
  padding: 'var(--cfx-space-3)',
  display: 'grid',
  gap: 'var(--cfx-space-2)',
  marginTop: 'var(--cfx-space-2)',
};

function walletRowStyle(isActive: boolean) {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cfx-space-2)',
    padding: 'var(--cfx-space-2) 0',
    background: isActive ? 'var(--cfx-color-accent-subtle)' : 'transparent',
    borderRadius: 'var(--cfx-radius-sm)',
  };
}
