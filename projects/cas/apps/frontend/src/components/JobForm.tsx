import type { CasJobType } from '@cfxdevkit/cas-shared';
import { Field } from './ui';

const DEFAULT_TOKEN_IN = '0x0000000000000000000000000000000000000002';
const DEFAULT_TOKEN_OUT = '0x0000000000000000000000000000000000000003';

export interface JobDraft {
  type: CasJobType;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  targetPrice: string;
  direction: 'gte' | 'lte';
  amountPerSwap: string;
  intervalSeconds: number;
  totalSwaps: number;
  trancheCount: number;
  trancheIntervalSeconds: number;
  nextExecution: number;
}

export function createInitialJobDraft(): JobDraft {
  return {
    type: 'swap',
    tokenIn: DEFAULT_TOKEN_IN,
    tokenOut: DEFAULT_TOKEN_OUT,
    amountIn: '1000000000000000000',
    minAmountOut: '900000000000000000',
    targetPrice: '2',
    direction: 'gte',
    amountPerSwap: '100000000000000000',
    intervalSeconds: 3600,
    totalSwaps: 10,
    trancheCount: 4,
    trancheIntervalSeconds: 900,
    nextExecution: Math.floor(Date.now() / 1000),
  };
}

export function JobForm({ draft, onChange }: JobFormProps) {
  const patch = (value: Partial<JobDraft>) => onChange({ ...draft, ...value });
  return (
    <div className="field-grid">
      <div className="field-row">
        <Field label="Type">
          <select
            className="select"
            value={draft.type}
            onChange={(event) => patch({ type: event.target.value as CasJobType })}
          >
            <option value="swap">Swap</option>
            <option value="limit_order">Limit order</option>
            <option value="dca">DCA</option>
            <option value="twap">TWAP</option>
          </select>
        </Field>
        <Field label="Direction">
          <select
            className="select"
            value={draft.direction}
            disabled={draft.type !== 'limit_order'}
            onChange={(event) => patch({ direction: event.target.value as 'gte' | 'lte' })}
          >
            <option value="gte">GTE</option>
            <option value="lte">LTE</option>
          </select>
        </Field>
      </div>
      <Field label="Token in">
        <input
          className="input mono"
          value={draft.tokenIn}
          onChange={(event) => patch({ tokenIn: event.target.value })}
        />
      </Field>
      <Field label="Token out">
        <input
          className="input mono"
          value={draft.tokenOut}
          onChange={(event) => patch({ tokenOut: event.target.value })}
        />
      </Field>
      <div className="field-row">
        <Field label={draft.type === 'dca' ? 'Amount per swap' : 'Amount in'}>
          <input
            className="input mono"
            value={draft.type === 'dca' ? draft.amountPerSwap : draft.amountIn}
            onChange={(event) =>
              draft.type === 'dca'
                ? patch({ amountPerSwap: event.target.value })
                : patch({ amountIn: event.target.value })
            }
          />
        </Field>
        <Field label="Min amount out">
          <input
            className="input mono"
            value={draft.minAmountOut}
            disabled={draft.type === 'dca'}
            onChange={(event) => patch({ minAmountOut: event.target.value })}
          />
        </Field>
      </div>
      {draft.type === 'limit_order' ? (
        <Field label="Target price">
          <input
            className="input mono"
            value={draft.targetPrice}
            onChange={(event) => patch({ targetPrice: event.target.value })}
          />
        </Field>
      ) : null}
      {draft.type === 'dca' || draft.type === 'twap' ? (
        <div className="field-row">
          <Field label={draft.type === 'dca' ? 'Interval seconds' : 'Tranche interval'}>
            <input
              className="input"
              type="number"
              min="1"
              value={draft.type === 'dca' ? draft.intervalSeconds : draft.trancheIntervalSeconds}
              onChange={(event) =>
                draft.type === 'dca'
                  ? patch({ intervalSeconds: Number(event.target.value) })
                  : patch({ trancheIntervalSeconds: Number(event.target.value) })
              }
            />
          </Field>
          <Field label={draft.type === 'dca' ? 'Total swaps' : 'Tranches'}>
            <input
              className="input"
              type="number"
              min="1"
              value={draft.type === 'dca' ? draft.totalSwaps : draft.trancheCount}
              onChange={(event) =>
                draft.type === 'dca'
                  ? patch({ totalSwaps: Number(event.target.value) })
                  : patch({ trancheCount: Number(event.target.value) })
              }
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}

export interface JobFormProps {
  draft: JobDraft;
  onChange: (draft: JobDraft) => void;
}

export function toCreateRequest(draft: JobDraft) {
  const base = {
    tokenIn: draft.tokenIn as `0x${string}`,
    tokenOut: draft.tokenOut as `0x${string}`,
  };
  if (draft.type === 'limit_order') {
    return {
      ...base,
      type: draft.type,
      amountIn: draft.amountIn,
      minAmountOut: draft.minAmountOut,
      targetPrice: draft.targetPrice,
      direction: draft.direction,
    } as const;
  }
  if (draft.type === 'dca') {
    return {
      ...base,
      type: draft.type,
      amountPerSwap: draft.amountPerSwap,
      intervalSeconds: draft.intervalSeconds,
      totalSwaps: draft.totalSwaps,
      nextExecution: draft.nextExecution,
    } as const;
  }
  if (draft.type === 'twap') {
    return {
      ...base,
      type: draft.type,
      amountIn: draft.amountIn,
      minAmountOut: draft.minAmountOut,
      trancheCount: draft.trancheCount,
      trancheIntervalSeconds: draft.trancheIntervalSeconds,
      nextExecution: draft.nextExecution,
    } as const;
  }
  return {
    ...base,
    type: draft.type,
    amountIn: draft.amountIn,
    minAmountOut: draft.minAmountOut,
  } as const;
}
