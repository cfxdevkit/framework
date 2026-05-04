import { CorePill } from './WalletBarCorePill.js';
import { ESpacePill } from './WalletBarESpacePill.js';

export function WalletBar() {
  return (
    <div className="dual-wallet-bar">
      <ESpacePill />
      <span className="dual-wallet-divider" aria-hidden="true">
        |
      </span>
      <CorePill />
    </div>
  );
}
