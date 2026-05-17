import { formatCFX, formatGDrip } from '@cfxdevkit/core';
import { CodeSnippet, DemoCard, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { CORE_CHAIN_CONFIGS } from '@cfxdevkit/wallet-connect';
import {
  CORE_MAINNET_ID,
  CORE_SNIPPET,
  CORE_TESTNET_ID,
  ESPACE_MAINNET_ID,
  ESPACE_SNIPPET,
  ESPACE_TESTNET_ID,
} from './wallet-data';
import { chainBtn, ROW, TD_LABEL, TD_VALUE, TWO_COL_GRID } from './wallet-styles';

interface WalletAccountCardsProps {
  address: string | undefined;
  balanceData: { value: bigint; decimals: number; symbol: string } | undefined;
  chainId: number;
  chainName?: string | undefined;
  core: CoreWallet;
  coreChainState: { balance: string | null; epoch: string | null; gasPrice: string | null };
  isConnected: boolean;
  isSwitching: boolean;
  switchChain(input: { chainId: number }): void;
  validHexAddress: `0x${string}` | undefined;
}

interface CoreWallet {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isSwitching: boolean;
  status: string;
  switchChain(config: (typeof CORE_CHAIN_CONFIGS)[number]): Promise<void>;
}

export function WalletAccountCards(props: WalletAccountCardsProps) {
  return (
    <>
      <EspaceAccountCard {...props} />
      <DualSpaceDashboard {...props} />
      <EspaceChainSwitch {...props} />
      <CoreAccountCard core={props.core} />
      <CoreChainSwitch core={props.core} />
    </>
  );
}

function EspaceAccountCard(props: WalletAccountCardsProps) {
  return (
    <DemoCard
      title="eSpace Account"
      description="Shared wallet UI on top of wagmi. Use the header wallet picker, then read account state with useAccount and useBalance."
    >
      {props.isConnected ? (
        <Rows rows={espaceRows(props)} />
      ) : (
        <StatusBadge status="pending" label="Click the eSpace button in the header to connect" />
      )}
      <CodeSnippet code={ESPACE_SNIPPET} label="How it works" />
    </DemoCard>
  );
}

function DualSpaceDashboard(props: WalletAccountCardsProps) {
  const coreRows: Array<[string, unknown]> = [
    ['Core address', props.core.address ?? 'not connected'],
    ['Core chain', props.core.chainId ?? 'unknown'],
    ['Core balance', formatCoreBalance(props.coreChainState.balance)],
    ['Core epoch', formatHexQuantity(props.coreChainState.epoch)],
    ['Core gas', formatCoreGasPrice(props.coreChainState.gasPrice)],
  ];
  return (
    <DemoCard
      title="Dual-Space Dashboard"
      description="Side-by-side eSpace and Core state from the two browser wallet providers. Balances and Core chain state refresh while connected."
    >
      <div style={TWO_COL_GRID}>
        <Rows rows={dashboardRows(props)} />
        <Rows rows={coreRows} />
      </div>
    </DemoCard>
  );
}

function EspaceChainSwitch(props: WalletAccountCardsProps) {
  return (
    <DemoCard
      title="eSpace Chain Switch"
      description="useSwitchChain — switch the eSpace wallet between mainnet (1030) and testnet (71)."
    >
      <div style={buttonRowStyle}>
        {[
          { label: 'eSpace Mainnet (1030)', id: ESPACE_MAINNET_ID },
          { label: 'eSpace Testnet (71)', id: ESPACE_TESTNET_ID },
        ].map(({ label, id }) => {
          const disabled = !props.isConnected || props.isSwitching || props.chainId === id;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => props.switchChain({ chainId: id })}
              style={chainBtn(props.chainId === id, disabled)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <StatusBadge
        status={props.isConnected ? 'ok' : 'pending'}
        label={
          props.isConnected ? `Active: chain ID ${props.chainId}` : 'Connect an eSpace wallet first'
        }
      />
    </DemoCard>
  );
}

function CoreAccountCard({ core }: { core: CoreWallet }) {
  return (
    <DemoCard
      title="Core Space Account (Fluent)"
      description="useCoreWallet — connects via window.conflux, completely independent of wagmi. Click Core in the header."
    >
      {core.status === 'detecting' && <p style={mutedTextStyle}>Detecting Fluent…</p>}
      {core.status === 'not-installed' && (
        <StatusBadge
          status="error"
          label="Fluent wallet not detected — install from fluent.wallet"
        />
      )}
      {core.status === 'not-active' && (
        <StatusBadge status="pending" label="Click the Core button in the header to connect" />
      )}
      {core.status === 'connecting' && (
        <StatusBadge status="pending" label="Waiting for Fluent approval…" />
      )}
      {core.status === 'active' && <Rows rows={coreAccountRows(core)} />}
      <CodeSnippet code={CORE_SNIPPET} label="How it works" />
    </DemoCard>
  );
}

function CoreChainSwitch({ core }: { core: CoreWallet }) {
  return (
    <DemoCard
      title="Core Space Chain Switch"
      description="core.switchChain — switch Fluent between Core Space testnet (chainId 1) and mainnet (1029)."
    >
      <div style={buttonRowStyle}>
        {[
          { label: 'Core Testnet (1)', id: CORE_TESTNET_ID },
          { label: 'Core Mainnet (1029)', id: CORE_MAINNET_ID },
        ].map(({ label, id }) => {
          const targetCfg = CORE_CHAIN_CONFIGS[id];
          const isActive = !!targetCfg && core.chainId === targetCfg.chainIdHex;
          const disabled = !core.isConnected || core.isSwitching || isActive;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (targetCfg) void core.switchChain(targetCfg);
              }}
              style={chainBtn(isActive, disabled)}
            >
              {label}
            </button>
          );
        })}
      </div>
      <StatusBadge
        status={core.isConnected ? 'ok' : 'pending'}
        label={
          core.isConnected
            ? `Active: ${core.chainId ?? '…'}`
            : core.status === 'not-installed'
              ? 'Fluent not installed'
              : 'Connect Core wallet first'
        }
      />
    </DemoCard>
  );
}

function Rows({ rows }: { rows: Array<[string, unknown]> }) {
  return (
    <table style={tableStyle}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} style={ROW}>
            <td style={TD_LABEL}>{label}</td>
            <td style={TD_VALUE}>{String(value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function espaceRows(props: WalletAccountCardsProps): Array<[string, unknown]> {
  return [
    ['Address', props.address],
    ['Chain', props.chainName ?? props.chainId],
    ['Balance', balanceLabel(props.balanceData, '…')],
  ];
}

function dashboardRows(props: WalletAccountCardsProps): Array<[string, unknown]> {
  return [
    ['eSpace address', props.validHexAddress ?? 'not connected'],
    ['eSpace chain', props.chainName ?? props.chainId],
    ['eSpace balance', balanceLabel(props.balanceData, '...')],
  ];
}

function coreAccountRows(core: CoreWallet): Array<[string, unknown]> {
  return [
    ['Address', core.address],
    ['Chain ID (hex)', core.chainId],
    ['Chain ID (dec)', core.chainId ? Number.parseInt(core.chainId, 16) : '—'],
  ];
}

function balanceLabel(balance: WalletAccountCardsProps['balanceData'], fallback: string): string {
  return balance
    ? `${(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} ${balance.symbol}`
    : fallback;
}

function formatHexQuantity(value: unknown): string {
  if (typeof value !== 'string') return '...';
  try {
    return BigInt(value).toString();
  } catch {
    return value;
  }
}

function formatCoreBalance(balance: string | null): string {
  if (!balance) return '...';
  try {
    return `${formatCFX(BigInt(balance))} CFX`;
  } catch {
    return balance;
  }
}

function formatCoreGasPrice(gasPrice: string | null): string {
  if (!gasPrice) return '...';
  try {
    return `${formatGDrip(BigInt(gasPrice))} Gdrip`;
  } catch {
    return gasPrice;
  }
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 'var(--cfx-text-sm)',
};
const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 'var(--cfx-space-3)',
  flexWrap: 'wrap',
  marginBottom: 'var(--cfx-space-3)',
};
const mutedTextStyle: React.CSSProperties = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-sm)',
  margin: 0,
};
