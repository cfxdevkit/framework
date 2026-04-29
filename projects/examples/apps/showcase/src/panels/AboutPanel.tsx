export function AboutPanel() {
  return (
    <section className="panel">
      <h2>About this showcase</h2>
      <p className="panel-desc">
        Live demos of the currently-implemented surface of{' '}
        <code className="mono">@cfxdevkit/*</code>.
      </p>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>What's wired up</h3>
      <ul className="mono" style={{ lineHeight: 1.7 }}>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Mnemonic</strong> — generateMnemonic /
          validateMnemonic (BIP-39, English wordlist)
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Derive</strong> — deriveDualAccounts:
          dual-space HD derivation (eSpace m/44'/60'/A'/0/i + Core m/44'/503'/A'/0/i), base32
          encoding via <code>cive</code>
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Network Status</strong> — createClient +
          getBlockNumber/getEpochNumber against listChains() (mainnet/testnet/local for both spaces)
        </li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Not yet wired up (skeletons only)</h3>
      <ul className="mono muted" style={{ lineHeight: 1.7 }}>
        <li>@cfxdevkit/react — generic React bindings</li>
        <li>@cfxdevkit/defi-react — DeFi-specific components</li>
        <li>@cfxdevkit/wallet-connect — wallet connection UI</li>
        <li>@cfxdevkit/theme — design tokens / theme provider</li>
      </ul>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Tabs will be added here as those packages gain implementations.
      </p>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Run</h3>
      <pre className="result">{`pnpm --filter @cfxdevkit/example-showcase dev`}</pre>
    </section>
  );
}
