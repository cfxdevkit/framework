/**
 * NetworkSelector — three-way segmented control: Mainnet | Testnet | Local.
 *
 * Local is disabled because the browser showcase has no CORS proxy to reach
 * a local node. Selecting Mainnet or Testnet updates the global NetworkContext
 * which drives both wagmi (eSpace) and use-wallet-react (Core) chain logic.
 */
import { NETWORKS, useNetwork } from '../contexts/NetworkContext.js';

export function NetworkSelector() {
  const { network, setNetwork } = useNetwork();

  return (
    <div className="seg" title="Active network — affects all providers">
      {NETWORKS.map((n) => (
        <button
          key={n.id}
          type="button"
          aria-pressed={network.id === n.id}
          className={`seg-item${network.id === n.id ? ' active' : ''}`}
          onClick={() => setNetwork(n.id)}
        >
          {n.label}
        </button>
      ))}
      <button
        type="button"
        className="seg-item"
        disabled
        title="Local devnode requires a CORS proxy; not available in the browser showcase"
      >
        Local
      </button>
    </div>
  );
}
