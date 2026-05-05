import { bridge } from '@cfxdevkit/contracts';
import {
  base32ToHex,
  type CoreSpaceClient,
  formatCFX,
  formatGDrip,
  getCoreAddress,
  hexToBase32,
  parseCFX,
} from '@cfxdevkit/core';
import { useCallback, useMemo, useState } from 'react';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';
import { executeLookup } from './core-panel-actions.js';
import {
  type BridgeKind,
  BridgeSection,
  type LookupKind,
  LookupsSection,
} from './core-panel-advanced.js';
import {
  AccountSection,
  AddressCodecSection,
  StatusSection,
  UnitsSection,
} from './core-panel-basics.js';

export function CorePanel() {
  // Always bound to Core Space — no global space toggle needed.
  const { core: chain, coreClient: rawCoreClient } = useNetwork();
  // The network provider always creates a CoreSpaceClient for the core chain.
  const client = rawCoreClient as CoreSpaceClient;
  const { active, signer } = useWallet();
  const [hexIn, setHexIn] = useState('0x1a2f80341409639ea6a35bbcab8299066109aa55');
  const [base32In, setBase32In] = useState('');
  const [codecOut, setCodecOut] = useState<string | null>(null);
  const [codecErr, setCodecErr] = useState<string | null>(null);
  const [cfxAmt, setCfxAmt] = useState('1.5');
  const [status, setStatus] = useState<unknown>(null);
  const [statusErr, setStatusErr] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [acct, setAcct] = useState<unknown>(null);
  const [acctErr, setAcctErr] = useState<string | null>(null);
  const [acctBusy, setAcctBusy] = useState(false);
  const [lookupHash, setLookupHash] = useState('');
  const [lookupAddr, setLookupAddr] = useState('');
  const [lookupKind, setLookupKind] = useState<LookupKind>('tx');
  const [lookupOut, setLookupOut] = useState<unknown>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [bridgeAmt, setBridgeAmt] = useState('0.01');
  const [bridgeKind, setBridgeKind] = useState<BridgeKind>('transfer');
  const [bridgeTo, setBridgeTo] = useState('');
  const [bridgeOut, setBridgeOut] = useState<string | null>(null);
  const [bridgeErr, setBridgeErr] = useState<string | null>(null);
  const [bridgeBusy, setBridgeBusy] = useState(false);

  const unitsRow = useMemo(() => {
    try {
      const drip = parseCFX(cfxAmt);
      return { drip: drip.toString(), cfx: formatCFX(drip), gdrip: formatGDrip(drip) };
    } catch {
      return null;
    }
  }, [cfxAmt]);

  const runHexToBase32 = () => runCodec(() => hexToBase32(hexIn as `0x${string}`, chain.id));
  const runBase32ToHex = () => runCodec(() => base32ToHex(base32In));
  const runCanonicalise = () => runCodec(() => getCoreAddress(base32In || hexIn));
  const runCodec = (operation: () => string) => {
    setCodecErr(null);
    try {
      setCodecOut(operation());
    } catch (e) {
      setCodecErr(e instanceof Error ? e.message : String(e));
    }
  };

  const refreshStatus = useCallback(async () => {
    setStatusBusy(true);
    setStatusErr(null);
    try {
      const [statusResult, epoch] = await Promise.all([
        client.getStatus(),
        client.getEpochNumber(),
      ]);
      setStatus({ status: statusResult, epochNumber: epoch });
    } catch (e) {
      setStatusErr(e instanceof Error ? e.message : String(e));
    } finally {
      setStatusBusy(false);
    }
  }, [client]);

  const refreshAccount = useCallback(async () => {
    if (!active) return;
    setAcctBusy(true);
    setAcctErr(null);
    try {
      const balance = await client.getBalance(active.coreAddress);
      const mappedBalance = await bridge.getMappedBalance({
        client,
        coreHexAddress: active.evmAddress,
      });
      setAcct({
        coreAddress: active.coreAddress,
        balance: `${formatCFX(balance)} CFX (${balance.toString()} drip)`,
        mappedEspaceAddress: bridge.mappedEspaceAddress(active.evmAddress),
        mappedBalance: `${formatCFX(mappedBalance)} CFX`,
      });
    } catch (e) {
      setAcctErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAcctBusy(false);
    }
  }, [client, active]);

  const runLookup = useCallback(async () => {
    setLookupBusy(true);
    setLookupErr(null);
    setLookupOut(null);
    try {
      setLookupOut(await executeLookup({ client, lookupKind, lookupHash, lookupAddr }));
    } catch (e) {
      setLookupErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLookupBusy(false);
    }
  }, [client, lookupKind, lookupHash, lookupAddr]);

  const runBridge = useCallback(async () => {
    if (!signer) {
      setBridgeErr('Connect a wallet on the Wallet tab first.');
      return;
    }
    setBridgeBusy(true);
    setBridgeErr(null);
    setBridgeOut(null);
    try {
      const value = parseCFX(bridgeAmt);
      const result =
        bridgeKind === 'transfer'
          ? await bridge.transferToEspace({
              client,
              signer,
              to: bridgeTo || (active ? bridge.mappedEspaceAddress(active.evmAddress) : ''),
              value,
            })
          : await bridge.withdrawFromMapped({ client, signer, value });
      setBridgeOut(result.hash);
    } catch (e) {
      setBridgeErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBridgeBusy(false);
    }
  }, [client, signer, bridgeAmt, bridgeKind, bridgeTo, active]);

  return (
    <section className="panel">
      <h2>Core Space — full surface</h2>
      <p className="panel-desc">
        Every helper in <code className="mono">@cfxdevkit/core</code> +{' '}
        <code className="mono">@cfxdevkit/contracts/bridge</code>, bound to the chain selected
        above. Address codec from <code className="mono">@cfxdevkit/core/address</code>; units from{' '}
        <code className="mono">@cfxdevkit/core/units</code>; the rest from the typed{' '}
        <code className="mono">CoreSpaceClient</code>.
      </p>
      <AddressCodecSection
        chainId={chain.id}
        hexIn={hexIn}
        base32In={base32In}
        codecOut={codecOut}
        codecErr={codecErr}
        setHexIn={setHexIn}
        setBase32In={setBase32In}
        runHexToBase32={runHexToBase32}
        runBase32ToHex={runBase32ToHex}
        runCanonicalise={runCanonicalise}
      />
      <UnitsSection cfxAmt={cfxAmt} setCfxAmt={setCfxAmt} unitsRow={unitsRow} />
      <StatusSection
        status={status}
        statusErr={statusErr}
        statusBusy={statusBusy}
        refreshStatus={() => void refreshStatus()}
      />
      <AccountSection
        active={Boolean(active)}
        acct={acct}
        acctErr={acctErr}
        acctBusy={acctBusy}
        refreshAccount={() => void refreshAccount()}
      />
      <LookupsSection
        lookupHash={lookupHash}
        lookupAddr={lookupAddr}
        lookupKind={lookupKind}
        lookupOut={lookupOut}
        lookupErr={lookupErr}
        lookupBusy={lookupBusy}
        setLookupHash={setLookupHash}
        setLookupAddr={setLookupAddr}
        setLookupKind={setLookupKind}
        runLookup={() => void runLookup()}
      />
      <BridgeSection
        signer={signer}
        active={active}
        bridgeAmt={bridgeAmt}
        bridgeKind={bridgeKind}
        bridgeTo={bridgeTo}
        bridgeOut={bridgeOut}
        bridgeErr={bridgeErr}
        bridgeBusy={bridgeBusy}
        setBridgeAmt={setBridgeAmt}
        setBridgeKind={setBridgeKind}
        setBridgeTo={setBridgeTo}
        runBridge={() => void runBridge()}
      />
    </section>
  );
}
