/**
 * AddressUnitsPanel — quick reference for the address codec + unit helpers
 * exported by `@cfxdevkit/core`.
 *
 * Demonstrates:
 * - `hexToBase32` / `base32ToHex` (Conflux Core ↔ EVM hex)
 * - `isBase32Address` validation
 * - `parseCFX` / `formatCFX` / `parseGDrip` / `formatGDrip` (drip math)
 *
 * All operations are pure and synchronous — no network round-trip.
 */
import {
  base32ToHex,
  formatCFX,
  formatGDrip,
  hexToBase32,
  isBase32Address,
  parseCFX,
  parseGDrip,
} from '@cfxdevkit/core';
import { CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useMemo, useState } from 'react';

const NETWORK_PRESETS = [
  { id: 1029, label: '1029 (cfx mainnet)' },
  { id: 1, label: '1 (cfxtest testnet)' },
  { id: 2029, label: '2029 (net2029 devnet)' },
];

export function AddressUnitsPanel() {
  // -------- Address codec --------
  const [hex, setHex] = useState('0x1eed2a8e3a8d3c0d4e7e1d6b3a6c5d4e2f1a9b8c');
  const [networkId, setNetworkId] = useState(1029);
  const [base32In, setBase32In] = useState('');

  const encoded = useMemo(() => {
    if (!hex || !/^0x[0-9a-fA-F]{40}$/.test(hex)) return null;
    try {
      return hexToBase32(hex as `0x${string}`, networkId);
    } catch (e) {
      return errMsg(e);
    }
  }, [hex, networkId]);

  const decoded = useMemo(() => {
    if (!base32In) return null;
    if (!isBase32Address(base32In)) return 'Not a valid base32 address.';
    try {
      return base32ToHex(base32In);
    } catch (e) {
      return errMsg(e);
    }
  }, [base32In]);

  // -------- Units --------
  const [cfxText, setCfxText] = useState('1.5');
  const [dripText, setDripText] = useState('1500000000000000000');
  const [gdripText, setGdripText] = useState('20');

  const drip = useMemo(() => {
    try {
      return parseCFX(cfxText.trim() || '0').toString();
    } catch (e) {
      return `error: ${errMsg(e)}`;
    }
  }, [cfxText]);

  const cfx = useMemo(() => {
    try {
      return formatCFX(BigInt(dripText.trim() || '0'));
    } catch (e) {
      return `error: ${errMsg(e)}`;
    }
  }, [dripText]);

  const gdripAsDrip = useMemo(() => {
    try {
      return parseGDrip(gdripText.trim() || '0').toString();
    } catch (e) {
      return `error: ${errMsg(e)}`;
    }
  }, [gdripText]);

  const gdripBack = useMemo(() => {
    try {
      return formatGDrip(parseGDrip(gdripText.trim() || '0'));
    } catch {
      return '';
    }
  }, [gdripText]);

  return (
    <>
      <section className="panel">
        <h2>Address codec</h2>
        <p className="panel-desc">
          Conflux Core uses base32-encoded addresses (CIP-37) tagged with the network id; eSpace
          uses standard EVM 0x hex. The same secp256k1 key encodes to{' '}
          <strong>different strings</strong> across the two spaces and across networks.
        </p>

        <div className="row">
          <label style={{ flex: 1 }}>
            EVM hex
            <input value={hex} onChange={(e) => setHex(e.target.value.trim())} spellCheck={false} />
          </label>
          <label>
            Network id
            <select
              value={networkId}
              onChange={(e) => setNetworkId(Number.parseInt(e.target.value, 10))}
            >
              {NETWORK_PRESETS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {encoded && (
          <div className="result">
            base32: {encoded}
            {encoded.startsWith('cfx') || encoded.startsWith('net') ? (
              <CopyButton text={encoded} />
            ) : null}
          </div>
        )}

        <label style={{ marginTop: 16, display: 'block' }}>
          base32 → hex
          <input
            value={base32In}
            onChange={(e) => setBase32In(e.target.value.trim())}
            placeholder="cfx:… / cfxtest:… / net2029:…"
            spellCheck={false}
          />
        </label>
        {decoded && (
          <div className="result">
            hex: {decoded}
            {decoded.startsWith('0x') ? <CopyButton text={decoded} /> : null}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Units · drip / CFX / Gdrip</h2>
        <p className="panel-desc">
          1 CFX = 10<sup>18</sup> drip. 1 Gdrip = 10<sup>9</sup> drip (the gas-price unit). All
          conversions go through viem's decimal math via{' '}
          <code className="mono">@cfxdevkit/core/units</code>; no <code>Number</code> arithmetic.
        </p>

        <div className="row">
          <label style={{ flex: 1 }}>
            CFX
            <input value={cfxText} onChange={(e) => setCfxText(e.target.value)} />
          </label>
          <label style={{ flex: 1 }}>
            drip
            <input value={dripText} onChange={(e) => setDripText(e.target.value)} />
          </label>
        </div>
        <div className="result">
          parseCFX("{cfxText}") = {drip} drip{'\n'}
          formatCFX({dripText}) = {cfx} CFX
        </div>

        <label style={{ marginTop: 16, display: 'block' }}>
          Gdrip (gas-price unit)
          <input value={gdripText} onChange={(e) => setGdripText(e.target.value)} />
        </label>
        <div className="result">
          parseGDrip("{gdripText}") = {gdripAsDrip} drip{'\n'}
          formatGDrip(parseGDrip("{gdripText}")) = {gdripBack} Gdrip (round-trip)
        </div>
      </section>
    </>
  );
}
