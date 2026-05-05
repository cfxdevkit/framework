import { ShowcaseNav, ShowcaseOpsPanel } from '@cfxdevkit/example-showcase-ui';

const sections = [
  {
    tier: 'Backend',
    href: '/showcase/',
    title: 'Backend Showcase',
    eyebrow: 'Core RPC · Compiler · Network',
    summary:
      'Core Space SDK surface, server-side Solidity compile + managed-key deploy, and live RPC network health.',
    stack: 'React + @cfxdevkit/core · showcase-backend',
  },
  {
    tier: 'Browser',
    href: '/browser/',
    title: 'Browser Showcase',
    eyebrow: 'Keys · Wallets · Sign · Send',
    summary:
      'BIP-39 mnemonic generation, BIP-32/SLIP-0044 dual-space HD derivation, and live Fluent / MetaMask / injected-EIP-1193 wallet operations.',
    stack: 'React + @cfxdevkit/core · wagmi · Fluent',
  },
  {
    tier: 'Combined',
    href: '/stack/',
    title: 'Combined Showcase',
    eyebrow: 'SIWE · Session Keys · Compiler · Contracts',
    summary:
      'DevNode lifecycle, Sign-In With Ethereum, session-key delegation, backend compile + browser-wallet deploy, and ABI-driven contract interaction.',
    stack: 'React + wagmi · showcase-backend',
  },
  {
    tier: 'Combined',
    href: '/keystores/',
    title: 'Managed Signers',
    eyebrow: 'Memory · File · Ledger · Hardware',
    summary:
      'Secure mnemonic management and the full signer spectrum: Memory keystore → encrypted File keystore → Ledger hardware wallet via WebHID.',
    stack: 'React + @cfxdevkit/services · WebHID',
  },
] as const;

const routes = [
  { label: 'backend health', value: '/api/health' },
  { label: 'devnode status', value: '/api/devnode/status' },
  { label: 'compiler catalog', value: '/api/compile/catalog' },
  { label: 'Core RPC proxy', value: '/api/rpc/core' },
  { label: 'eSpace RPC proxy', value: '/api/rpc/espace' },
] as const;

export function App() {
  return (
    <main className="shell">
      <ShowcaseNav
        current="gateway"
        title="cfxdevkit showcase"
        subtitle="backend · browser · combined"
      />
      <header className="hero">
        <div className="hero-text">
          <p className="kicker">cfxdevkit examples</p>
          <h1>Showcase Gateway</h1>
          <p className="lede">
            One stable development URL for the showcase apps, local backend, devnode controls,
            compiler routes, and RPC proxy paths.
          </p>
        </div>
        <section className="routes-panel" aria-label="Gateway routes">
          <span className="status-title">Same-origin backend routes</span>
          {routes.map((route) => (
            <a key={route.value} href={route.value} className="route-link">
              <span>{route.label}</span>
              <code>{route.value}</code>
            </a>
          ))}
        </section>
      </header>

      <ShowcaseOpsPanel />

      <div className="section-grid">
        {sections.map((section) => (
          <a
            className="section-card"
            href={section.href}
            key={section.href}
            data-tier={section.tier.toLowerCase()}
          >
            <div className="card-meta">
              <span className="tier-tag">{section.tier}</span>
              <span className="eyebrow">{section.eyebrow}</span>
            </div>
            <strong>{section.title}</strong>
            <span className="card-summary">{section.summary}</span>
            <code>{section.stack}</code>
          </a>
        ))}
      </div>

      <section className="ops-band" aria-label="Startup notes">
        <div>
          <h2>Run Everything</h2>
          <p>
            Start the full gateway stack from the monorepo root. Child apps stay on fixed internal
            ports — this page is the single public entry point.
          </p>
        </div>
        <pre>pnpm showcase</pre>
      </section>
    </main>
  );
}
