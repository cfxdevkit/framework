/**
 * `@cfxdevkit/defi-react/primitives` — trade components.
 *
 * @internal Part of the primitives barrel. Import from
 * \`@cfxdevkit/defi-react/primitives\` rather than this file.
 */

import type { CSSProperties, ReactNode } from 'react';
import { SegmentedControl } from './form.js';
// ── TradeTokenField ───────────────────────────────────────────────────────

export interface TradeTokenFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  tokenSymbol?: string;
  tokenIcon?: ReactNode;
  onTokenClick?: () => void;
  balance?: string;
  disabled?: boolean;
  placeholder?: string;
  style?: CSSProperties;
}

/**
 * Token amount input with inline token picker trigger and optional balance display.
 *
 * @example
 * ```tsx
 * <TradeTokenField
 *   label="You pay"
 *   value={amountIn}
 *   onChange={setAmountIn}
 *   tokenSymbol="CFX"
 *   balance="100.00"
 *   onTokenClick={() => setPickerOpen(true)}
 * />
 * ```
 */
export function TradeTokenField({
  label,
  value,
  onChange,
  tokenSymbol,
  tokenIcon,
  onTokenClick,
  balance,
  disabled = false,
  placeholder = '0.0',
  style,
}: TradeTokenFieldProps) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid var(--cfx-color-border-default)',
        background: 'var(--cfx-color-bg-subtle)',
        padding: '12px 14px',
        ...style,
      }}
    >
      {(label || balance !== undefined) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: 'var(--cfx-text-xs, 11px)',
            color: 'var(--cfx-color-fg-muted)',
          }}
        >
          <span>{label}</span>
          {balance !== undefined && <span>Balance: {balance}</span>}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontSize: 'var(--cfx-text-xl, 24px)',
            fontWeight: 600,
            color: 'var(--cfx-color-fg-default)',
            minWidth: 0,
          }}
        />
        {tokenSymbol !== undefined && (
          <button
            type="button"
            onClick={onTokenClick}
            disabled={!onTokenClick || disabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 20,
              background: 'var(--cfx-color-bg-default)',
              border: '1px solid var(--cfx-color-border-default)',
              cursor: onTokenClick ? 'pointer' : 'default',
              color: 'var(--cfx-color-fg-default)',
              fontWeight: 600,
              fontSize: 'var(--cfx-text-sm)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tokenIcon}
            {tokenSymbol}
            {onTokenClick && <span style={{ fontSize: '0.7em' }}>▾</span>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── TradeActionBar ────────────────────────────────────────────────────────

export type TradeMode = 'swap' | 'provide';

export interface TradeActionBarProps {
  mode: TradeMode;
  onModeChange: (mode: TradeMode) => void;
  slippage: string;
  onSlippageChange: (value: string) => void;
  style?: CSSProperties;
}

/**
 * Swap / Provide toggle + slippage input row.
 *
 * @example
 * ```tsx
 * <TradeActionBar
 *   mode={mode}
 *   onModeChange={setMode}
 *   slippage={slippage}
 *   onSlippageChange={setSlippage}
 * />
 * ```
 */
export function TradeActionBar({
  mode,
  onModeChange,
  slippage,
  onSlippageChange,
  style,
}: TradeActionBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      <SegmentedControl<TradeMode>
        options={[
          { value: 'swap', label: 'Swap' },
          { value: 'provide', label: 'Provide' },
        ]}
        active={mode}
        onChange={onModeChange}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--cfx-text-sm)',
          color: 'var(--cfx-color-fg-muted)',
        }}
      >
        <span>Slippage:</span>
        <input
          type="text"
          inputMode="decimal"
          value={slippage}
          onChange={(e) => onSlippageChange(e.target.value)}
          style={{
            width: 52,
            padding: '3px 7px',
            borderRadius: 6,
            border: '1px solid var(--cfx-color-border-default)',
            background: 'var(--cfx-color-bg-subtle)',
            color: 'var(--cfx-color-fg-default)',
            fontSize: 'inherit',
            textAlign: 'right',
          }}
        />
        <span>%</span>
      </div>
    </div>
  );
}

// ── TradeSummaryGrid ──────────────────────────────────────────────────────

export interface TradeSummaryRow {
  label: string;
  value: string;
  muted?: boolean;
}

export interface TradeSummaryGridProps {
  rows: TradeSummaryRow[];
  style?: CSSProperties;
}

/**
 * Route + price impact + fees display grid for trade confirmation.
 *
 * @example
 * ```tsx
 * <TradeSummaryGrid
 *   rows={[
 *     { label: 'Price impact', value: '0.12%' },
 *     { label: 'Fee (0.3%)', value: '0.003 CFX' },
 *     { label: 'Minimum received', value: '9.97 USDT', muted: false },
 *   ]}
 * />
 * ```
 */
export function TradeSummaryGrid({ rows, style }: TradeSummaryGridProps) {
  if (rows.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '10px 14px',
        borderRadius: 8,
        background: 'var(--cfx-color-bg-subtle)',
        border: '1px solid var(--cfx-color-border-default)',
        fontSize: 'var(--cfx-text-sm)',
        ...style,
      }}
    >
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: row.muted ? 'var(--cfx-color-fg-muted)' : 'var(--cfx-color-fg-default)',
          }}
        >
          <span>{row.label}</span>
          <span style={{ fontWeight: 500 }}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
