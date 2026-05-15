/**
 * Sub-components and pure helpers for StrategyBuilder.
 * Extracted here to keep StrategyBuilder.tsx under the line-count limit.
 */

import type { CasHexAddress } from '@cfxdevkit/cas-shared';
import { AssetConversionPanel, TokenSelect } from '@cfxdevkit/ui';
import { CheckCircle2 } from 'lucide-react';
import { parseUnits } from 'viem';
import type { StrategyDraft, StrategyStep, TokenWithBalance } from '../lib/strategy';
import { tokenDecimals } from '../lib/strategy';

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
        <TokenSelect
          className="min-w-[180px]"
          selectClassName="select token-select"
          options={tokens}
          value={selectedToken}
          onChange={(token) => onTokenChange(token as CasHexAddress)}
        />
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
    <AssetConversionPanel
      title="CFX / WCFX"
      amount={wrapAmount}
      busy={busy}
      className="subpanel"
      fromAssetLabel="CFX"
      mode={wrapMode}
      onAmountChange={onAmountChange}
      onModeChange={onModeChange}
      onSubmit={onConvert}
      submitLabel={wrapMode === 'wrap' ? 'Convert CFX to WCFX' : 'Convert WCFX to CFX'}
      toAssetLabel="WCFX"
    />
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
