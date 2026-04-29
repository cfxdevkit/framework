/**
 * ContractPanel — exercises `@cfxdevkit/contracts/erc20` against a
 * user-provided ERC-20 address on the selected eSpace chain.
 *
 * Reads (`name/symbol/decimals/totalSupply/balanceOf`) require no signer.
 * Transfer requires a connected wallet (`useWallet().signer`).
 */

import { erc20 } from '@cfxdevkit/contracts/erc20';
import {
  type ChainConfig,
  createClient,
  formatUnits,
  http,
  listChains,
  parseUnits,
} from '@cfxdevkit/core';
import { useCallback, useMemo, useState } from 'react';
import { useWallet } from '../contexts/WalletProvider.js';

interface Metadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}

export function ContractPanel() {
  const { active, signer } = useWallet();
  const espaceChains = useMemo(() => listChains().filter((c) => c.family === 'espace'), []);
  const [chainName, setChainName] = useState<string>(espaceChains[0]?.name ?? 'espace-testnet');
  const [address, setAddress] = useState<string>('');
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [transferTo, setTransferTo] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txErr, setTxErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const chain: ChainConfig | undefined = useMemo(
    () => espaceChains.find((c) => c.name === chainName),
    [espaceChains, chainName],
  );

  const fetchMetadata = useCallback(async () => {
    if (!chain || !isHexAddress(address)) {
      setErr('Enter a valid 0x ERC-20 address.');
      return;
    }
    setLoading(true);
    setErr(null);
    setMeta(null);
    setBalance(null);
    try {
      const client = createClient({ chain, transport: http({ timeoutMs: 10_000 }) });
      const bind = { client, address: address as `0x${string}` };
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        erc20.name(bind),
        erc20.symbol(bind),
        erc20.decimals(bind),
        erc20.totalSupply(bind),
      ]);
      setMeta({ name, symbol, decimals, totalSupply });
      if (active?.evmAddress) {
        const b = await erc20.balanceOf(bind, active.evmAddress);
        setBalance(b);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [chain, address, active]);

  const sendTransfer = useCallback(async () => {
    if (!chain || !signer || !meta || !isHexAddress(address) || !isHexAddress(transferTo)) {
      setTxErr('Connect a wallet, fetch metadata, and enter a valid recipient.');
      return;
    }
    let amount: bigint;
    try {
      amount = parseUnits(transferAmount, meta.decimals);
    } catch {
      setTxErr(`Amount must be a number with at most ${meta.decimals} decimals.`);
      return;
    }
    setSending(true);
    setTxErr(null);
    setTxHash(null);
    try {
      const client = createClient({ chain, transport: http({ timeoutMs: 10_000 }) });
      const result = await erc20.transfer(
        { client, address: address as `0x${string}`, signer },
        transferTo as `0x${string}`,
        amount,
      );
      setTxHash(result.hash);
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }, [chain, signer, meta, address, transferTo, transferAmount]);

  return (
    <section className="panel">
      <h2>ERC-20 contract</h2>
      <p className="panel-desc">
        Drives <code className="mono">@cfxdevkit/contracts/erc20</code> against a user-supplied
        token address. Reads use{' '}
        <code className="mono">erc20.name/symbol/decimals/totalSupply/balanceOf</code>; the transfer
        button uses <code className="mono">erc20.transfer</code> with the active wallet's signer.
        eSpace only in this revision.
      </p>

      <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
        <label style={{ flex: '0 0 240px' }}>
          <span>Chain</span>
          <select value={chainName} onChange={(e) => setChainName(e.target.value)}>
            {espaceChains.map((c) => (
              <option key={c.name} value={c.name}>
                {c.displayName} ({c.id})
              </option>
            ))}
          </select>
        </label>
        <label style={{ flex: 1 }}>
          <span>ERC-20 address</span>
          <input
            type="text"
            placeholder="0x…"
            value={address}
            onChange={(e) => setAddress(e.target.value.trim())}
            spellCheck={false}
            autoCapitalize="off"
          />
        </label>
        <button
          type="button"
          className="primary"
          onClick={fetchMetadata}
          disabled={loading || !address}
        >
          {loading ? 'Reading…' : 'Read metadata'}
        </button>
      </div>

      {err && <p className="error">{err}</p>}

      {meta && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>
            {meta.name} <span className="muted">({meta.symbol})</span>
          </h3>
          <dl className="kv">
            <dt>decimals</dt>
            <dd>{meta.decimals}</dd>
            <dt>totalSupply</dt>
            <dd>
              {formatUnits(meta.totalSupply, meta.decimals)} {meta.symbol}
            </dd>
            {balance !== null && active && (
              <>
                <dt>your balance</dt>
                <dd>
                  {formatUnits(balance, meta.decimals)} {meta.symbol}
                  <div className="muted" style={{ fontSize: 11 }}>
                    ({active.evmAddress})
                  </div>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {meta && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Transfer</h3>
          {!signer && (
            <p className="muted">
              Connect a wallet on the <strong>Wallet</strong> tab to enable transfers.
            </p>
          )}
          <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
            <label style={{ flex: 1 }}>
              <span>To</span>
              <input
                type="text"
                placeholder="0x…"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value.trim())}
                spellCheck={false}
                autoCapitalize="off"
              />
            </label>
            <label style={{ flex: '0 0 180px' }}>
              <span>Amount ({meta.symbol})</span>
              <input
                type="text"
                placeholder="0.0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value.trim())}
                spellCheck={false}
              />
            </label>
            <button
              type="button"
              className="primary"
              onClick={sendTransfer}
              disabled={sending || !signer || !transferTo || !transferAmount}
            >
              {sending ? 'Sending…' : 'Transfer'}
            </button>
          </div>
          {txErr && <p className="error">{txErr}</p>}
          {txHash && (
            <p className="muted" style={{ wordBreak: 'break-all' }}>
              Tx hash: <code className="mono">{txHash}</code>
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function isHexAddress(s: string): s is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(s);
}
