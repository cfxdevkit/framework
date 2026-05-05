import { ShowcaseNav, ShowcaseOpsPanel } from '@cfxdevkit/example-showcase-ui';

const sections = [
  {
    href: '/showcase/',
    title: 'SDK Showcase',
    eyebrow: '1 · SDK',
    summary:
      'Start with keys, dual-space clients, codecs, compiler templates, and local network status.',
    stack: 'React + @cfxdevkit/*',
  },
  {
    href: '/stack/',
    title: 'Full-Stack Wallet Showcase',
    eyebrow: '2 · Backend',
    summary:
      'Continue with backend-mediated SIWE, session keys, Solidity compile/deploy, and devnode operations.',
    stack: 'React + wagmi + showcase-backend',
  },
  {
    href: '/browser/',
    title: 'Browser Wallet Showcase',
    eyebrow: '3 · Browser wallets',
    summary:
      'External injected wallet diagnostics for Fluent Core and non-Fluent eSpace providers.',
    stack: 'React + wagmi + provider probes',
  },
  {
    href: '/hardware/',
    title: 'Keystore Management Showcase',
    eyebrow: '4 · Keystores',
    summary:
      'Memory, encrypted file, Ledger, and future hardware backend coverage for managed signing.',
    stack: 'React + keystore providers + WebHID',
  },
] as const;

const routes = [
  { label: 'backend health', value: '/api/health' },
  { label: 'devnode status', value: '/api/devnode/status' },
  { label: 'compiler catalog', value: '/api/compile/catalog' },
  { label: 'Core RPC proxy', value: '/api/rpc/core' },
  { label: 'eSpace RPC proxy', value: '/api/rpc/espace' },
] as const;

const coverage = [
  {
    title: 'Core Runtime',
    packages: '@cfxdevkit/core · @cfxdevkit/protocol · @cfxdevkit/devnode',
    app: 'SDK + Stack',
    detail: 'dual-space clients, local Core/eSpace RPC proxy, addresses, units, network status',
  },
  {
    title: 'Keys & Wallets',
    packages: '@cfxdevkit/services · @cfxdevkit/wallet',
    app: 'SDK + Browser + Keystores',
    detail:
      'memory/file/ledger keystores, browser wallets, Fluent Core/eSpace, hardware signer slots',
  },
  {
    title: 'Solidity',
    packages: '@cfxdevkit/contracts · @cfxdevkit/compiler · @cfxdevkit/abis',
    app: 'SDK + Stack + Keystores',
    detail: 'template catalog, compile endpoints, ABI read/write console, deploy flows',
  },
  {
    title: 'UI & Tooling Gaps',
    packages: '@cfxdevkit/theme · @cfxdevkit/react · @cfxdevkit/cli · @cfxdevkit/llm-tools',
    app: 'Planned sections',
    detail:
      'theme dogfooding started here; CLI, LLM tools, automation, and domain packages need demos',
  },
] as const;

export function App() {
  return (
    <main className="shell">
      <ShowcaseNav
        current="gateway"
        title="cfxdevkit showcase"
        subtitle="linear gateway workflow"
      />
      <header className="hero">
        <div>
          <p className="kicker">cfxdevkit examples</p>
          <h1>Showcase Gateway</h1>
          <p className="lede">
            One stable development URL for the showcase apps, local backend, devnode controls,
            compiler routes, and RPC proxy paths.
          </p>
        </div>
        <section className="status-panel" aria-label="Gateway routes">
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

      <section className="section-grid" aria-label="Showcase sections">
        {sections.map((section) => (
          <a className="section-card" href={section.href} key={section.href}>
            <span className="eyebrow">{section.eyebrow}</span>
            <strong>{section.title}</strong>
            <span>{section.summary}</span>
            <code>{section.stack}</code>
          </a>
        ))}
      </section>

      <section className="coverage-panel" aria-label="Codebase coverage">
        <div>
          <p className="kicker">coverage map</p>
          <h2>Current Codebase Surface</h2>
          <p className="lede">
            The showcase is now arranged as a linear walkthrough. The map below keeps the covered
            packages and the remaining gaps visible while the apps evolve.
          </p>
        </div>
        <div className="coverage-grid">
          {coverage.map((item) => (
            <article className="coverage-card" key={item.title}>
              <strong>{item.title}</strong>
              <code>{item.packages}</code>
              <span>{item.app}</span>
              <span>{item.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="ops-band" aria-label="Startup notes">
        <div>
          <h2>Run Everything</h2>
          <p>
            Start the gateway stack from the monorepo root. The child apps stay on fixed internal
            ports, while this page remains the public entry point.
          </p>
        </div>
        <pre>pnpm showcase</pre>
      </section>
    </main>
  );
}
