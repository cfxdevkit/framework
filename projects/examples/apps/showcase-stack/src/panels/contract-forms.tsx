import { errMsg } from '@cfxdevkit/example-showcase-ui';
import { useMemo, useState } from 'react';
import type { Abi, AbiFunction, Address, Hex } from 'viem';
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

export function parseFunctions(abi: Abi): { reads: AbiFunction[]; writes: AbiFunction[] } {
  const reads: AbiFunction[] = [];
  const writes: AbiFunction[] = [];
  for (const item of abi) {
    if (item.type !== 'function') continue;
    if (item.stateMutability === 'view' || item.stateMutability === 'pure') reads.push(item);
    else writes.push(item);
  }
  return { reads, writes };
}

interface ContractFormProps {
  fn: AbiFunction;
  address: Address;
  abi: Abi;
}

function coerceArg(type: string, raw: string): unknown {
  if (type.startsWith('uint') || type.startsWith('int')) {
    try {
      return BigInt(raw);
    } catch {
      return raw;
    }
  }
  if (type === 'bool') return raw === 'true' || raw === '1';
  return raw;
}

export function ReadForm({ fn, address, abi }: ContractFormProps) {
  const [args, setArgs] = useState<string[]>(() => (fn.inputs ?? []).map(() => ''));
  const [enabled, setEnabled] = useState(false);
  const [readArgs, setReadArgs] = useState<unknown[]>([]);
  const { data, error, isFetching, refetch } = useReadContract({
    address,
    abi,
    functionName: fn.name,
    args: readArgs,
    query: { enabled },
  });

  const call = () => {
    setReadArgs(args.map((arg, index) => coerceArg(fn.inputs[index]?.type ?? 'string', arg)));
    setEnabled(true);
    setTimeout(() => refetch(), 0);
  };

  const resultStr = useMemo(() => {
    if (data === undefined) return null;
    try {
      return JSON.stringify(data, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <div className="panel" style={{ marginBottom: 10 }}>
      <strong style={{ fontSize: 12 }}>{fn.name}</strong>
      {fn.inputs.length > 0 && <ArgInputs fn={fn} args={args} setArgs={setArgs} prefix="r" />}
      <div className="row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="primary"
          style={{ padding: '4px 10px', fontSize: 11 }}
          disabled={isFetching}
          onClick={call}
        >
          {isFetching ? '…' : 'Read'}
        </button>
      </div>
      {resultStr !== null && (
        <pre className="result" style={{ marginTop: 8, fontSize: 11 }}>
          {resultStr}
        </pre>
      )}
      {error && (
        <div style={{ color: 'var(--err)', fontSize: 11, marginTop: 6 }}>{error.message}</div>
      )}
    </div>
  );
}

export function WriteForm({ fn, address, abi }: ContractFormProps) {
  const [args, setArgs] = useState<string[]>(() => (fn.inputs ?? []).map(() => ''));
  const [valueWei, setValueWei] = useState('');
  const [hash, setHash] = useState<Hex | null>(null);
  const [writeErr, setWriteErr] = useState<string | null>(null);
  const { writeContractAsync, isPending } = useWriteContract();
  const { isFetching: awaitingReceipt, data: receipt } = useWaitForTransactionReceipt({
    hash: hash ?? undefined,
  });

  const call = async () => {
    setWriteErr(null);
    setHash(null);
    try {
      const coerced = args.map((arg, index) => coerceArg(fn.inputs[index]?.type ?? 'string', arg));
      const h = await writeContractAsync({
        address,
        abi,
        functionName: fn.name,
        args: coerced,
        value: valueWei.trim() ? BigInt(valueWei.trim()) : undefined,
      });
      setHash(h);
    } catch (e) {
      setWriteErr(errMsg(e));
    }
  };

  return (
    <div className="panel" style={{ marginBottom: 10 }}>
      <strong style={{ fontSize: 12 }}>{fn.name}</strong>
      {fn.inputs.length > 0 && <ArgInputs fn={fn} args={args} setArgs={setArgs} prefix="w" />}
      {fn.stateMutability === 'payable' && (
        <label style={{ marginTop: 8 }}>
          value (wei)
          <input value={valueWei} onChange={(e) => setValueWei(e.target.value)} placeholder="0" />
        </label>
      )}
      <div className="row" style={{ marginTop: 8 }}>
        <button
          type="button"
          className="secondary"
          style={{ padding: '4px 10px', fontSize: 11 }}
          disabled={isPending || awaitingReceipt}
          onClick={() => void call()}
        >
          {isPending ? 'Confirm in wallet…' : awaitingReceipt ? 'Mining…' : 'Write'}
        </button>
      </div>
      {hash && !receipt && (
        <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          tx: {hash}
        </div>
      )}
      {receipt && (
        <div className="result" style={{ color: 'var(--accent-2)', marginTop: 6, fontSize: 11 }}>
          mined in block {receipt.blockNumber.toString()} · status: {receipt.status}
        </div>
      )}
      {writeErr && (
        <div style={{ color: 'var(--err)', fontSize: 11, marginTop: 6 }}>{writeErr}</div>
      )}
    </div>
  );
}

function ArgInputs({
  fn,
  args,
  setArgs,
  prefix,
}: {
  fn: AbiFunction;
  args: string[];
  setArgs: (args: string[]) => void;
  prefix: string;
}) {
  return (
    <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
      {fn.inputs.map((inp, index) => (
        <label key={`${prefix}-${inp.name ?? inp.type}-${inp.type}`}>
          {inp.name ?? `arg${index}`}: {inp.type}
          <input
            value={args[index] ?? ''}
            onChange={(e) => {
              const next = [...args];
              next[index] = e.target.value;
              setArgs(next);
            }}
            placeholder={inp.type}
          />
        </label>
      ))}
    </div>
  );
}
