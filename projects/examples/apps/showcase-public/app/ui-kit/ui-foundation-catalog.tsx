'use client';

import {
  AssetConversionPanel,
  CodeSnippet,
  DemoCard,
  NetworkSwitchNotice,
  SegmentedControl,
  TokenAmountField,
  TokenPairSelector,
  TokenSelect,
  WalletButton,
  WalletPickerModal,
  WalletProviderCard,
  WalletStatusChip,
} from '@cfxdevkit/example-showcase-ui';
import {
  CFX_NATIVE_ADDRESS,
  getPairedTokens,
  normalizeAddress,
  wcfxAddress,
} from '@cfxdevkit/ui-core';
import { useMemo, useState } from 'react';

const SAMPLE_TOKENS = [
  { address: CFX_NATIVE_ADDRESS, name: 'Conflux', symbol: 'CFX' },
  { address: wcfxAddress('testnet'), name: 'Wrapped Conflux', symbol: 'WCFX' },
  { address: '0x1111111111111111111111111111111111111111', name: 'Tether', symbol: 'USDT' },
  { address: '0x2222222222222222222222222222222222222222', name: 'Ether', symbol: 'ETH' },
] as const;

const SAMPLE_PAIRS = [
  { token0: CFX_NATIVE_ADDRESS, token1: wcfxAddress('testnet') },
  { token0: wcfxAddress('testnet'), token1: '0x1111111111111111111111111111111111111111' },
  { token0: wcfxAddress('testnet'), token1: '0x2222222222222222222222222222222222222222' },
] as const;

type SampleToken = (typeof SAMPLE_TOKENS)[number];

export function UiFoundationCatalog() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [networkId, setNetworkId] = useState<'mainnet' | 'testnet' | 'local'>('testnet');
  const [singleToken, setSingleToken] = useState<string>(SAMPLE_TOKENS[0].address);
  const [amountToken, setAmountToken] = useState<string>(SAMPLE_TOKENS[0].address);
  const [amount, setAmount] = useState('12.5');
  const [tokenIn, setTokenIn] = useState<string>(SAMPLE_TOKENS[0].address);
  const [tokenOut, setTokenOut] = useState<string>(SAMPLE_TOKENS[1].address);
  const [conversionMode, setConversionMode] = useState<'wrap' | 'unwrap'>('wrap');
  const [conversionAmount, setConversionAmount] = useState('1.0');
  const [conversionMessage, setConversionMessage] = useState<string | null>(null);

  const pairPreview = useMemo(
    () =>
      getPairedTokens<SampleToken>(SAMPLE_PAIRS, SAMPLE_TOKENS, tokenIn).map((token) => ({
        address: normalizeAddress(token.address),
        symbol: token.symbol,
      })),
    [tokenIn],
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
              <WalletStatusChip address="0x1234567890abcdef1234567890abcdef12345678" />
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
            status="active"
            account="0x1234567890abcdef1234567890abcdef12345678"
            chainLabel="eSpace Testnet (71) via MetaMask"
            providerPresent={true}
            providerDescription="Connection shell extracted from the browser wallet provider matrix so other apps can reuse the same status presentation."
            actions={
              <button
                type="button"
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
              >
                Disconnect
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
                  description: 'Public testnet used by the public showcase.',
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
            <TokenSelect options={SAMPLE_TOKENS} value={singleToken} onChange={setSingleToken} />
            <TokenAmountField
              amount={amount}
              balance="42.0000 CFX"
              label="Input amount"
              onAmountChange={setAmount}
              onTokenChange={setAmountToken}
              tokens={SAMPLE_TOKENS}
              tokenValue={amountToken}
            />
          </div>

          <div className="space-y-4">
            <TokenPairSelector
              inputOptions={SAMPLE_TOKENS}
              onSwap={() => {
                setTokenIn(tokenOut);
                setTokenOut(tokenIn);
              }}
              onTokenInChange={setTokenIn}
              onTokenOutChange={setTokenOut}
              outputOptions={SAMPLE_TOKENS}
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

      <DemoCard
        title="Network And Conversion"
        description="The network warning and CFX/WCFX conversion panel are now reusable components instead of app-local widgets."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <NetworkSwitchNotice
              chainName="Conflux eSpace Testnet"
              expectedChainId={71}
              message="Preview: shared network notice when the active chain does not match your app."
              preview={{ error: 'Demo mode: connect and switch in-app.', isSwitching: false }}
            />
            <CodeSnippet
              label="Normalization example"
              code={`normalizeAddress('${CFX_NATIVE_ADDRESS}')\n// => ${normalizeAddress(CFX_NATIVE_ADDRESS)}`}
            />
          </div>

          <AssetConversionPanel
            title="CFX / WCFX"
            amount={conversionAmount}
            fromAssetLabel="CFX"
            maxAmountLabel="Max: 4.2000 CFX"
            mode={conversionMode}
            onAmountChange={setConversionAmount}
            onMax={() => setConversionAmount('4.2')}
            onModeChange={(mode) => {
              setConversionMode(mode);
              setConversionMessage(null);
            }}
            onSubmit={() => {
              setConversionMessage(
                `${conversionMode === 'wrap' ? 'Wrapped' : 'Unwrapped'} ${conversionAmount || '0'} ${conversionMode === 'wrap' ? 'CFX' : 'WCFX'}`,
              );
            }}
            success={conversionMessage}
            toAssetLabel="WCFX"
          />
        </div>
      </DemoCard>
    </>
  );
}
