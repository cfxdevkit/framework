'use client';

import {
  AssetConversionPanel,
  CodeSnippet,
  DemoCard,
  NetworkSwitchNotice,
} from '@cfxdevkit/example-showcase-ui';
import { WCFX_ABI } from '@cfxdevkit/protocol';
import { CFX_NATIVE_ADDRESS, normalizeAddress } from '@cfxdevkit/ui-core';
import { useState } from 'react';
import type { PublicClient, WalletClient } from 'viem';
import { formatUnits, parseEther } from 'viem';

const ESPACE_MAINNET_CHAIN_ID = 1030;

interface UiFoundationNetworkConversionProps {
  address: `0x${string}` | undefined;
  chainId: number | undefined;
  mainnetWcfxAddress: `0x${string}`;
  nativeBalanceValue: bigint | undefined;
  onRefetchBalances: () => Promise<unknown>;
  publicClient: PublicClient | null | undefined;
  walletClient: WalletClient | null | undefined;
  wrappedBalanceValue: bigint | undefined;
}

function formatBalanceLabel(value: bigint | undefined, symbol: string): string | undefined {
  if (value === undefined) return undefined;
  return `${Number(formatUnits(value, 18)).toFixed(4)} ${symbol}`;
}

export function UiFoundationNetworkConversion({
  address,
  chainId,
  mainnetWcfxAddress,
  nativeBalanceValue,
  onRefetchBalances,
  publicClient,
  walletClient,
  wrappedBalanceValue,
}: UiFoundationNetworkConversionProps) {
  const [conversionMode, setConversionMode] = useState<'wrap' | 'unwrap'>('wrap');
  const [conversionAmount, setConversionAmount] = useState('1.0');
  const [conversionMessage, setConversionMessage] = useState<string | null>(null);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionBusy, setConversionBusy] = useState(false);

  const activeBalance = conversionMode === 'wrap' ? nativeBalanceValue : wrappedBalanceValue;
  const activeBalanceLabel =
    conversionMode === 'wrap'
      ? formatBalanceLabel(nativeBalanceValue, 'CFX')
      : formatBalanceLabel(wrappedBalanceValue, 'WCFX');

  const handleSubmit = () => {
    void (async () => {
      if (!walletClient || !address) {
        setConversionError('Connect an eSpace wallet to submit a live mainnet wrap or unwrap.');
        return;
      }
      if (!walletClient.account) {
        setConversionError('Connected wallet is missing an active account.');
        return;
      }
      if (chainId !== ESPACE_MAINNET_CHAIN_ID) {
        setConversionError(
          'Switch the connected wallet to eSpace mainnet before converting CFX and WCFX.',
        );
        return;
      }
      if (!publicClient) {
        setConversionError('Mainnet public client is unavailable.');
        return;
      }

      try {
        setConversionBusy(true);
        setConversionError(null);
        setConversionMessage(null);
        const parsedAmount = parseEther(conversionAmount || '0');

        if (parsedAmount <= 0n) {
          setConversionError('Enter an amount greater than zero.');
          return;
        }

        const walletAccount = walletClient.account;
        const walletChain = walletClient.chain ?? null;

        const hash =
          conversionMode === 'wrap'
            ? await walletClient.writeContract({
                address: mainnetWcfxAddress,
                abi: WCFX_ABI,
                functionName: 'deposit',
                args: [],
                value: parsedAmount,
                account: walletAccount,
                chain: walletChain,
              })
            : await walletClient.writeContract({
                address: mainnetWcfxAddress,
                abi: WCFX_ABI,
                functionName: 'withdraw',
                args: [parsedAmount],
                account: walletAccount,
                chain: walletChain,
              });

        await publicClient.waitForTransactionReceipt({ hash });
        await onRefetchBalances();
        setConversionMessage(
          `${conversionMode === 'wrap' ? 'Wrapped' : 'Unwrapped'} ${conversionAmount || '0'} ${conversionMode === 'wrap' ? 'CFX' : 'WCFX'} on eSpace mainnet.`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setConversionError(message);
      } finally {
        setConversionBusy(false);
      }
    })();
  };

  return (
    <DemoCard
      title="Network And Conversion"
      description="The network warning and CFX/WCFX conversion panel are now reusable components instead of app-local widgets."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <NetworkSwitchNotice
            chainName="Conflux eSpace Mainnet"
            expectedChainId={ESPACE_MAINNET_CHAIN_ID}
            message="This shared network notice is now wired to the live connected chain instead of preview state."
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
          busy={conversionBusy}
          error={conversionError}
          {...(activeBalanceLabel ? { maxAmountLabel: `Max: ${activeBalanceLabel}` } : {})}
          mode={conversionMode}
          onAmountChange={setConversionAmount}
          onMax={() => {
            if (activeBalance !== undefined) {
              setConversionAmount(formatUnits(activeBalance, 18));
            }
          }}
          onModeChange={(mode) => {
            setConversionMode(mode);
            setConversionMessage(null);
            setConversionError(null);
          }}
          onSubmit={handleSubmit}
          success={conversionMessage}
          toAssetLabel="WCFX"
        />
      </div>
    </DemoCard>
  );
}
