export function AboutPanel() {
  return (
    <section className="panel">
      <h2>About — Browser showcase</h2>
      <p className="panel-desc">
        Demonstrates everything that runs <strong>entirely in the browser</strong> with no backend:
        cryptographic key primitives, HD derivation, and user-controlled wallet operations. No
        mnemonic stand-in for signing — every transaction and message uses a wallet the user
        controls.
      </p>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>What's here</h3>
      <ul className="mono" style={{ lineHeight: 1.8 }}>
        <li>
          <strong style={{ color: 'var(--accent-2)' }}>Keys</strong> — BIP-39 mnemonic generation
          (platform CSPRNG), BIP-32/SLIP-0044 dual-space HD derivation (eSpace + Core addresses
          side-by-side)
        </li>
        <li>
          <strong style={{ color: '#7b61ff' }}>wagmi</strong> + viem for the eSpace EIP-1193 path
          (MetaMask, Brave, OKX, Rabby, …)
        </li>
        <li>
          <strong style={{ color: '#e8820c' }}>Fluent Core</strong> — direct{' '}
          <code>window.conflux</code> connector, <code>cfx_*</code> RPC, base32 addresses
        </li>
        <li>
          <strong style={{ color: '#4cc9f0' }}>Raw provider scan</strong> — detect injected globals
          and diagnose wallet conflicts
        </li>
        <li>
          <strong style={{ color: 'var(--accent-2)' }}>@cfxdevkit/core</strong> — address codecs,
          drip / CFX / Gdrip math, chain catalogue + ping
        </li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Sister sections</h3>
      <ul className="mono" style={{ lineHeight: 1.8 }}>
        <li>
          <a href="/showcase/">Backend showcase</a> — Core RPC SDK, server-side compiler, managed
          key — no browser wallet needed
        </li>
        <li>
          <a href="/stack/">Combined showcase</a> — SIWE, session keys, compile + deploy with your
          browser wallet
        </li>
        <li>
          <a href="/keystores/">Managed Signers</a> — Memory → File → Ledger keystore progression
        </li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Run</h3>
      <pre className="result">pnpm showcase</pre>
    </section>
  );
}
