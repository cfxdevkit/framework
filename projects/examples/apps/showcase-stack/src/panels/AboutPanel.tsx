/**
 * AboutPanel — explains what showcase-stack demonstrates.
 */
export function AboutPanel() {
  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>
          What is showcase-stack?
        </h3>
        <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6 }}>
          <strong>showcase-stack</strong> bridges browser wallets (MetaMask, Fluent) with the
          cfxdevkit showcase-backend to demonstrate every available API endpoint combined with real
          wallet signing.
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6 }}>
          Unlike the base <code className="mono">showcase</code> (which uses a derived in-browser
          wallet) or <code className="mono">showcase-browser</code> (which only shows wallet
          capabilities), this app is the full-stack merge: browser signing + server-side
          infrastructure.
        </p>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>Architecture</h3>
        <table className="status-table">
          <tbody>
            <tr>
              <th>showcase-stack (this app)</th>
              <td>port 5175 · React + Vite</td>
            </tr>
            <tr>
              <th>showcase-backend</th>
              <td>port 5174 · Express · devnode / auth / compiler</td>
            </tr>
            <tr>
              <th>eSpace wallet</th>
              <td>wagmi · non-Fluent injected EIP-1193 wallets</td>
            </tr>
            <tr>
              <th>Core wallet</th>
              <td>direct window.conflux connector · Fluent Core</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>Panels</h3>
        <table className="status-table">
          <tbody>
            <tr>
              <th>DevNode Control</th>
              <td>
                Start / stop / restart / wipe the local xcfx devnode. View genesis accounts and copy
                private keys for use in Session Key.
              </td>
            </tr>
            <tr>
              <th>Sign-In With Ethereum</th>
              <td>Full SIWE (EIP-4361) round-trip: nonce → browser sign → backend verify → JWT.</td>
            </tr>
            <tr>
              <th>Session Key Delegation</th>
              <td>
                Backend issues a session keypair attested against a parent private key with
                capability constraints (chains, contracts, selectors, value, TTL).
              </td>
            </tr>
            <tr>
              <th>Solidity Compiler</th>
              <td>
                Pick a template, edit Solidity in-browser, compile server-side, deploy to eSpace
                with your connected browser wallet.
              </td>
            </tr>
            <tr>
              <th>Contract Interaction</th>
              <td>
                ABI-driven read / write console. Paste any address + ABI and call functions via
                wagmi.
              </td>
            </tr>
            <tr>
              <th>Network Status</th>
              <td>Live RPC health: Core + eSpace block numbers, latency, backend reachability.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>Quick start</h3>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 2 }}>
          <li>
            Run <code className="mono">pnpm --filter @cfxdevkit/example-showcase-backend dev</code>{' '}
            on port 5174
          </li>
          <li>
            Run <code className="mono">pnpm --filter @cfxdevkit/example-showcase-stack dev</code> on
            port 5175
          </li>
          <li>
            Switch network to <strong>Local</strong> and start the DevNode
          </li>
          <li>Import a genesis account into MetaMask or another non-Fluent eSpace wallet</li>
          <li>Connect the wallet and explore SIWE, Session Keys, Compiler, and Contracts</li>
        </ol>
      </div>
    </div>
  );
}
