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
          <strong style={{ color: 'var(--accent)' }}>Wallet</strong> — local-mnemonic stand-in for a
          browser wallet; exposes a <code>Signer</code> via React context
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Mnemonic / Derive</strong> — BIP-39 +
          dual-space HD derivation (eSpace m/44'/60'/A'/0/i + Core m/44'/503'/A'/0/i)
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Keystore</strong> —
          <code>createMemoryKeystore()</code>: put / list / has / getSigner with optional capability
          binding, message sign + recovery round-trip
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>SIWE</strong> — full nonce → sign → verify →
          /me round trip against <code>@cfxdevkit/example-showcase-backend</code>
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Session Key</strong> —
          <code>createSessionKey()</code> with capability (chains / contracts / selectors /
          maxValuePerTx / notAfter); attestation issued + verified server-side
        </li>
        <li>
          <strong style={{ color: 'var(--accent)' }}>Network</strong> — createClient +
          getBlockNumber/getEpochNumber against listChains() (both spaces)
        </li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Not yet wired up (skeletons only)</h3>
      <ul className="mono muted" style={{ lineHeight: 1.7 }}>
        <li>@cfxdevkit/react — generic React bindings</li>
        <li>@cfxdevkit/defi-react — DeFi-specific components</li>
        <li>@cfxdevkit/wallet-connect — browser-wallet (Fluent/MetaMask) integration</li>
        <li>@cfxdevkit/theme — design tokens / theme provider</li>
        <li>Contract interaction tab (read/write via active signer)</li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Run</h3>
      <pre className="result">{`# terminal 1 — backend (SIWE + session-key)
pnpm --filter @cfxdevkit/example-showcase-backend dev

# terminal 2 — frontend
pnpm --filter @cfxdevkit/example-showcase dev`}</pre>
    </section>
  );
}
