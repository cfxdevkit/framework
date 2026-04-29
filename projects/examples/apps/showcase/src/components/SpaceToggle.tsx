import { useNetwork } from '../contexts/NetworkProvider.js';

/**
 * Core ↔ eSpace toggle. Both spaces are always *available* (the active
 * network builds clients for each); this just picks which one the
 * single-space legacy panels (CorePanel, ContractPanel) read via
 * `useChain()`.
 */
export function SpaceToggle() {
  const { space, setSpace, core, espace } = useNetwork();
  return (
    <div className="seg">
      <button
        type="button"
        aria-pressed={space === 'core'}
        className={space === 'core' ? 'seg-item active' : 'seg-item'}
        title={`Core Space — chainId ${core.id}`}
        onClick={() => setSpace('core')}
      >
        Core
      </button>
      <button
        type="button"
        aria-pressed={space === 'espace'}
        className={space === 'espace' ? 'seg-item active' : 'seg-item'}
        title={`eSpace — chainId ${espace.id}`}
        onClick={() => setSpace('espace')}
      >
        eSpace
      </button>
    </div>
  );
}
