## P1 — Create sub-page routes

- [x] **P1.1** Create `app/keys/memory/page.tsx`:
  ```tsx
  import { SiteLayout } from '../../site-layout';
  import { MemoryPanel } from '../memory-panel';
  export default function MemoryPage() {
    return <SiteLayout><BackLink /><MemoryPanel /></SiteLayout>;
  }
  ```

- [x] **P1.2** Create `app/keys/ledger/page.tsx` — same pattern, renders `<LedgerPanel />`

- [x] **P1.3** Create `app/keys/onekey/page.tsx` — renders `<OneKeyPanel />` and `<OneKeyReferralCard />`
  (extract referral card out of `onekey-panel.tsx` if not already separate; it is in `onekey-widgets.tsx`)

- [x] **P1.4** Create `app/keys/device-link-card.tsx` — a small card component:
  ```tsx
  interface DeviceLinkCardProps { href: string; title: string; features: string[]; }
  export function DeviceLinkCard({ href, title, features }: DeviceLinkCardProps) { ... }
  ```
  Uses `PANEL_STYLE` + `next/link`. Shows title, feature badge list, "Open demo →" CTA.

- [x] **P1.5** Add a shared `BackLink` component (or inline) in each sub-page:
  `← Keys & Signers` as a `next/link` to `/keys`

## P2 — Update /keys overview

- [x] **P2.1** In `app/keys/page.tsx`, replace `<HardwareWalletSection />` with:
  ```tsx
  <DemoCard title="Hardware & Software Signers" description="...">
    <CapabilityMatrix />
    <div style={GRID_STYLE}>
      <DeviceLinkCard href="/keys/memory" title="Memory Wallet" features={['In-browser', 'eSpace + Core', 'EIP-712 ✅']} />
      <DeviceLinkCard href="/keys/ledger" title="Ledger" features={['WebHID', 'eSpace + Core', 'EIP-712 ❌']} />
      <DeviceLinkCard href="/keys/onekey" title="OneKey Classic S1 ★" features={['WebUSB', 'eSpace + Core', 'EIP-712 ✅', 'CIP-23 ✅']} />
    </div>
  </DemoCard>
  ```

- [x] **P2.2** Remove `import { HardwareWalletSection }` from `page.tsx`

- [x] **P2.3** Delete `app/keys/hardware-wallet-section.tsx` (logic now lives in sub-pages)

## Validate

- [x] **V.1** `pnpm run build` passes — all routes compile
- [x] **V.2** `/keys` renders the overview with 3 device link cards
- [x] **V.3** `/keys/onekey` renders only OneKey panel (no Ledger imports in bundle)
- [x] **V.4** `/keys/ledger` renders only Ledger panel
- [x] **V.5** Each sub-page has a back link to `/keys`
- [x] **V.6** `pnpm run typecheck` passes for `showcase-public`
