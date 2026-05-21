import type { Address } from '@cfxdevkit/cdk/types';
import type React from 'react';
import { useState } from 'react';
import type { PoolData } from '../pool/usePoolTokens.js';
import { Button, Input, MetricCard, SectionHeader, StatusBanner } from '../primitives/index.js';
import type { SwapService } from '../service/SwapService.js';

// ── PoolShareBadge ────────────────────────────────────────────────────────

export interface PoolShareBadgeProps {
  /** User's share of the pool after providing liquidity, 0–100. */
  sharePercent: number;
  style?: React.CSSProperties;
}

/**
 * Displays the user's estimated share of the pool after providing liquidity.
 */
export function PoolShareBadge({ sharePercent, style }: PoolShareBadgeProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        background: 'var(--cfx-color-bg-subtle)',
        border: '1px solid var(--cfx-color-border-default)',
        borderRadius: 999,
        fontSize: 'var(--cfx-text-sm)',
        color: 'var(--cfx-color-fg-muted)',
        ...style,
      }}
    >
      Pool share:
      <strong style={{ color: 'var(--cfx-color-fg-default)' }}>
        {sharePercent < 0.01 ? '<0.01' : sharePercent.toFixed(2)}%
      </strong>
    </div>
  );
}

// ── AddLiquidityWidget ────────────────────────────────────────────────────

export interface AddLiquidityWidgetProps {
  /** A configured SwapService instance for the target chain. */
  service: SwapService;
  /** Address of token A (or empty to let the user pick). */
  tokenA?: Address;
  /** Address of token B (or empty to let the user pick). */
  tokenB?: Address;
  /** Optional pool data pre-fetched by `usePoolTokens`. When provided,
   *  the price ratio is shown immediately without an extra read. */
  poolData?: PoolData;
  /** Called when the "Add Liquidity" button is clicked with the amounts. */
  onAddLiquidity?: (params: {
    tokenA: Address;
    tokenB: Address;
    amountA: bigint;
    amountB: bigint;
  }) => void | Promise<void>;
  style?: React.CSSProperties;
}

/**
 * Two-token input widget for providing liquidity to a Swappi V2 pair.
 *
 * Displays token inputs, price ratio, and the user's estimated pool share.
 * Calls `onAddLiquidity` with the computed bigint amounts when submitted.
 *
 * @example
 * ```tsx
 * <AddLiquidityWidget
 *   service={swapService}
 *   tokenA="0xTokenA"
 *   tokenB="0xWCFX"
 *   onAddLiquidity={({ amountA, amountB }) => addLiq(amountA, amountB)}
 * />
 * ```
 */
export function AddLiquidityWidget({
  service: _service,
  tokenA: initialTokenA,
  tokenB: initialTokenB,
  poolData,
  onAddLiquidity,
  style,
}: AddLiquidityWidgetProps) {
  const [tokenAAddr, setTokenAAddr] = useState<string>(initialTokenA ?? '');
  const [tokenBAddr, setTokenBAddr] = useState<string>(initialTokenB ?? '');
  const [amountAStr, setAmountAStr] = useState('');
  const [amountBStr, setAmountBStr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decimals = 18;

  const parseAmount = (str: string): bigint | null => {
    const trimmed = str.trim();
    if (!trimmed || Number.isNaN(Number(trimmed))) return null;
    try {
      const [whole = '0', frac = ''] = trimmed.split('.');
      const padded = frac.slice(0, decimals).padEnd(decimals, '0');
      return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded);
    } catch {
      return null;
    }
  };

  const amountA = parseAmount(amountAStr);
  const amountB = parseAmount(amountBStr);

  // Compute pool share estimate from existing reserves
  const sharePercent: number = (() => {
    if (!poolData || !amountA || amountA === 0n) return 0;
    const reserve = poolData.reserve0 > 0n ? poolData.reserve0 : 1n;
    const share = Number((amountA * 10_000n) / (reserve + amountA)) / 100;
    return Math.min(share, 100);
  })();

  // Auto-fill tokenB amount from price ratio when poolData is available
  const handleAmountAChange = (value: string) => {
    setAmountAStr(value);
    if (poolData && poolData.reserve0 > 0n && poolData.reserve1 > 0n) {
      const parsed = parseAmount(value);
      if (parsed && parsed > 0n) {
        const outRaw = (parsed * poolData.reserve1) / poolData.reserve0;
        const whole = outRaw / 10n ** BigInt(decimals);
        const frac = String(outRaw % 10n ** BigInt(decimals))
          .padStart(decimals, '0')
          .slice(0, 6);
        setAmountBStr(`${whole}.${frac}`);
      }
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!tokenAAddr || !tokenBAddr) {
      setError('Enter both token addresses.');
      return;
    }
    if (!amountA || !amountB || amountA === 0n || amountB === 0n) {
      setError('Enter valid amounts for both tokens.');
      return;
    }
    setSubmitting(true);
    try {
      await onAddLiquidity?.({
        tokenA: tokenAAddr as Address,
        tokenB: tokenBAddr as Address,
        amountA,
        amountB,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 20,
        background: 'var(--cfx-color-bg-default)',
        border: '1px solid var(--cfx-color-border-default)',
        borderRadius: 12,
        maxWidth: 440,
        ...style,
      }}
    >
      <SectionHeader title="Add Liquidity" subtitle="Provide tokens to earn trading fees" />

      <Input
        label="Token A address"
        placeholder="0x..."
        value={tokenAAddr}
        onChange={(e) => setTokenAAddr(e.target.value)}
      />
      <Input
        label="Token A amount"
        type="number"
        placeholder="0.0"
        min="0"
        value={amountAStr}
        onChange={(e) => handleAmountAChange(e.target.value)}
      />

      <Input
        label="Token B address"
        placeholder="0x..."
        value={tokenBAddr}
        onChange={(e) => setTokenBAddr(e.target.value)}
      />
      <Input
        label="Token B amount"
        type="number"
        placeholder="0.0"
        min="0"
        value={amountBStr}
        onChange={(e) => setAmountBStr(e.target.value)}
      />

      {poolData && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <MetricCard
            label="Token A per Token B"
            value={
              poolData.reserve1 > 0n
                ? (Number(poolData.reserve0) / Number(poolData.reserve1)).toFixed(6)
                : '–'
            }
          />
          <MetricCard
            label="Token B per Token A"
            value={
              poolData.reserve0 > 0n
                ? (Number(poolData.reserve1) / Number(poolData.reserve0)).toFixed(6)
                : '–'
            }
          />
        </div>
      )}

      {amountA !== null && amountA > 0n && <PoolShareBadge sharePercent={sharePercent} />}

      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      <Button
        variant="primary"
        loading={submitting}
        disabled={submitting || !amountAStr || !amountBStr}
        onClick={handleSubmit}
      >
        {submitting ? 'Adding…' : 'Add Liquidity'}
      </Button>
    </div>
  );
}
