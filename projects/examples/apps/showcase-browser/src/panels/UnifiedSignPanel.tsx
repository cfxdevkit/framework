import { CoreSection } from './unified-sign-core.js';
import { ESpaceSection } from './unified-sign-espace.js';

export function UnifiedSignPanel() {
  return (
    <section className="panel">
      <h2>Sign message</h2>
      <p className="panel-desc">
        <strong>eSpace</strong> — EIP-191 personal_sign and EIP-712 typed data with in-browser
        verification via viem. <strong>Core</strong> — personal_sign and CIP-23 typed data via
        Fluent's Core provider. Each column shows a connect button when its wallet is not active.
      </p>
      <div className="dual-cols">
        <ESpaceSection />
        <CoreSection />
      </div>
    </section>
  );
}
