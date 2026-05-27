import { StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { BUTTON_STYLE, MUTED_STYLE } from './panel-styles';

interface OneKeyConnectionStatusProps {
  webUsbSupported: boolean | null;
  walletReady: boolean;
  device: { label: string; firmware: string } | null;
  busy: string;
  onConnect: () => void;
  onDeriveAddresses: () => void;
  evmPath: string;
  corePath: string;
}

export function OneKeyConnectionStatus({
  webUsbSupported,
  walletReady,
  device,
  busy,
  onConnect,
  onDeriveAddresses,
  evmPath,
  corePath,
}: OneKeyConnectionStatusProps) {
  return (
    <>
      <StatusBadge
        status={webUsbSupported === false ? 'error' : walletReady ? 'ok' : 'pending'}
        label={
          webUsbSupported === null
            ? 'Checking WebUSB'
            : webUsbSupported === false
              ? 'WebUSB unavailable (use Chrome/Edge)'
              : walletReady
                ? 'OneKey ready — both spaces connected'
                : device
                  ? `${device.label} fw ${device.firmware}`
                  : 'WebUSB ready'
        }
      />
      <p style={MUTED_STYLE}>
        eSpace {evmPath} · Core {corePath} · EIP-712 ✅ · CIP-23 ✅
      </p>

      <button
        type="button"
        onClick={onConnect}
        disabled={!webUsbSupported || busy !== ''}
        style={{
          ...BUTTON_STYLE,
          cursor: !webUsbSupported || busy !== '' ? 'not-allowed' : 'pointer',
        }}
      >
        {busy === 'connecting'
          ? 'Searching...'
          : device
            ? `Reconnect (${device.label})`
            : 'Connect OneKey'}
      </button>

      {device && (
        <div
          style={{
            display: 'grid',
            gap: 'var(--cfx-space-2)',
            padding: 'var(--cfx-space-3)',
            background: 'var(--cfx-color-bg-emphasis)',
            borderRadius: 'var(--cfx-radius-md)',
            border: '1px solid var(--cfx-color-border-default)',
          }}
        >
          <p style={{ ...MUTED_STYLE, fontWeight: 600, color: 'var(--cfx-color-fg-default)' }}>
            📱 {device.label} · fw {device.firmware}
          </p>
          <button
            type="button"
            onClick={onDeriveAddresses}
            disabled={busy !== ''}
            style={{ ...BUTTON_STYLE, cursor: busy !== '' ? 'not-allowed' : 'pointer' }}
          >
            {busy === 'addresses' ? 'Deriving...' : 'Derive addresses (eSpace + Core)'}
          </button>
        </div>
      )}
    </>
  );
}
