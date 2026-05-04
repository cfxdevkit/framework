import { CoreSection } from './unified-send-core.js';
import { ESpaceSection } from './unified-send-espace.js';

export function UnifiedSendPanel() {
  return (
    <section className="panel">
      <h2>Send transaction</h2>
      <p className="panel-desc">
        <strong>eSpace</strong> — wagmi <code className="mono">useSendTransaction</code> + receipt
        watch. <strong>Core</strong> — Fluent <code className="mono">cfx_sendTransaction</code> +
        polling. Default: 0 CFX self-transfer (gas-only). Connect either wallet inline.
      </p>
      <div className="dual-cols">
        <ESpaceSection />
        <CoreSection />
      </div>
    </section>
  );
}
