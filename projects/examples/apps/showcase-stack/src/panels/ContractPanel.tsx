import { errMsg, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useMemo, useState } from 'react';
import type { Abi, Address } from 'viem';
import { isAddress } from 'viem';
import { useAccount } from 'wagmi';
import { parseFunctions, ReadForm, WriteForm } from './contract-forms.js';

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
  const isValidAddress = isAddress(contractAddress);

  return (
    <div>
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
