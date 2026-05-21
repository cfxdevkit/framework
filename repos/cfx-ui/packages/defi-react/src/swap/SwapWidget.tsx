import type { Address } from '@cfxdevkit/cdk/types';
import { useAccount } from '@cfxdevkit/react/account';
import { useNativeBalance, useTokenBalance } from '@cfxdevkit/react/balance';
import {
  CFX_NATIVE_ADDRESS,
  getPairedTokens,
  type PairLike,
  type TokenSelectionOptions,
} from '@cfxdevkit/ui-core';
import { useEffect, useMemo, useState } from 'react';
import { TokenPicker } from '../token-picker/TokenPicker.js';
import { createTokenRegistry, type DexAdapter, type TokenInfo } from '../types.js';
import {
  amountInputStyle,
  cardStyle,
  closeButtonStyle,
  errorTextStyle,
  inputRowStyle,
  invertButtonStyle,
  mutedTextStyle,
  pickerCardStyle,
  pickerHeaderStyle,
  pickerOverlayStyle,
  pickerTitleStyle,
  swapButtonStyle,
  tokenButtonStyle,
} from './SwapWidget.styles.js';
import { EMPTY_ADDRESS, formatAmount, parseAmountInput, sameAddress } from './SwapWidget.utils.js';
import { useSwap } from './useSwap.js';

export interface SwapWidgetProps {
  adapter: DexAdapter;
  /** Selectable tokens. If not provided the widget shows only a swap button. */
  tokens?: TokenInfo[];
  pairs?: readonly PairLike[];
  tokenSelectionOptions?: TokenSelectionOptions;
  defaultTokenIn?: Address;
  defaultTokenOut?: Address;
  onSwapSubmitted?: (tx: { hash: `0x${string}` }) => void;
}

