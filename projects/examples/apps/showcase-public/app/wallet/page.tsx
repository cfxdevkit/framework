'use client';

import { CodeSnippet, DemoCard, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { CORE_CHAIN_CONFIGS } from '@cfxdevkit/wallet-connect';
import { useCoreWallet } from '@cfxdevkit/wallet-connect/hooks';
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { SiteLayout } from '../site-layout';

const ESPACE_MAINNET_ID = 1030;
const ESPACE_TESTNET_ID = 71;
// Core Space chain IDs: 1 = testnet, 1029 = mainnet
const CORE_TESTNET_ID = 1;
const CORE_MAINNET_ID = 1029;

const ROW: React.CSSProperties = { borderBottom: '1px solid var(--cfx-color-border-subtle)' };
const TD_LABEL: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  color: 'var(--cfx-color-fg-subtle)',
  width: 150,
};
const TD_VALUE: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
};

function chainBtn(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    padding: 'var(--cfx-space-2) var(--cfx-space-4)',
    background: active ? 'var(--cfx-color-brand-primary)' : 'var(--cfx-color-bg-emphasis)',
    color: active ? '#fff' : 'var(--cfx-color-fg-default)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--cfx-color-border-default)',
    borderRadius: 'var(--cfx-radius-md)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 'var(--cfx-text-sm)',
  };
}

const ESPACE_SNIPPET = `// 1. Wrap your app with ConfluxWagmiProviders (done in providers.tsx)
import { ConfluxWagmiProviders } from '@cfxdevkit/wallet-connect';

// 2. Open WalletPickerModal (section="espace") to trigger browser wallet
import { WalletPickerModal } from '@cfxdevkit/wallet-connect/ui';

// 3. Read wallet state with wagmi hooks
import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';

const { address, isConnected, chain } = useAccount();
const { data: balance } = useBalance({ address });
const chainId = useChainId();
const { switchChain } = useSwitchChain();

switchChain({ chainId: 71 });  // → eSpace testnet
switchChain({ chainId: 1030 }); // → eSpace mainnet`;

const CORE_SNIPPET = `// useCoreWallet talks to window.conflux — independent of wagmi
import { useCoreWallet, CORE_CHAIN_CONFIGS } from '@cfxdevkit/wallet-connect';

const core = useCoreWallet();
// core.status: 'detecting' | 'not-installed' | 'not-active' | 'connecting' | 'active'
// core.address  — Core Space address string
// core.chainId  — hex chain ID ("0x1" = testnet, "0x405" = mainnet)

await core.connect();   // opens Fluent cfx_requestAccounts popup
core.disconnect();      // resets local state (Fluent has no revoke method)

// Switch chain — pass a CoreChainConfig from the built-in map
await core.switchChain(CORE_CHAIN_CONFIGS[1]);    // testnet
await core.switchChain(CORE_CHAIN_CONFIGS[1029]); // mainnet`;

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function WalletPage() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  // Strip out Core base32 addresses (cfxtest:/cfx:) that Fluent may briefly emit
  // through window.ethereum during Core chain switches — viem rejects them.
  const validHexAddress = address?.startsWith('0x') ? address : undefined;
  const { data: balanceData } = useBalance({ address: validHexAddress });
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const core = useCoreWallet();

  return (
    <SiteLayout>
      {/* ── eSpace Account ── */}
      <DemoCard
        title="eSpace Account"
        description="useAccount + useBalance via wagmi. Click the eSpace button in the header to connect MetaMask or any EIP-6963 wallet."
      >
        {isConnected ? (
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cfx-text-sm)' }}
          >
            <tbody>
              {[
                ['Address', address],
                ['Chain', chain?.name ?? chainId],
                [
                  'Balance',
                  balanceData
                    ? `${(Number(balanceData.value) / 10 ** balanceData.decimals).toFixed(4)} ${balanceData.symbol}`
                    : '…',
                ],
              ].map(([k, v]) => (
                <tr key={String(k)} style={ROW}>
                  <td style={TD_LABEL}>{k}</td>
                  <td style={TD_VALUE}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <StatusBadge status="pending" label="Click the eSpace button in the header to connect" />
        )}
        <CodeSnippet code={ESPACE_SNIPPET} label="How it works" />
      </DemoCard>

      {/* ── eSpace Chain Switch ── */}
      <DemoCard
        title="eSpace Chain Switch"
        description="useSwitchChain — switch the eSpace wallet between mainnet (1030) and testnet (71)."
      >
        <div
          style={{
            display: 'flex',
            gap: 'var(--cfx-space-3)',
            flexWrap: 'wrap',
            marginBottom: 'var(--cfx-space-3)',
          }}
        >
          {[
            { label: 'eSpace Mainnet (1030)', id: ESPACE_MAINNET_ID },
            { label: 'eSpace Testnet (71)', id: ESPACE_TESTNET_ID },
          ].map(({ label, id }) => (
            <button
              key={id}
              type="button"
              disabled={!isConnected || isSwitching || chainId === id}
              onClick={() => switchChain({ chainId: id })}
              style={chainBtn(chainId === id, !isConnected || isSwitching || chainId === id)}
            >
              {label}
            </button>
          ))}
        </div>
        <StatusBadge
          status={isConnected ? 'ok' : 'pending'}
          label={isConnected ? `Active: chain ID ${chainId}` : 'Connect an eSpace wallet first'}
        />
      </DemoCard>

      {/* ── Core Space Account ── */}
      <DemoCard
        title="Core Space Account (Fluent)"
        description="useCoreWallet — connects via window.conflux, completely independent of wagmi. Click Core in the header."
      >
        {core.status === 'detecting' && (
          <p
            style={{
              color: 'var(--cfx-color-fg-muted)',
              fontSize: 'var(--cfx-text-sm)',
              margin: 0,
            }}
          >
            Detecting Fluent…
          </p>
        )}
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
        {core.status === 'active' && (
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cfx-text-sm)' }}
          >
            <tbody>
              {[
                ['Address', core.address],
                ['Chain ID (hex)', core.chainId],
                ['Chain ID (dec)', core.chainId ? Number.parseInt(core.chainId, 16) : '—'],
              ].map(([k, v]) => (
                <tr key={String(k)} style={ROW}>
                  <td style={TD_LABEL}>{k}</td>
                  <td style={TD_VALUE}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <CodeSnippet code={CORE_SNIPPET} label="How it works" />
      </DemoCard>

      {/* ── Core Chain Switch ── */}
      <DemoCard
        title="Core Space Chain Switch"
        description="core.switchChain — switch Fluent between Core Space testnet (chainId 1) and mainnet (1029)."
      >
        <div
          style={{
            display: 'flex',
            gap: 'var(--cfx-space-3)',
            flexWrap: 'wrap',
            marginBottom: 'var(--cfx-space-3)',
          }}
        >
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
    </SiteLayout>
  );
}
