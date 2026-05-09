/**
 * Sub-components and pure helpers for StrategyBuilder.
 * Extracted here to keep StrategyBuilder.tsx under the line-count limit.
 */

import type { CasHexAddress } from '@cfxdevkit/cas-shared';
import { CheckCircle2 } from 'lucide-react';
import { parseUnits } from 'viem';
import type { StrategyDraft, StrategyStep, TokenWithBalance } from '../lib/strategy';
import { tokenDecimals } from '../lib/strategy';
import { Field } from './ui';

// ── TokenAmountPanel ──────────────────────────────────────────────────────────

export interface TokenAmountPanelProps {
  label: string;
  tokens: TokenWithBalance[];
  selectedToken: CasHexAddress;
  amount: string;
  onTokenChange: (token: CasHexAddress) => void;
  onAmountChange: (amount: string) => void;
  readOnlyAmount?: boolean;
  loading?: boolean;
}

export function TokenAmountPanel({
  label,
  tokens,
  selectedToken,
  amount,
  onTokenChange,
  onAmountChange,
  readOnlyAmount = false,
  loading = false,
}: TokenAmountPanelProps) {
  const selected = tokens.find((t) => t.address === selectedToken);
  const balanceLabel = loading
    ? 'loading…'
    : selected?.balanceFormatted
      ? `${Number(selected.balanceFormatted).toLocaleString(undefined, {
          maximumFractionDigits: 6,
        })} ${selected.symbol}`
      : 'balance n/a';

  return (
    <div className="token-panel">
      <div className="token-panel-top">
        <span>{label}</span>
        <span>{balanceLabel}</span>
      </div>
      <div className="token-panel-main">
        <input
          className="amount-input"
          value={amount}
          readOnly={readOnlyAmount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.0"
        />
        <select
          className="select token-select"
          value={selectedToken}
          onChange={(e) => onTokenChange(e.target.value as CasHexAddress)}
        >
          {tokens.map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol}
            </option>
          ))}
        </select>
      </div>
      <div className="mono token-address">{selectedToken}</div>
    </div>
  );
}

// ── StepList ──────────────────────────────────────────────────────────────────

export function StepList({ steps }: { steps: StrategyStep[] }) {
  return (
    <div className="steps">
      {steps.map((step) => (
        <div className={`step ${step.status}`} key={step.id}>
          <CheckCircle2 size={16} />
          <div>
            <strong>{step.label}</strong>
            <span>{step.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── WcfxConvertPanel (inline wrap/unwrap) ─────────────────────────────────────

export interface WcfxConvertPanelProps {
  wrapMode: 'wrap' | 'unwrap';
  wrapAmount: string;
  busy: boolean;
  onModeChange: (mode: 'wrap' | 'unwrap') => void;
  onAmountChange: (v: string) => void;
  onConvert: () => void;
}

export function WcfxConvertPanel({
  wrapMode,
  wrapAmount,
  busy,
  onModeChange,
  onAmountChange,
  onConvert,
}: WcfxConvertPanelProps) {
  return (
    <div className="subpanel">
      <div className="subpanel-header">
        <strong>CFX / WCFX</strong>
      </div>
      <div className="segmented">
        <button
          className={wrapMode === 'wrap' ? 'active' : ''}
          type="button"
          onClick={() => onModeChange('wrap')}
        >
          Wrap
        </button>
        <button
          className={wrapMode === 'unwrap' ? 'active' : ''}
          type="button"
          onClick={() => onModeChange('unwrap')}
        >
          Unwrap
        </button>
      </div>
      <div className="field-row">
        <Field label="Amount">
          <input
            className="input"
            value={wrapAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.0"
          />
        </Field>
        <button className="button" type="button" onClick={onConvert} disabled={busy}>
          Convert
        </button>
      </div>
    </div>
  );
}

// ── Estimated output helper ───────────────────────────────────────────────────

export function estimatedOutputLabel(draft: StrategyDraft, tokenIn?: TokenWithBalance): string {
  try {
    if (!draft.amountIn || !draft.targetPrice) return '';
    const dec = tokenDecimals(tokenIn);
    const amtIn = parseUnits(draft.amountIn, dec);
    const target = parseUnits(draft.targetPrice, 18);
    const out = (amtIn * target) / 10n ** 18n;
    return (Number(out) / 10 ** dec).toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  } catch {
    return '';
  }
}
