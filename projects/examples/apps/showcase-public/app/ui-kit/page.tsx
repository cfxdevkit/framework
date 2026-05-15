'use client';

import {
  CodeSnippet,
  DemoCard,
  Metric,
  Notice,
  SegmentedControl,
  StatusGrid,
  WalletButton,
} from '@cfxdevkit/example-showcase-ui';
import { SiteLayout } from '../site-layout';
import { UiFoundationCatalog } from './ui-foundation-catalog';

const TAILWIND_THEME_SNIPPET = `@import "tailwindcss";
@source "../../../../../repos/cfx-ui/packages/ui/src";

@theme {
  --color-brand-500: #22c55e;
  --color-brand-600: #16a34a;
  --color-surface-950: #020617;
  --radius-panel: 1.5rem;
  --font-ui: "Satoshi", sans-serif;
}`;

const APP_CUSTOMIZATION_SNIPPET = `import {
  Notice,
  SegmentedControl,
  StatusGrid,
  Metric,
  WalletButton,
} from '@cfxdevkit/ui';

export function PortfolioHeader() {
  return (
    <section className="grid gap-5 rounded-[2rem] border border-stone-900/10 bg-[linear-gradient(135deg,#fff4dd_0%,#ffd9b8_52%,#ffb57c_100%)] p-6 text-stone-900 shadow-[0_24px_60px_rgba(120,53,15,0.16)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-600">
            Treasury cockpit
          </p>
          <WalletButton
            connectLabel="Authorize desk"
            disconnectedClassName="bg-stone-900 text-[#fff4dd] hover:bg-stone-800"
            connectedClassName="border-stone-900/15 bg-white/65 text-stone-900 hover:bg-white/80"
          />
        </div>
        <div className="space-y-2">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.04em]">
            Shared primitives can still feel like a bespoke treasury workspace.
          </h2>
          <p className="max-w-lg text-sm leading-6 text-stone-700">
            Layout, motion, copy, and visual hierarchy stay app-level while the reusable controls
            keep the implementation surface shared.
          </p>
        </div>
        <SegmentedControl
          className="w-full border-stone-900/10 bg-white/55"
          activeOptionClassName="bg-stone-900 text-[#fff4dd]"
          inactiveOptionClassName="text-stone-700 hover:bg-white/70"
          options={[
            { label: 'Mainnet', value: 'mainnet' },
            { label: 'Treasury', value: 'treasury' },
            { label: 'Yield', value: 'yield' },
          ]}
          onChange={() => undefined}
          value="treasury"
        />
        <Notice className="border-stone-900/10 bg-white/60 text-stone-800" tone="neutral">
          Approval rules, workflow routing, analytics, and operator policy still belong to the
          product wrapper.
        </Notice>
      </div>
      <div className="space-y-3 rounded-[1.5rem] border border-white/60 bg-white/45 p-4 backdrop-blur">
        <StatusGrid columns={2}>
          <Metric
            className="border-stone-900/10 bg-white/80"
            label="Portfolio"
            value="$12.4k"
            delta="+4.2%"
          />
          <Metric
            className="border-stone-900/10 bg-white/80"
            label="Gas runway"
            value="18 days"
          />
          <Metric
            className="border-stone-900/10 bg-white/80"
            label="Settlement"
            value="4 queues live"
          />
        </StatusGrid>
        <div className="rounded-[1.25rem] border border-dashed border-stone-900/15 px-4 py-3 text-xs uppercase tracking-[0.24em] text-stone-600">
          Warm palette, editorial copy block, stacked metrics, and different control treatment all
          come from app-level composition.
        </div>
      </div>
    </section>
  );
}`;

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function UiKitPage() {
  return (
    <SiteLayout>
      <DemoCard
        title="Tailwind Theme Syntax"
        description="The shared UI package is Tailwind-first. The old --cfx-color token table was stale documentation from the pre-foundation theme layer, not the current shared-ui contract."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <CodeSnippet label="app/globals.css" code={TAILWIND_THEME_SNIPPET} />
          <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Theme preview</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="h-16 rounded-2xl border border-emerald-400/20 bg-emerald-400/20" />
              <div className="h-16 rounded-2xl border border-blue-400/20 bg-blue-400/20" />
              <div className="h-16 rounded-2xl border border-amber-300/20 bg-amber-300/20" />
            </div>
            <Notice className="mt-4">
              Apps own their Tailwind theme values and brand wrappers. `@cfxdevkit/ui` only ships
              reusable components expressed in utility classes.
            </Notice>
          </div>
        </div>
      </DemoCard>

      <UiFoundationCatalog />

      <DemoCard
        title="App-level Customization"
        description="Compose the shared components in local wrappers for product copy, auth boundaries, analytics, and layout. Customize the visuals with Tailwind class props instead of reviving the old token catalog."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <CodeSnippet label="PortfolioHeader.tsx" code={APP_CUSTOMIZATION_SNIPPET} />
          <div className="grid gap-5 rounded-[2rem] border border-stone-900/10 bg-[linear-gradient(135deg,#fff4dd_0%,#ffd9b8_52%,#ffb57c_100%)] p-6 text-stone-900 shadow-[0_24px_60px_rgba(120,53,15,0.16)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-600">
                Treasury cockpit
              </p>
              <WalletButton
                connectLabel="Authorize desk"
                disconnectedClassName="bg-stone-900 text-[#fff4dd] hover:bg-stone-800"
                connectedClassName="border-stone-900/15 bg-white/65 text-stone-900 hover:bg-white/80"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-semibold tracking-[-0.04em]">
                The same shared controls can anchor a completely different product surface.
              </h3>
              <p className="text-sm leading-6 text-stone-700">
                This variation swaps the dark dashboard shell for a warm treasury briefing layout,
                keeps the reusable primitives, and leaves orchestration logic in the app wrapper.
              </p>
            </div>
            <SegmentedControl
              value="treasury"
              onChange={() => undefined}
              className="w-full border-stone-900/10 bg-white/55"
              activeOptionClassName="bg-stone-900 text-[#fff4dd]"
              inactiveOptionClassName="text-stone-700 hover:bg-white/70"
              options={[
                { label: 'Mainnet', value: 'mainnet' },
                { label: 'Treasury', value: 'treasury' },
                { label: 'Yield', value: 'yield' },
              ]}
            />
            <Notice className="border-stone-900/10 bg-white/60 text-stone-800" tone="neutral">
              App wrappers keep approval policy, product copy, auth rules, and event orchestration
              local while the shared package owns the reusable shell components.
            </Notice>
            <div className="rounded-[1.5rem] border border-white/60 bg-white/45 p-4 backdrop-blur">
              <StatusGrid columns={2}>
                <Metric
                  className="border-stone-900/10 bg-white/80"
                  label="Portfolio"
                  value="$12.4k"
                  delta="+4.2%"
                />
                <Metric
                  className="border-stone-900/10 bg-white/80"
                  label="Gas runway"
                  value="18 days"
                />
                <Metric
                  className="border-stone-900/10 bg-white/80"
                  label="Settlement"
                  value="4 queues live"
                />
              </StatusGrid>
            </div>
          </div>
        </div>
      </DemoCard>
    </SiteLayout>
  );
}
