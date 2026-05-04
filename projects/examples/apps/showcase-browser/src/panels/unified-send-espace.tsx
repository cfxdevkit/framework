import { ConnectWall, CopyButton, errMsg, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useState } from 'react';
import { type Address, type Hex, isAddress, parseEther } from 'viem';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';

export function ESpaceSection() {
  const { address, isConnected } = useAccount();
  const [pickerOpen, setPickerOpen] = useState(false);
  const walletStatus = isConnected ? 'active' : 'not-active';
  const [to, setTo] = useState('');
  const [valueCfx, setValueCfx] = useState('0');
  const [data, setData] = useState('0x');
  const [hash, setHash] = useState<Hex | null>(null);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const { sendTransactionAsync, isPending } = useSendTransaction();
  const { data: receipt, isLoading: waitingReceipt } = useWaitForTransactionReceipt({
    hash: hash ?? undefined,
    query: { enabled: Boolean(hash) },
  });

  const send = async () => {
    if (!address) return;
    setSendErr(null);
    setHash(null);
    const dest = (to.trim() || address) as Address;
    const callData = (data.trim() || '0x') as Hex;
    if (!isAddress(dest)) {
      setSendErr(`Invalid address: ${dest}`);
      return;
    }
    let value: bigint;
    try {
      value = parseEther(valueCfx.trim() || '0');
    } catch (e) {
      setSendErr(`Invalid value: ${errMsg(e)}`);
      return;
    }
    try {
      const h = await sendTransactionAsync({ to: dest, value, data: callData });
      setHash(h);
    } catch (e) {
      setSendErr(errMsg(e));
    }
  };

  return (
    <div className="dual-col">
      <div className="dual-col-title">
        <span className="space-badge space-espace">eSpace</span>
        eSpace send
      </div>
      <ConnectWall
        title="eSpace"
        status={walletStatus}
        walletName="an eSpace wallet"
        onConnect={() => setPickerOpen(true)}
      >
        <label>
          to{' '}
          <span className="muted" style={{ fontSize: 11 }}>
            (blank → self)
          </span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={address ?? '0x…'}
            spellCheck={false}
          />
        </label>
        <div className="row" style={{ marginTop: 8 }}>
          <label style={{ flex: 1 }}>
            value (CFX)
            <input value={valueCfx} onChange={(e) => setValueCfx(e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            data
            <input value={data} onChange={(e) => setData(e.target.value)} spellCheck={false} />
          </label>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="primary"
            disabled={isPending}
            onClick={() => void send()}
          >
            {isPending ? 'Awaiting wallet…' : 'Send'}
          </button>
          {waitingReceipt && (
            <span className="muted" style={{ fontSize: 12 }}>
              Waiting for receipt…
            </span>
          )}
        </div>
        {sendErr && (
          <div style={{ color: 'var(--err)', fontSize: 12, marginTop: 6 }}>{sendErr}</div>
        )}
        {hash && (
          <div className="result">
            hash : {hash} <CopyButton text={hash} />
            {'\n'}status :{' '}
            {receipt ? (receipt.status === 'success' ? '✓ success' : '✗ reverted') : '…confirming'}
            {receipt && (
              <>
                {'\n'}block : {receipt.blockNumber.toString()}
              </>
            )}
          </div>
        )}
      </ConnectWall>
      <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
