'use client';

import type { CasJobDto } from '@cfxdevkit/cas-shared';
import { Field, IconButton, Notice, Panel, PanelBody } from '@cfxdevkit/ui';
import { ArrowDownUp, RefreshCw, Zap } from 'lucide-react';
import { useStrategyBuilder } from '../hooks/use-strategy-builder';
import { pairedTokens } from '../lib/strategy';
import {
  estimatedOutputLabel,
  StepList,
  TokenAmountPanel,
  WcfxConvertPanel,
} from './StrategyBuilderParts';

export interface StrategyBuilderProps {
  jobs: CasJobDto[];
  onJobCreated: (job: CasJobDto) => void;
}

export function StrategyBuilder({ jobs, onJobCreated }: StrategyBuilderProps) {
  const {
    draft,
    steps,
    message,
    error,
    busy,
    wrapMode,
    wrapAmount,
    tokens,
    pairs,
    tokenOutOptions,
    tokenIn,
    autoWrapShortfall,
    poolsError,
    poolsLoading,
    balancesLoading,
    contracts,
    account,
    token,
    patch,
    setWrapMode,
    setWrapAmount,
    refresh,
    createStrategy,
    convertWcfx,
  } = useStrategyBuilder(jobs, onJobCreated);

  const statusMsg = error ? null : message || (poolsLoading ? 'Loading pools…' : null);
  const estimatedOut = estimatedOutputLabel(draft, tokenIn);

  return (
    <Panel
      title="Strategy Builder"
      actions={
        <IconButton title="Refresh pools" onClick={refresh} disabled={busy || poolsLoading}>
          <RefreshCw size={17} />
        </IconButton>
      }
    >
      <PanelBody>
        {poolsError && <Notice tone="error">{poolsError}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        {statusMsg && <Notice tone="ok">{statusMsg}</Notice>}

        <div className="segmented">
          <button
            className={draft.kind === 'limit_order' ? 'active' : ''}
            type="button"
            onClick={() => patch({ kind: 'limit_order' })}
          >
            Limit
          </button>
          <button
            className={draft.kind === 'dca' ? 'active' : ''}
            type="button"
            onClick={() => patch({ kind: 'dca' })}
          >
            DCA
          </button>
        </div>

        <div className="strategy-grid">
          <TokenAmountPanel
            label={draft.kind === 'dca' ? 'Amount per swap' : 'Sell'}
            tokens={tokens}
            selectedToken={draft.tokenIn}
            amount={draft.kind === 'dca' ? draft.amountPerSwap : draft.amountIn}
            loading={balancesLoading}
            onTokenChange={(tIn) => {
              const nextOut =
                pairs.length > 0
                  ? (pairedTokens(
                      { tokens, pairs } as Parameters<typeof pairedTokens>[0],
                      tokens,
                      tIn,
                      contracts.wcfxAddress,
                    )[0]?.address ?? draft.tokenOut)
                  : draft.tokenOut;
              patch({ tokenIn: tIn, ...(nextOut ? { tokenOut: nextOut } : {}) });
            }}
            onAmountChange={(amount) =>
              draft.kind === 'dca' ? patch({ amountPerSwap: amount }) : patch({ amountIn: amount })
            }
          />
          <div className="swap-separator">
            <ArrowDownUp size={18} />
          </div>
          <TokenAmountPanel
            label={draft.kind === 'limit_order' ? 'Receive when target hits' : 'Buy'}
            tokens={tokenOutOptions}
            selectedToken={draft.tokenOut}
            amount={draft.kind === 'limit_order' ? estimatedOut : ''}
            onTokenChange={(tOut) => patch({ tokenOut: tOut })}
            onAmountChange={() => undefined}
            readOnlyAmount
          />
        </div>

        {draft.kind === 'limit_order' ? (
          <div className="field-row">
            <Field className="field" label="Target price">
              <input
                className="input"
                value={draft.targetPrice}
                onChange={(e) => patch({ targetPrice: e.target.value })}
                placeholder="1 token in = token out"
              />
            </Field>
            <Field className="field" label="Trigger">
              <select
                className="select"
                value={draft.direction}
                onChange={(e) => patch({ direction: e.target.value as 'gte' | 'lte' })}
              >
                <option value="gte">Price greater than or equal</option>
                <option value="lte">Price less than or equal</option>
              </select>
            </Field>
          </div>
        ) : (
          <div className="field-row">
            <Field className="field" label="Interval seconds">
              <input
                className="input"
                type="number"
                min="60"
                value={draft.intervalSeconds}
                onChange={(e) => patch({ intervalSeconds: Number(e.target.value) })}
              />
            </Field>
            <Field className="field" label="Total swaps">
              <input
                className="input"
                type="number"
                min="1"
                value={draft.totalSwaps}
                onChange={(e) => patch({ totalSwaps: Number(e.target.value) })}
              />
            </Field>
          </div>
        )}

        <div className="field-row">
          <Field className="field" label="Slippage bps">
            <input
              className="input"
              type="number"
              min="0"
              max="500"
              value={draft.slippageBps}
              onChange={(e) => patch({ slippageBps: Number(e.target.value) })}
            />
          </Field>
          <Field className="field" label="Expiry days">
            <input
              className="input"
              type="number"
              min="0"
              value={draft.expiryDays}
              onChange={(e) => patch({ expiryDays: Number(e.target.value) })}
            />
          </Field>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={draft.unlimitedApproval}
            onChange={(e) => patch({ unlimitedApproval: e.target.checked })}
          />
          <span>Use unlimited approval for this token</span>
        </label>

        {autoWrapShortfall > 0n && (
          <Notice>Creating this strategy will wrap CFX to WCFX automatically.</Notice>
        )}

        {steps && <StepList steps={steps} />}

        <button
          className="button primary"
          type="button"
          onClick={() => void createStrategy()}
          disabled={busy || !account || !token}
        >
          <Zap size={17} />
          Create on-chain strategy
        </button>

        <WcfxConvertPanel
          wrapMode={wrapMode}
          wrapAmount={wrapAmount}
          busy={busy || !account}
          onModeChange={setWrapMode}
          onAmountChange={setWrapAmount}
          onConvert={() => void convertWcfx()}
        />
      </PanelBody>
    </Panel>
  );
}
