import type { Address } from '@cfxdevkit/core/types';
import { useAccount } from '@cfxdevkit/react/account';
import { useTokenBalance } from '@cfxdevkit/react/balance';
import { type ReactNode, useState } from 'react';
import type { DexAdapter, TokenInfo } from '../types.js';
import { useSwap } from './useSwap.js';

export interface SwapWidgetProps {
  adapter: DexAdapter;
  /** Selectable tokens. If not provided the widget shows only a swap button. */
  tokens?: TokenInfo[];
  defaultTokenIn?: Address;
  defaultTokenOut?: Address;
  onSwapSubmitted?: (tx: { hash: `0x${string}` }) => void;
}

// ── Inline styles (uses CSS variables from @cfxdevkit/theme/css) ──────────

const cardStyle = {
  background: 'var(--cfx-color-bg-subtle)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-lg)',
  padding: 'var(--cfx-space-4)',
  display: 'grid',
  gap: 'var(--cfx-space-3)',
  fontFamily: 'var(--cfx-font-sans)',
  color: 'var(--cfx-color-fg-default)',
} as const;

const inputRowStyle = {
  display: 'flex',
  gap: 'var(--cfx-space-2)',
  alignItems: 'center',
} as const;

const amountInputStyle = {
  flex: 1,
  background: 'var(--cfx-color-bg-default)',
  border: '1px solid var(--cfx-color-border-subtle)',
  borderRadius: 'var(--cfx-radius-md)',
  padding: '8px 12px',
  fontFamily: 'var(--cfx-font-mono)',
  fontSize: 'var(--cfx-text-base)',
  color: 'var(--cfx-color-fg-default)',
  outline: 'none',
} as const;

const selectStyle = {
  background: 'var(--cfx-color-bg-default)',
  border: '1px solid var(--cfx-color-border-subtle)',
  borderRadius: 'var(--cfx-radius-md)',
  padding: '8px 12px',
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-fg-default)',
  cursor: 'pointer',
} as const;

const swapButtonStyle = {
  background: 'var(--cfx-color-brand-primary)',
  color: 'var(--cfx-color-fg-on-brand)',
  border: 'none',
  borderRadius: 'var(--cfx-radius-md)',
  padding: '10px 16px',
  fontFamily: 'var(--cfx-font-sans)',
  fontSize: 'var(--cfx-text-base)',
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
} as const;

const mutedTextStyle = {
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-fg-muted)',
} as const;

const errorTextStyle = {
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-feedback-danger)',
} as const;

/**
 * Headless-styled swap widget. Uses CSS variables from `@cfxdevkit/theme/css`.
 * Consumer is responsible for importing that CSS before rendering this component.
 */
export function SwapWidget({
  adapter,
  tokens = [],
  defaultTokenIn,
  defaultTokenOut,
  onSwapSubmitted,
}: SwapWidgetProps) {
  const [tokenIn, setTokenIn] = useState<Address | undefined>(defaultTokenIn ?? tokens[0]?.address);
  const [tokenOut, setTokenOut] = useState<Address | undefined>(
    defaultTokenOut ?? tokens[1]?.address,
  );
  const [rawAmount, setRawAmount] = useState('');

  const { address } = useAccount();

  // Parse amountIn as bigint (assume 18 decimals for simplicity; production adapters should handle this)
  const amountIn = (() => {
    const parsed = Number.parseFloat(rawAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0n;
    try {
      return BigInt(Math.floor(parsed * 1e18));
    } catch {
      return 0n;
    }
  })();

  const tokenInInfo = tokens.find((t) => t.address === tokenIn);
  const tokenOutInfo = tokens.find((t) => t.address === tokenOut);

  const { data: tokenInBalance } = useTokenBalance({
    token: tokenIn ?? ('0x' as Address),
    owner: address,
    enabled: !!tokenIn && !!address,
  });

  const { quote, isQuoting, quoteError, swapAsync, isSwapping, swapError } = useSwap({
    adapter,
    tokenIn: tokenIn ?? ('0x' as Address),
    tokenOut: tokenOut ?? ('0x' as Address),
    amountIn,
    enabled: !!tokenIn && !!tokenOut && amountIn > 0n,
  });

  const canSwap = !!quote && !isSwapping && !!address;

  const handleSwap = async () => {
    try {
      const tx = await swapAsync();
      onSwapSubmitted?.(tx);
    } catch {
      // error is surfaced via swapError
    }
  };

  const formatBalance = (bal: bigint, decimals = 18) => {
    const factor = 10 ** decimals;
    return (Number(bal) / factor).toFixed(4);
  };

  return (
    <div style={cardStyle}>
      {/* Token In */}
      <div>
        <div style={inputRowStyle}>
          <input
            type="number"
            placeholder="0.0"
            value={rawAmount}
            onChange={(e) => setRawAmount(e.target.value)}
            style={amountInputStyle}
          />
          {tokens.length > 0 && (
            <select
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value as Address)}
              style={selectStyle}
            >
              {tokens.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          )}
        </div>
        {tokenInBalance !== undefined && tokenInInfo && (
          <p style={mutedTextStyle}>
            Balance: {formatBalance(tokenInBalance, tokenInInfo.decimals)} {tokenInInfo.symbol}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div style={{ textAlign: 'center', color: 'var(--cfx-color-fg-muted)' }}>↓</div>

      {/* Token Out */}
      <div>
        <div style={inputRowStyle}>
          <span style={{ ...amountInputStyle, flex: 1, display: 'block', opacity: 0.7 }}>
            {quote ? formatBalance(quote.amountOut, tokenOutInfo?.decimals) : '—'}
          </span>
          {tokens.length > 0 && (
            <select
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value as Address)}
              style={selectStyle}
            >
              {tokens.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Quote info */}
      {isQuoting && <p style={mutedTextStyle}>Fetching quote…</p>}
      {quoteError && <p style={errorTextStyle}>Quote error: {quoteError.message}</p>}
      {quote && (
        <p style={mutedTextStyle}>Price impact: {(quote.priceImpactBps / 100).toFixed(2)}%</p>
      )}

      {/* Swap button */}
      <button
        type="button"
        disabled={!canSwap}
        onClick={handleSwap}
        style={{
          ...swapButtonStyle,
          opacity: canSwap ? 1 : 0.5,
          cursor: canSwap ? 'pointer' : 'not-allowed',
        }}
      >
        {isSwapping ? 'Swapping…' : !address ? 'Connect wallet' : 'Swap'}
      </button>

      {swapError && <p style={errorTextStyle}>{swapError.message}</p>}
    </div>
  );
}
