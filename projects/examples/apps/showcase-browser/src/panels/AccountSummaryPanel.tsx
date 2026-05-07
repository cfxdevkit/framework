/**
 * AccountSummaryPanel — read-only dashboard of the connected wagmi
 * account: address, ENS name (mainnet only), native balance, block
 * number, gas price. Pure read calls — no signature required.
 */

import { CopyButton } from '@cfxdevkit/example-showcase-ui';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useBlockNumber, useChainId, useEnsName, useGasPrice } from 'wagmi';
import { espaceMainnet } from '../contexts/WagmiProviders.js';

export function AccountSummaryPanel() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const {
    data: balance,
    refetch: refetchBalance,
    isFetching: balanceFetching,
  } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  });
  const { data: ens } = useEnsName({
    address,
    chainId: 1, // Ethereum mainnet
    query: { enabled: Boolean(address) && chainId === espaceMainnet.id },
  });
  const { data: blockNumber, refetch: refetchBlock } = useBlockNumber({
    query: { refetchInterval: 6_000 },
  });
  const { data: gasPrice } = useGasPrice({
    query: { refetchInterval: 12_000 },
  });

  if (!isConnected || !address) {
    return (
      <section className="panel">
        <h2>Account summary</h2>
        <p className="panel-desc">Connect a wagmi-compatible wallet from the header first.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Account summary</h2>
      <p className="panel-desc">Pure read RPC against the active eSpace chain. No signing.</p>

      <div className="result">
        address : {address} <CopyButton text={address} />
        {'\n'}connector : {connector?.name ?? 'unknown'}
        {'\n'}ens : {ens ?? '(none)'}
        {'\n'}chainId : {chainId}
        {'\n'}balance : {balance ? `${formatUnits(balance.value, balance.decimals)} ${balance.symbol}` : '…'}
        {'\n'}blockNumber : {blockNumber !== undefined ? blockNumber.toString() : '…'}
        {'\n'}gasPrice : {gasPrice !== undefined ? `${gasPrice.toString()} wei` : '…'}
      </div>

      <div className="row" style={{ marginTop: 12, gap: 8 }}>
        <button
          type="button"
          className="secondary"
          onClick={() => refetchBalance()}
          disabled={balanceFetching}
        >
          {balanceFetching ? 'Refreshing balance…' : 'Refresh balance'}
        </button>
        <button type="button" className="secondary" onClick={() => refetchBlock()}>
          Refresh block
        </button>
      </div>
    </section>
  );
}
