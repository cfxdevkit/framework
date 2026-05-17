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

export function SetupCard(props: ShowcaseWorkspacePanelsProps) {
  const phase = props.keystoreStatus?.phase;
  if (phase !== 'blank' && phase !== 'locked') return null;

  return (
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
          {phase === 'blank' ? 'Create keystore' : 'Keystore locked'}
        </h2>
        <p
          style={{
            color: 'var(--cfx-color-fg-subtle)',
            fontSize: 'var(--cfx-text-sm)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {phase === 'blank'
            ? 'Choose a passphrase to protect your wallet keys. You will need it to unlock the keystore in future sessions.'
            : 'Enter your passphrase to unlock the keystore and access your mnemonic wallets.'}
        </p>
      </div>

      {props.keystoreError ? <div style={errorStyle}>{props.keystoreError}</div> : null}

      <label style={stackStyle}>
        <span style={labelStyle}>Passphrase</span>
        <input
          type="password"
          style={inputStyle}
          placeholder={phase === 'blank' ? 'Choose a new passphrase' : 'Enter your passphrase'}
          value={props.passphrase}
          onChange={(e) => props.onSetPassphrase(e.target.value)}
        />
      </label>

      <div style={buttonRowStyle}>
        {phase === 'blank' ? (
          <button
            type="button"
            disabled={props.keystoreBusy !== null || !props.passphrase.trim()}
            onClick={props.onRunSetupKeystore}
          >
            {props.keystoreBusy === 'setup' ? 'Creating…' : 'Create keystore'}
          </button>
        ) : (
          <button
            type="button"
            disabled={props.keystoreBusy !== null || !props.passphrase.trim()}
            onClick={props.onRunUnlockKeystore}
          >
            {props.keystoreBusy === 'unlock' ? 'Unlocking…' : 'Unlock'}
          </button>
        )}
        <button
          type="button"
          disabled={props.keystoreBusy !== null}
          onClick={props.onRefreshKeystore}
        >
          {props.keystoreBusy === 'refresh' ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
