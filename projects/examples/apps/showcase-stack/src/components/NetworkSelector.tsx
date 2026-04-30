import { NETWORKS, useNetwork } from '../contexts/NetworkProvider.js';

export function NetworkSelector() {
  const { network, setNetwork } = useNetwork();
  return (
    <div className="seg">
      {NETWORKS.map((n) => (
        <button
          key={n.id}
          type="button"
          aria-pressed={network.id === n.id}
          className={network.id === n.id ? 'seg-item active' : 'seg-item'}
          title={n.description}
          onClick={() => setNetwork(n.id)}
        >
          {n.label}
        </button>
      ))}
    </div>
  );
}
