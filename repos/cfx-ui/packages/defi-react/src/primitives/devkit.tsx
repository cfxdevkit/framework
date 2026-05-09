/**
 * `@cfxdevkit/defi-react/primitives` — devkit components.
 *
 * @internal Part of the primitives barrel. Import from
 * \`@cfxdevkit/defi-react/primitives\` rather than this file.
 */

import { type CSSProperties, useState } from 'react';
import { Button, Card } from './core.js';
import { Input } from './form.js';
import { MetricCard, SectionHeader, StatusBanner } from './layout.js';
// ── FaucetWidget ──────────────────────────────────────────────────────────

export interface FaucetResult {
  txHash: string;
}

export interface FaucetWidgetProps {
  /** Called when user requests funds. Return the tx hash. */
  onFund: (address: string, amountWei: string) => Promise<FaucetResult>;
  /** Default recipient address */
  defaultAddress?: string;
  /** Default amount in CFX (decimal string) */
  defaultAmountCfx?: string;
  style?: CSSProperties;
}

/**
 * Faucet widget for devkit local networks. Accepts an `onFund` callback so it
 * stays decoupled from the HTTP client.
 *
 * @example
 * ```tsx
 * <FaucetWidget
 *   defaultAddress="0x..."
 *   onFund={async (address, amountWei) => {
 *     const res = await client.accounts.fund({ address, amount: amountWei });
 *     return { txHash: res.txHash };
 *   }}
 * />
 * ```
 */
export function FaucetWidget({
  onFund,
  defaultAddress = '',
  defaultAmountCfx = '10',
  style,
}: FaucetWidgetProps) {
  const [address, setAddress] = useState(defaultAddress);
  const [amount, setAmount] = useState(defaultAmountCfx);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleFund = async () => {
    setError(null);
    setTxHash(null);
    const trimmedAddress = address.trim();
    const amountNum = Number(amount);
    if (!trimmedAddress) {
      setError('Address is required.');
      return;
    }
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    const amountWei = String(BigInt(Math.floor(amountNum * 1e9)) * BigInt(1e9));
    setLoading(true);
    try {
      const result = await onFund(trimmedAddress, amountWei);
      setTxHash(result.txHash);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ padding: 16, ...style }}>
      <SectionHeader title="Faucet" subtitle="Fund an address on the local devnet" />
      <Input
        label="Recipient address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="0x..."
        disabled={loading}
        style={{ marginTop: 12 }}
      />
      <Input
        label="Amount (CFX)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="10"
        type="number"
        disabled={loading}
        style={{ marginTop: 8 }}
      />
      {error && (
        <StatusBanner variant="error" style={{ marginTop: 8 }}>
          {error}
        </StatusBanner>
      )}
      {txHash && (
        <StatusBanner variant="success" style={{ marginTop: 8 }}>
          Funded — tx: {txHash.slice(0, 18)}…
        </StatusBanner>
      )}
      <Button
        onClick={() => void handleFund()}
        loading={loading}
        disabled={loading}
        style={{ marginTop: 12, width: '100%' }}
      >
        Fund Address
      </Button>
    </Card>
  );
}

// ── DevkitStatus ──────────────────────────────────────────────────────────

export type DevkitNodeStatus = 'running' | 'stopped' | 'unknown';
export type DevkitKeystoreStatus = 'locked' | 'unlocked' | 'not-setup' | 'unknown';

export interface DevkitStatusProps {
  nodeStatus: DevkitNodeStatus;
  keystoreStatus: DevkitKeystoreStatus;
  walletCount?: number;
  blockNumber?: number;
  onStartNode?: () => void;
  onStopNode?: () => void;
  style?: CSSProperties;
}

const NODE_STATUS_COLORS: Record<DevkitNodeStatus, string> = {
  running: 'var(--cfx-color-feedback-success, #0a7c42)',
  stopped: 'var(--cfx-color-feedback-danger, #e53e3e)',
  unknown: 'var(--cfx-color-fg-muted)',
};

const KEYSTORE_STATUS_COLORS: Record<DevkitKeystoreStatus, string> = {
  unlocked: 'var(--cfx-color-feedback-success, #0a7c42)',
  locked: 'var(--cfx-color-feedback-warning, #b45309)',
  'not-setup': 'var(--cfx-color-fg-muted)',
  unknown: 'var(--cfx-color-fg-muted)',
};

/**
 * Composite panel showing devkit node + keystore health.
 *
 * @example
 * ```tsx
 * <DevkitStatus
 *   nodeStatus="running"
 *   keystoreStatus="unlocked"
 *   walletCount={2}
 *   blockNumber={42}
 *   onStopNode={() => client.node.stop()}
 * />
 * ```
 */
export function DevkitStatus({
  nodeStatus,
  keystoreStatus,
  walletCount,
  blockNumber,
  onStartNode,
  onStopNode,
  style,
}: DevkitStatusProps) {
  return (
    <Card style={{ padding: 16, ...style }}>
      <SectionHeader title="Devkit Status" />
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <MetricCard
          label="Node"
          value={nodeStatus}
          style={{ flex: 1, minWidth: 100 }}
          {...(blockNumber !== undefined ? { delta: `Block #${blockNumber}` } : {})}
        />
        <MetricCard
          label="Keystore"
          value={keystoreStatus}
          style={{ flex: 1, minWidth: 100 }}
          {...(walletCount !== undefined ? { delta: `${walletCount} wallet(s)` } : {})}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {nodeStatus !== 'running' && onStartNode && (
          <Button onClick={onStartNode} variant="primary" size="sm">
            Start Node
          </Button>
        )}
        {nodeStatus === 'running' && onStopNode && (
          <Button onClick={onStopNode} variant="secondary" size="sm">
            Stop Node
          </Button>
        )}
      </div>
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 16,
          fontSize: 'var(--cfx-text-xs, 11px)',
          color: 'var(--cfx-color-fg-muted)',
        }}
      >
        <span>
          Node:{' '}
          <span style={{ color: NODE_STATUS_COLORS[nodeStatus], fontWeight: 600 }}>
            {nodeStatus}
          </span>
        </span>
        <span>
          Keystore:{' '}
          <span style={{ color: KEYSTORE_STATUS_COLORS[keystoreStatus], fontWeight: 600 }}>
            {keystoreStatus}
          </span>
        </span>
      </div>
    </Card>
  );
}
