/**
 * AboutPanel — explains what the combined showcase demonstrates.
 */
export function AboutPanel() {
  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>
          What is the Combined showcase?
        </h3>
        <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6 }}>
          The <strong>combined showcase</strong> is the full-stack integration layer: it pairs a
          user-controlled browser wallet (MetaMask, Fluent) with the cfxdevkit showcase-backend to
          demonstrate every API endpoint that requires <em>both</em> a backend service and a signed
          transaction or message from the user's real wallet.
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 13, lineHeight: 1.6 }}>
          The <a href="/showcase/">backend showcase</a> shows backend-only operations with a managed
          key. The <a href="/browser/">browser showcase</a> shows browser-only operations. This app
          is the combination of both worlds.
        </p>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>Architecture</h3>
        <table className="status-table">
          <tbody>
            <tr>
              <th>showcase-combined (this app)</th>
              <td>port 5182 · React + Vite</td>
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
              <td>
                Full SIWE (EIP-4361) round-trip: nonce → browser wallet sign → backend verify → JWT.
              </td>
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
                ABI-driven read / write console. Paste any address + ABI and call functions via your
                connected browser wallet.
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
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>Run</h3>
        <pre className="result">pnpm showcase</pre>
      </div>
    </div>
  );
}
