export function AboutPanel() {
  return (
    <section className="panel">
      <h2>About this showcase</h2>
      <p className="panel-desc">
        Browser-only demos of <strong>external user wallets</strong> on Conflux: every connect /
        sign / send action goes through a wallet the user controls. No mnemonic stand-in, no backend
        signer.
      </p>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Stacks demonstrated</h3>
      <ul className="mono" style={{ lineHeight: 1.8 }}>
        <li>
          <strong style={{ color: '#7b61ff' }}>wagmi</strong> + viem +{' '}
          <code>@tanstack/react-query</code> for the eSpace EIP-1193 path (MetaMask, Brave, OKX,
          Rabby, …). Fluent is intentionally excluded from wagmi.
        </li>
        <li>
          <strong style={{ color: '#e8820c' }}>direct Core connector</strong> for Fluent Core:{' '}
          <code>window.conflux</code>, <code>cfx_*</code> RPC, and base32 addresses.
        </li>
        <li>
          <strong style={{ color: '#4cc9f0' }}>raw window scan</strong> — diagnose detection issues
          by polling the actual injected globals.
        </li>
        <li>
          <strong style={{ color: '#80ed99' }}>@cfxdevkit/core</strong> for pure helpers: base32 ↔
          hex codec, drip / CFX / Gdrip math, public-chain catalogue + ping.
        </li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Sister apps</h3>
      <ul className="mono" style={{ lineHeight: 1.8 }}>
        <li>
          <code>@cfxdevkit/example-showcase-backend</code> — Node-side flows: devnode mgmt,
          compiler, SIWE issuer, session-key attestation.
        </li>
        <li>
          <code>@cfxdevkit/example-showcase</code> — original mixed showcase (mnemonic stand-in +
          backend).
        </li>
        <li>
          <em>Forthcoming</em> showcase combining <strong>user wallet ↔ backend</strong>: SIWE flows
          that auth a user wallet against a backend issuer; session keys minted by a backend bound
          to a user-controlled parent signer.
        </li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Excluded by design</h3>
      <ul className="mono muted" style={{ lineHeight: 1.8 }}>
        <li>
          Mnemonic stand-in / in-browser keystore — those belong to demo-wallet showcases, not
          external-wallet showcases.
        </li>
        <li>
          Local devnode (xcfx) — no CORS for browser preflights; the backend showcase proxies it.
        </li>
        <li>Solidity compiler — solc execution lives server-side.</li>
      </ul>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Run</h3>
      <pre className="result">{`pnpm --filter @cfxdevkit/example-showcase-browser dev
# → http://127.0.0.1:5175`}</pre>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Credits</h3>
      <p className="muted" style={{ fontSize: 12 }}>
        UI/UX patterns adapted from{' '}
        <code className="mono">devkit-workspace/templates/wallet-probe</code> and{' '}
        <code className="mono">devkit-workspace/packages/ui-shared</code>.
      </p>
    </section>
  );
}
