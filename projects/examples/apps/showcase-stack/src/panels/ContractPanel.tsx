/**
 * ContractPanel — ABI-driven read / write console.
 *
 * Enter a contract address + paste an ABI. The panel parses the ABI,
 * groups functions into read (pure/view) and write, and renders each as
 * a callable form. Read calls go through wagmi useReadContract; write calls
 * go through useWriteContract (eSpace wallet).
 */

import { errMsg, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useMemo, useState } from 'react';
import type { Abi, AbiFunction, Address, Hex } from 'viem';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

function parseFunctions(abi: Abi): { reads: AbiFunction[]; writes: AbiFunction[] } {
  const reads: AbiFunction[] = [];
  const writes: AbiFunction[] = [];
  for (const item of abi) {
    if (item.type !== 'function') continue;
    if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
      reads.push(item);
    } else {
      writes.push(item);
    }
  }
  return { reads, writes };
}

// ── Single read call ──────────────────────────────────────────────────

interface ReadFormProps {
  fn: AbiFunction;
  address: Address;
  abi: Abi;
}

function ReadForm({ fn, address, abi }: ReadFormProps) {
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
    const coerced = args.map((a, i) => {
      const t = fn.inputs[i]?.type ?? 'string';
      if (t.startsWith('uint') || t.startsWith('int')) {
        try {
          return BigInt(a);
        } catch {
          return a;
        }
      }
      if (t === 'bool') return a === 'true' || a === '1';
      return a;
    });
    setReadArgs(coerced);
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
      {fn.inputs.length > 0 && (
        <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          {fn.inputs.map((inp, i) => (
            <label key={`r-${inp.name ?? inp.type}-${inp.type}`}>
              {inp.name ?? `arg${i}`}: {inp.type}
              <input
                value={args[i] ?? ''}
                onChange={(e) => {
                  const next = [...args];
                  next[i] = e.target.value;
                  setArgs(next);
                  setEnabled(false);
                }}
                placeholder={inp.type}
              />
            </label>
          ))}
        </div>
      )}
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

// ── Single write call ──────────────────────────────────────────────────

interface WriteFormProps {
  fn: AbiFunction;
  address: Address;
  abi: Abi;
}

function WriteForm({ fn, address, abi }: WriteFormProps) {
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
      const coerced = args.map((a, i) => {
        const t = fn.inputs[i]?.type ?? 'string';
        if (t.startsWith('uint') || t.startsWith('int')) {
          try {
            return BigInt(a);
          } catch {
            return a;
          }
        }
        if (t === 'bool') return a === 'true' || a === '1';
        return a;
      });
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
      {fn.inputs.length > 0 && (
        <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
          {fn.inputs.map((inp, i) => (
            <label key={`w-${inp.name ?? inp.type}-${inp.type}`}>
              {inp.name ?? `arg${i}`}: {inp.type}
              <input
                value={args[i] ?? ''}
                onChange={(e) => {
                  const next = [...args];
                  next[i] = e.target.value;
                  setArgs(next);
                }}
                placeholder={inp.type}
              />
            </label>
          ))}
        </div>
      )}
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

// ── Main panel ─────────────────────────────────────────────────────────

export function ContractPanel() {
  const { isConnected } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [abiText, setAbiText] = useState('');
  const [parsedAbi, setParsedAbi] = useState<Abi | null>(null);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<'read' | 'write'>('read');

  const parseAbi = useCallback(() => {
    setParseErr(null);
    try {
      const parsed = JSON.parse(abiText) as Abi;
      if (!Array.isArray(parsed)) throw new Error('ABI must be an array');
      setParsedAbi(parsed);
    } catch (e) {
      setParseErr(errMsg(e));
    }
  }, [abiText]);

  const { reads, writes } = useMemo(
    () => (parsedAbi ? parseFunctions(parsedAbi) : { reads: [], writes: [] }),
    [parsedAbi],
  );

  const isValidAddress = contractAddress.startsWith('0x') && contractAddress.length === 42;

  return (
    <div>
      {/* Wallet status */}
      {!isConnected && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <p className="muted" style={{ margin: '0 0 10px' }}>
            Connect an eSpace wallet to send write transactions.
          </p>
          <button type="button" className="primary" onClick={() => setPickerOpen(true)}>
            Connect eSpace Wallet
          </button>
          <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
        </div>
      )}

      {/* Contract address */}
      <label style={{ marginBottom: 16 }}>
        Contract address (0x…)
        <input
          value={contractAddress}
          onChange={(e) => {
            setContractAddress(e.target.value);
            setParsedAbi(null);
          }}
          placeholder="0x..."
          style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
        />
      </label>

      {/* ABI input */}
      <label style={{ marginBottom: 8 }}>
        ABI (JSON array)
        <textarea
          rows={8}
          value={abiText}
          onChange={(e) => {
            setAbiText(e.target.value);
            setParsedAbi(null);
          }}
          placeholder='[{"type":"function","name":"...","inputs":[],...}]'
          style={{ fontFamily: 'var(--mono)', fontSize: 11 }}
        />
      </label>
      <div className="row" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="primary"
          disabled={!abiText.trim() || !isValidAddress}
          onClick={parseAbi}
        >
          Load ABI
        </button>
        {parsedAbi && (
          <span className="muted" style={{ fontSize: 12 }}>
            {reads.length} read · {writes.length} write
          </span>
        )}
      </div>
      {parseErr && (
        <div className="result" style={{ color: 'var(--err)', marginBottom: 12 }}>
          {parseErr}
        </div>
      )}

      {/* Functions */}
      {parsedAbi && isValidAddress && (
        <>
          <div className="seg" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={tab === 'read' ? 'seg-item active' : 'seg-item'}
              onClick={() => setTab('read')}
            >
              Read ({reads.length})
            </button>
            <button
              type="button"
              className={tab === 'write' ? 'seg-item active' : 'seg-item'}
              onClick={() => setTab('write')}
            >
              Write ({writes.length})
            </button>
          </div>

          {tab === 'read' &&
            reads.map((fn) => (
              <ReadForm
                key={fn.name}
                fn={fn}
                address={contractAddress as Address}
                abi={parsedAbi}
              />
            ))}

          {tab === 'write' && !isConnected && (
            <div className="warning">Connect an eSpace wallet to send write transactions.</div>
          )}
          {tab === 'write' &&
            writes.map((fn) => (
              <WriteForm
                key={fn.name}
                fn={fn}
                address={contractAddress as Address}
                abi={parsedAbi}
              />
            ))}
        </>
      )}
    </div>
  );
}
