export function AboutPanel() {
  return (
    <section className="panel">
      <h2>About — Backend showcase</h2>
      <p className="panel-desc">
        Demonstrates the <strong>backend-powered</strong> surface of{' '}
        <code className="mono">@cfxdevkit/*</code>: SDK operations that run without a
        user-controlled browser wallet. A managed in-browser key derived from a fixed development
        mnemonic acts as the signer so all operations can be exercised without MetaMask or Fluent.
      </p>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>What's here</h3>
      <ul className="mono" style={{ lineHeight: 1.7 }}>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Core RPC</strong> — Core Space client, address
          codecs (base32 ↔ hex), bridge helpers, epoch / block queries
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Compiler</strong> — server-side{' '}
          <code>solc</code> pipeline via <code>showcase-backend</code>; pick a template, compile,
          deploy with the managed key
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Network status</strong> — ping every public
          chain in <code>listChains()</code> (both spaces)
        </li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Sister sections</h3>
      <ul className="mono" style={{ lineHeight: 1.7 }}>
        <li>
          <a href="/browser/">Browser showcase</a> — BIP-39 / HD keys, browser wallets (Fluent /
          MetaMask), sign / send without a backend
        </li>
        <li>
          <a href="/stack/">Combined showcase</a> — SIWE, session keys, compile + deploy with a real
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
