import { useCallback, useMemo, useState } from 'react';
import type { AbiFunction } from 'viem';
import {
  coerceAddressArgs,
  parseArgs,
  placeholderFor,
  stringifyResult,
} from './contract-interaction-helpers.js';

interface PendingResult {
  status: 'idle' | 'running' | 'ok' | 'err';
  output?: string;
  error?: string;
}

export interface FunctionRowProps {
  fn: AbiFunction;
  isCore: boolean;
  isWrite: boolean;
  run: (args: unknown[]) => Promise<unknown>;
  signerReady: boolean;
  disabled?: boolean | undefined;
  disabledReason?: string | undefined;
}

export function FunctionRow({
  fn,
  isCore,
  isWrite,
  run,
  signerReady,
  disabled,
  disabledReason,
}: FunctionRowProps) {
  const [argsRaw, setArgsRaw] = useState('');
  const [state, setState] = useState<PendingResult>({ status: 'idle' });
  const sig = useMemo(
    () =>
      `${fn.name}(${fn.inputs.map((input) => `${input.type}${input.name ? ` ${input.name}` : ''}`).join(', ')})`,
    [fn],
  );
  const isPayable = fn.stateMutability === 'payable';
  const buttonDisabled =
    state.status === 'running' || (isWrite && !signerReady) || Boolean(disabled);

  const onRun = useCallback(async () => {
    setState({ status: 'running' });
    const parsed = parseArgs(argsRaw, fn);
    if ('error' in parsed) {
      setState({ status: 'err', error: parsed.error });
      return;
    }
    try {
      const coerced = parsed.args.map((value, index) =>
        coerceAddressArgs(value, fn.inputs[index]?.type ?? 'unknown', isCore),
      );
      const result = await run(coerced);
      setState({
        status: 'ok',
        output: isWrite
          ? ((result as { hash?: string }).hash ?? stringifyResult(result))
          : stringifyResult(result),
      });
    } catch (error) {
      setState({ status: 'err', error: error instanceof Error ? error.message : String(error) });
    }
  }, [argsRaw, fn, isCore, isWrite, run]);

  return (
    <div
      className="card"
      style={{
        marginBottom: 8,
        padding: 10,
        borderLeft: `3px solid ${isWrite ? 'var(--err)' : 'var(--accent-2)'}`,
      }}
    >
      <div className="row" style={{ alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <strong style={{ flex: '0 0 auto' }}>{fn.name}</strong>
        {isPayable && (
          <span className="space-badge" title="payable" style={{ background: 'var(--err)' }}>
            payable
          </span>
        )}
        <code className="mono small" style={{ flex: '1 1 auto', color: 'var(--muted)' }}>
          {sig}
        </code>
        <button
          type="button"
          className={isWrite ? 'primary' : 'secondary'}
          onClick={onRun}
          disabled={buttonDisabled}
          title={disabled ? disabledReason : undefined}
        >
          {state.status === 'running' ? '...' : isWrite ? 'Send' : 'Call'}
        </button>
      </div>
      {fn.inputs.length > 0 && (
        <input
          type="text"
          value={argsRaw}
          onChange={(event) => setArgsRaw(event.target.value)}
          placeholder={placeholderFor(fn)}
          spellCheck={false}
          autoCapitalize="off"
          style={{ marginTop: 6, fontFamily: 'var(--mono, monospace)', fontSize: 12 }}
        />
      )}
      {state.status === 'ok' && state.output !== undefined && (
        <pre
          className="mono small"
          style={{
            marginTop: 6,
            padding: 6,
            background: 'var(--bg-soft, rgba(0,0,0,0.2))',
            borderRadius: 4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {state.output}
        </pre>
      )}
      {state.status === 'err' && state.error && (
        <p className="error" style={{ marginTop: 6, fontSize: 12 }}>
          {state.error}
        </p>
      )}
      {disabled && disabledReason && state.status === 'idle' && (
        <p className="muted small" style={{ marginTop: 4 }}>
          {disabledReason}
        </p>
      )}
      {!disabled && isWrite && !signerReady && state.status === 'idle' && (
        <p className="muted small" style={{ marginTop: 4 }}>
          Connect a wallet account to enable sending.
        </p>
      )}
    </div>
  );
}
