'use client';

import {
  CodeSnippet,
  DemoCard,
  Field,
  Metric,
  Notice,
  SegmentedControl,
  StatusGrid,
  TokenAmountField,
  TokenPairSelector,
  TokenSelect,
  WalletButton,
  WalletPickerModal,
  WalletProviderCard,
  WalletStatusChip,
} from '@cfxdevkit/example-showcase-ui';
import { useTokenBalance } from '@cfxdevkit/react';
import {
  CFX_NATIVE_ADDRESS,
  DEFAULT_MAINNET_DISPLAY_TOKENS,
  DEFAULT_MAINNET_PAIRS,
  getPairedTokens,
  normalizeAddress,
  wcfxAddress,
} from '@cfxdevkit/ui-core';
import { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { UiFoundationNetworkConversion } from './ui-foundation-network-conversion';

type MainnetToken = (typeof DEFAULT_MAINNET_DISPLAY_TOKENS)[number];

const ESPACE_MAINNET_CHAIN_ID = 1030;
const DEFAULT_INPUT_TOKEN_ADDRESS =
  DEFAULT_MAINNET_DISPLAY_TOKENS[0]?.address ?? CFX_NATIVE_ADDRESS;
const DEFAULT_OUTPUT_TOKEN_ADDRESS =
  DEFAULT_MAINNET_DISPLAY_TOKENS.find((token) => token.address !== DEFAULT_INPUT_TOKEN_ADDRESS)
    ?.address ?? DEFAULT_INPUT_TOKEN_ADDRESS;

function formatBalanceLabel(value: bigint | undefined, symbol: string): string | undefined {
  if (value === undefined) return undefined;
  return `${Number(formatUnits(value, 18)).toFixed(4)} ${symbol}`;
}

export function UiFoundationCatalog() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [networkId, setNetworkId] = useState<'mainnet' | 'testnet' | 'local'>('mainnet');
  const [singleToken, setSingleToken] = useState<string>(DEFAULT_INPUT_TOKEN_ADDRESS);
  const [amountToken, setAmountToken] = useState<string>(DEFAULT_INPUT_TOKEN_ADDRESS);
  const [amount, setAmount] = useState('12.5');
  const [tokenIn, setTokenIn] = useState<string>(DEFAULT_INPUT_TOKEN_ADDRESS);
  const [tokenOut, setTokenOut] = useState<string>(DEFAULT_OUTPUT_TOKEN_ADDRESS);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const validHexAddress = address?.startsWith('0x') ? (address as `0x${string}`) : undefined;
  const mainnetWcfxAddress = wcfxAddress('mainnet') as `0x${string}`;
  const nativeBalance = useBalance({ address: validHexAddress });
  const wrappedBalance = useTokenBalance({
    enabled: Boolean(validHexAddress),
    owner: validHexAddress,
    token: mainnetWcfxAddress,
  });

  const walletChainLabel =
    chainId === ESPACE_MAINNET_CHAIN_ID
      ? 'eSpace Mainnet (1030)'
      : chainId
        ? `Connected chain ${chainId}`
        : 'Connect an eSpace wallet';

  const pairedTokens = useMemo(
    () =>
      getPairedTokens<MainnetToken>(
        DEFAULT_MAINNET_PAIRS,
        DEFAULT_MAINNET_DISPLAY_TOKENS,
        tokenIn,
        { wrappedNativeAddress: wcfxAddress('mainnet') },
      ),
    [tokenIn],
  );

  useEffect(() => {
    if (!pairedTokens.length) return;

    const hasSelectedOutput = pairedTokens.some(
      (token) => normalizeAddress(token.address) === normalizeAddress(tokenOut),
    );
    const fallbackOutput = pairedTokens[0];

    if (!hasSelectedOutput && fallbackOutput) {
      setTokenOut(fallbackOutput.address);
    }
  }, [pairedTokens, tokenOut]);

  const pairPreview = useMemo(
    () =>
      pairedTokens.map((token) => ({
        address: normalizeAddress(token.address),
        symbol: token.symbol,
      })),
    [pairedTokens],
  );

  return (
    <>
      <DemoCard
        title="Shared Wallet UI"
        description="Reusable eSpace wallet actions extracted from the old showcase/browser implementations into @cfxdevkit/ui."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              Session controls
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <WalletButton />
              <WalletStatusChip address={address ?? null} />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
              >
                Open Wallet Picker
              </button>
            </div>
          </div>

          <WalletProviderCard
            title="Injected wallet card"
            space="espace"
            status={isConnected ? 'active' : 'not-active'}
            account={address ?? null}
            chainLabel={walletChainLabel}
            providerPresent={true}
            providerDescription="Connection shell extracted from the browser wallet provider matrix so other apps can reuse the same status presentation on live mainnet sessions."
            actions={
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
              >
                {isConnected ? 'Manage wallet' : 'Open picker'}
              </button>
            }
          />
        </div>

        <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
      </DemoCard>

      <DemoCard
        title="Segmented Network Selector"
        description="Shared segmented control extracted from the duplicated network selectors in the old showcase-browser and showcase-stack apps."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <SegmentedControl
              value={networkId}
              onChange={setNetworkId}
              options={[
                {
                  description: 'Conflux production networks.',
                  label: 'Mainnet',
                  value: 'mainnet',
                },
                {
                  description: 'Legacy public testnet examples stay secondary.',
                  label: 'Testnet',
                  value: 'testnet',
                },
                {
                  description: 'Local devnode routing stays app-level.',
                  disabled: true,
                  label: 'Local',
                  value: 'local',
                },
              ]}
            />
            <CodeSnippet label="selected network" code={JSON.stringify({ networkId }, null, 2)} />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <p className="font-semibold text-slate-100">Why this moved</p>
            <p className="mt-2 leading-6">
              The old showcase apps had two separate segmented controls with the same interaction
              model and slightly different copy. The control is reusable; the network state model
              stays app-level because browser and stack still have different routing and provider
              responsibilities.
            </p>
          </div>
        </div>
      </DemoCard>

      <DemoCard
        title="Token Inputs"
        description="Token selection and amount entry extracted into the shared Tailwind package for swap, strategy, and portfolio flows."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <TokenSelect
              options={DEFAULT_MAINNET_DISPLAY_TOKENS}
              value={singleToken}
              onChange={setSingleToken}
            />
            <TokenAmountField
              amount={amount}
              balance={
                amountToken === CFX_NATIVE_ADDRESS
                  ? (formatBalanceLabel(nativeBalance.data?.value, 'CFX') ??
                    'Connect wallet for live balance')
                  : amountToken === wcfxAddress('mainnet')
                    ? (formatBalanceLabel(wrappedBalance.data, 'WCFX') ??
                      'Connect wallet for live balance')
                    : 'Shared mainnet token defaults with live icon metadata'
              }
              label="Input amount"
              onAmountChange={setAmount}
              onTokenChange={setAmountToken}
              tokens={DEFAULT_MAINNET_DISPLAY_TOKENS}
              tokenValue={amountToken}
            />
          </div>

          <div className="space-y-4">
            <TokenPairSelector
              inputOptions={DEFAULT_MAINNET_DISPLAY_TOKENS}
              onTokenInChange={setTokenIn}
              onTokenOutChange={setTokenOut}
              outputOptions={pairedTokens}
              tokenInValue={tokenIn}
              tokenOutValue={tokenOut}
            />
            <CodeSnippet
              label="ui-core token helpers"
              code={JSON.stringify(pairPreview, null, 2)}
            />
          </div>
        </div>
      </DemoCard>

      <UiFoundationNetworkConversion
        address={validHexAddress}
        chainId={chainId}
        mainnetWcfxAddress={mainnetWcfxAddress}
        nativeBalanceValue={nativeBalance.data?.value}
        onRefetchBalances={() => Promise.all([nativeBalance.refetch(), wrappedBalance.refetch()])}
        publicClient={publicClient}
        walletClient={walletClient}
        wrappedBalanceValue={wrappedBalance.data}
      />

      <DemoCard
        title="Page Primitives"
        description="Field, Notice, StatusGrid, and Metric now live in the shared Tailwind package instead of staying duplicated inside CAS and older UI packages."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Field
              label="RPC endpoint"
              hint="Validation, persistence, and confirmation flows stay app-level; the shell styling is now shared."
            >
              <input
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                defaultValue="https://evm.confluxrpc.com"
              />
            </Field>
            <Notice tone="warning">
              Switching RPC endpoints should stay behind app-level confirmation, but the warning
              shell no longer needs a one-off implementation.
            </Notice>
            <Notice tone="ok">
              CAS-style status notices and metric grids now come from the shared package.
            </Notice>
          </div>

          <StatusGrid columns={2}>
            <Metric label="Wallet session" value={isConnected ? 'Connected' : 'Disconnected'} />
            <Metric label="Connected chain" value={walletChainLabel} />
            <Metric
              label="CFX balance"
              value={formatBalanceLabel(nativeBalance.data?.value, 'CFX') ?? 'Unavailable'}
            />
            <Metric
              label="WCFX balance"
              value={formatBalanceLabel(wrappedBalance.data, 'WCFX') ?? 'Unavailable'}
            />
          </StatusGrid>
        </div>
      </DemoCard>
    </>
  );
}