function TokenPill({ token }: { token: TokenInfo | undefined }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--cfx-space-2)' }}>
      {token?.logoURI ? (
        <img
          src={token.logoURI}
          alt={token.symbol}
          width={20}
          height={20}
          style={{ borderRadius: '50%', flexShrink: 0 }}
          onError={(event) => {
            (event.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span style={{ fontSize: 'var(--cfx-text-xs)', color: 'var(--cfx-color-fg-muted)' }}>
          •
        </span>
      )}
      <span>{token?.symbol ?? 'Select token'}</span>
    </span>
  );
}

/**
 * Headless-styled swap widget. Uses CSS variables from `@cfxdevkit/theme/css`.
 * Consumer is responsible for importing that CSS before rendering this component.
 */
export function SwapWidget({
  adapter,
  tokens = [],
  pairs,
  tokenSelectionOptions,
  defaultTokenIn,
  defaultTokenOut,
  onSwapSubmitted,
}: SwapWidgetProps) {
  const [tokenIn, setTokenIn] = useState<Address | undefined>(defaultTokenIn ?? tokens[0]?.address);
  const [tokenOut, setTokenOut] = useState<Address | undefined>(
    defaultTokenOut ?? tokens[1]?.address,
  );
  const [rawAmount, setRawAmount] = useState('');
  const [activePicker, setActivePicker] = useState<'in' | 'out' | null>(null);

  const { address } = useAccount();

  const selectableOutputTokens = useMemo(
    () =>
      pairs && tokenIn ? getPairedTokens(pairs, tokens, tokenIn, tokenSelectionOptions) : tokens,
    [pairs, tokenIn, tokenSelectionOptions, tokens],
  );

  const pickerTokens = activePicker === 'out' ? selectableOutputTokens : tokens;
  const tokenRegistry = useMemo(() => createTokenRegistry(pickerTokens), [pickerTokens]);

  useEffect(() => {
    if (!selectableOutputTokens.length) return;

    const hasSelectedOutput = selectableOutputTokens.some((token) =>
      sameAddress(token.address as Address, tokenOut),
    );
    const fallbackOutput = selectableOutputTokens[0];

    if (!hasSelectedOutput && fallbackOutput) {
      setTokenOut(fallbackOutput.address as Address);
    }
  }, [selectableOutputTokens, tokenOut]);

  const tokenInInfo = tokens.find((t) => t.address === tokenIn);
  const tokenOutInfo = tokens.find((t) => t.address === tokenOut);
  const isNativeIn = sameAddress(tokenIn, CFX_NATIVE_ADDRESS as Address);
  const amountIn = parseAmountInput(rawAmount, tokenInInfo?.decimals ?? 18);

  const { data: nativeTokenInBalance } = useNativeBalance({
    address: address ?? undefined,
    enabled: isNativeIn && !!address,
  });

  const { data: erc20TokenInBalance } = useTokenBalance({
    token: tokenIn ?? EMPTY_ADDRESS,
    owner: address,
    enabled: !isNativeIn && !!tokenIn && !!address,
  });

  const tokenInBalance = isNativeIn ? nativeTokenInBalance : erc20TokenInBalance;

  const {
    quote,
    isQuoting,
    quoteError,
    approveAsync,
    needsApproval,
    isApproving,
    approvalError,
    swapAsync,
    isSwapping,
    swapError,
  } = useSwap({
    adapter,
    tokenIn: tokenIn ?? EMPTY_ADDRESS,
    tokenOut: tokenOut ?? EMPTY_ADDRESS,
    amountIn,
    enabled: !!tokenIn && !!tokenOut && !sameAddress(tokenIn, tokenOut) && amountIn > 0n,
  });

  const canSubmit = !!quote && !!address && !isApproving && !isSwapping;

  const selectToken = (side: 'in' | 'out', nextToken: TokenInfo) => {
    if (side === 'in') {
      if (sameAddress(nextToken.address, tokenOut)) {
        setTokenOut(tokenIn);
      }
      setTokenIn(nextToken.address);
    } else {
      if (sameAddress(nextToken.address, tokenIn)) {
        setTokenIn(tokenOut);
      }
      setTokenOut(nextToken.address);
    }

    setActivePicker(null);
  };

  const invertTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  const handlePrimaryAction = async () => {
    try {
      if (needsApproval) {
        await approveAsync();
        return;
      }

      const tx = await swapAsync();
      onSwapSubmitted?.(tx);
    } catch {
      // error is surfaced via hook state
    }
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
            <button type="button" onClick={() => setActivePicker('in')} style={tokenButtonStyle}>
              <TokenPill token={tokenInInfo} />
              <span style={{ color: 'var(--cfx-color-fg-muted)' }}>▾</span>
            </button>
          )}
        </div>
        {tokenInBalance !== undefined && tokenInInfo && (
          <p style={mutedTextStyle}>
            Balance: {formatAmount(tokenInBalance, tokenInInfo.decimals)} {tokenInInfo.symbol}
          </p>
        )}
      </div>

      <button type="button" onClick={invertTokens} style={invertButtonStyle}>
        ⇅
      </button>

      {/* Token Out */}
      <div>
        <div style={inputRowStyle}>
          <span style={{ ...amountInputStyle, flex: 1, display: 'block', opacity: 0.7 }}>
            {quote ? formatAmount(quote.amountOut, tokenOutInfo?.decimals ?? 18) : '—'}
          </span>
          {tokens.length > 0 && (
            <button type="button" onClick={() => setActivePicker('out')} style={tokenButtonStyle}>
              <TokenPill token={tokenOutInfo} />
              <span style={{ color: 'var(--cfx-color-fg-muted)' }}>▾</span>
            </button>
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
        disabled={!canSubmit}
        onClick={handlePrimaryAction}
        style={{
          ...swapButtonStyle,
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {!address
          ? 'Connect wallet'
          : isApproving
            ? 'Approving…'
            : needsApproval
              ? 'Approve'
              : isSwapping
                ? 'Swapping…'
                : 'Swap'}
      </button>

      {approvalError && <p style={errorTextStyle}>{approvalError.message}</p>}
      {swapError && <p style={errorTextStyle}>{swapError.message}</p>}

      {activePicker && (
        <div style={pickerOverlayStyle} role="dialog" aria-modal="true">
          <div style={pickerCardStyle}>
            <div style={pickerHeaderStyle}>
              <p style={pickerTitleStyle}>
                {activePicker === 'in' ? 'Select input token' : 'Select output token'}
              </p>
              <button type="button" onClick={() => setActivePicker(null)} style={closeButtonStyle}>
                Close
              </button>
            </div>
            <TokenPicker
              registry={tokenRegistry}
              chainId={pickerTokens[0]?.chainId ?? tokens[0]?.chainId ?? 1030}
              {...((activePicker === 'in' ? tokenIn : tokenOut)
                ? { selected: (activePicker === 'in' ? tokenIn : tokenOut) as Address }
                : {})}
              onSelect={(token) => selectToken(activePicker, token)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
