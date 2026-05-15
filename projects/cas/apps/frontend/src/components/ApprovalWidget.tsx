'use client';

import { type CasJobDto, ERC20_ABI, MAX_UINT256 } from '@cfxdevkit/cas-shared';
import { IconButton, Notice, Panel, PanelBody } from '@cfxdevkit/ui';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, usePublicClient, useReadContracts, useWriteContract } from 'wagmi';
import { type TokenWithBalance, usePoolsContext } from '../app/pools-context';
import { readContracts } from '../lib/strategy';

const TERMINAL_STATUSES = new Set(['executed', 'cancelled', 'failed', 'expired']);

export interface ApprovalWidgetProps {
  jobs: CasJobDto[];
  busy?: boolean;
}

export function ApprovalWidget({ jobs, busy = false }: ApprovalWidgetProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { tokens } = usePoolsContext();
  const [message, setMessage] = useState('Allowances are read from chain.');
  const [error, setError] = useState<string | null>(null);
  const [submittingToken, setSubmittingToken] = useState<string | null>(null);

  const contracts = useMemo(() => readContracts(), []);
  const tokenMap = useMemo(
    () => new Map(tokens.map((token) => [token.address.toLowerCase(), token])),
    [tokens],
  );
  const rows = useMemo(() => buildRows(jobs, tokenMap), [jobs, tokenMap]);
  const allowanceContracts = useMemo(
    () =>
      rows.map((row) => ({
        address: row.token,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [
          address ?? '0x0000000000000000000000000000000000000000',
          contracts.automationManagerAddress,
        ],
      })),
    [address, contracts.automationManagerAddress, rows],
  );

  const allowanceReads = useReadContracts({
    contracts: allowanceContracts,
    allowFailure: true,
    query: { enabled: Boolean(address) && rows.length > 0 },
  });

  const approve = async (row: ApprovalRow, amount: bigint, label: string) => {
    if (!address) return;
    setSubmittingToken(row.token);
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: row.token,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.automationManagerAddress, amount],
      });
      await publicClient?.waitForTransactionReceipt({
        hash,
        pollingInterval: 2_000,
        timeout: 120_000,
      });
      setMessage(`${label} confirmed for ${row.meta.symbol}`);
      await allowanceReads.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmittingToken(null);
    }
  };

  return (
    <Panel
      title="Approvals"
      icon={<ShieldCheck size={16} />}
      actions={
        <IconButton
          title="Refresh allowances"
          onClick={() => void allowanceReads.refetch()}
          disabled={busy}
        >
          <RefreshCw size={16} />
        </IconButton>
      }
    >
      <PanelBody>
        {error ? <Notice tone="error">{error}</Notice> : <Notice>{message}</Notice>}
        {!address ? <Notice tone="error">Connect a wallet to inspect allowances.</Notice> : null}
        {rows.length === 0 ? <div className="empty-state">No active token commitments.</div> : null}
        {rows.length > 0 ? (
          <div className="approval-list">
            {rows.map((row, index) => {
              const read = allowanceReads.data?.[index];
              const allowance = read?.status === 'success' ? (read.result as bigint) : null;
              const busyRow = submittingToken === row.token || busy;
              return (
                <article className="approval-row" key={row.token}>
                  <div>
                    <TokenLabel token={row.meta} />
                    <p className="mono">{row.token}</p>
                  </div>
                  <div className="approval-values">
                    <span>Allowance {formatAmount(allowance, row.meta.decimals ?? 18)}</span>
                    <span>Committed {formatAmount(row.committed, row.meta.decimals ?? 18)}</span>
                  </div>
                  <div className="inline-actions">
                    <button
                      className="button danger"
                      type="button"
                      disabled={!allowance || allowance === 0n || busyRow}
                      onClick={() => void approve(row, 0n, 'Allowance revoked')}
                    >
                      Revoke
                    </button>
                    <button
                      className="button"
                      type="button"
                      disabled={allowance === null || allowance === row.committed || busyRow}
                      onClick={() => void approve(row, row.committed, 'Exact allowance')}
                    >
                      Set Exact
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

function buildRows(jobs: CasJobDto[], tokenMap: Map<string, TokenWithBalance>): ApprovalRow[] {
  const rows = new Map<string, ApprovalRow>();
  for (const job of jobs) {
    if (TERMINAL_STATUSES.has(job.status)) continue;
    const params = job.params as Record<string, unknown>;
    const token = String(params.tokenIn ?? '') as `0x${string}`;
    if (!token.startsWith('0x')) continue;
    const key = token.toLowerCase();
    const meta = tokenMap.get(key) ?? {
      address: token,
      symbol: shortToken(token),
      name: shortToken(token),
      decimals: 18,
    };
    const current = rows.get(key) ?? { token, meta, committed: 0n };
    current.committed += committedAmount(job);
    rows.set(key, current);
  }
  return [...rows.values()].filter((row) => row.committed > 0n);
}

function committedAmount(job: CasJobDto): bigint {
  const params = job.params as Record<string, unknown>;
  if (job.type === 'dca') {
    const amountPerSwap = BigInt(String(params.amountPerSwap ?? '0'));
    const totalSwaps = Number(params.totalSwaps ?? 0);
    const swapsCompleted = Number(params.swapsCompleted ?? 0);
    return amountPerSwap * BigInt(Math.max(0, totalSwaps - swapsCompleted));
  }
  return BigInt(String(params.amountIn ?? '0'));
}

function formatAmount(value: bigint | null, decimals = 18): string {
  if (value === null) return 'n/a';
  if (value >= MAX_UINT256 / 2n) return '∞ (unlimited)';
  const formatted = Number(formatUnits(value, decimals));
  if (!Number.isFinite(formatted) || formatted === 0) return '0';
  return formatted.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function TokenLabel({ token }: { token: Pick<TokenWithBalance, 'symbol' | 'logoURI'> }) {
  return (
    <span className="token-chip">
      {token.logoURI ? (
        // biome-ignore lint/performance/noImgElement: dynamic token logo URLs are not known at build time.
        <img
          src={token.logoURI}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <span>{token.symbol}</span>
    </span>
  );
}

function shortToken(value: string): string {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

interface ApprovalRow {
  token: `0x${string}`;
  meta: TokenWithBalance;
  committed: bigint;
}
