# @cfxdevkit/ui

Tailwind-first reusable Conflux UI components built on `@cfxdevkit/ui-core`.

## Install

```json
{
  "dependencies": {
    "@cfxdevkit/ui": "workspace:*",
    "@cfxdevkit/ui-core": "workspace:*",
    "react": "^19.2.5",
    "wagmi": "^3.6.9"
  }
}
```

## Setup

- Ensure the consuming app already compiles Tailwind utility classes.
- Include `@cfxdevkit/ui` in the app's Tailwind source scan (e.g., via `content: ["../node_modules/@cfxdevkit/ui/dist/**/*"]`).
- Provide the wagmi `WalletProvider` context before rendering wallet or network components.
- Use app-level wrappers for product-specific copy, layout, or auth flows.

```css
@import "tailwindcss";
@source "../node_modules/@cfxdevkit/ui/dist";

@theme {
  --color-brand-500: #22c55e;
  --color-brand-600: #16a34a;
  --radius-panel: 1.25rem;
  --font-ui: "Satoshi", sans-serif;
}
```

## Default theming

- Components ship with Tailwind utility classes only.
- No component-local CSS files or inline style objects are allowed in this package.
- Consumers customize visuals with `className`, slot-level class props (e.g., `activeOptionClassName`, `buttonClassName`), or wrappers.

## Current surfaces

| Sub-path | Exports |
|----------|---------|
| `.` | `AppShell`, `Topbar`, `MainGrid`, `AssetConversionPanel`, `Field`, `IconButton`, `Metric`, `NetworkSwitchNotice`, `Notice`, `Panel`, `PanelBody`, `SegmentedControl`, `StatusGrid`, `TokenAmountField`, `TokenPairSelector`, `TokenSelect`, `WalletButton`, `WalletPickerModal`, `WalletProviderCard`, `WalletStatusChip` |
| `./shell` | `AppShell`, `Topbar`, `MainGrid` |
| `./panel` | `Panel`, `PanelBody`, `AssetConversionPanel` |
| `./form` | `Field`, `TokenAmountField`, `TokenPairSelector`, `TokenSelect`, `SegmentedControl`, `IconButton` |
| `./data-display` | `Metric`, `StatusGrid` |
| `./feedback` | `Notice`, `NetworkSwitchNotice` |
| `./wallet` | `WalletButton`, `WalletPickerModal`, `WalletProviderCard`, `WalletStatusChip` |

## Usage

```tsx
import {
  Field,
  IconButton,
  Metric,
  NetworkSwitchNotice,
  Notice,
  SegmentedControl,
  StatusGrid,
  TokenAmountField,
  WalletButton,
} from '@cfxdevkit/ui';

export function SwapHeader({ chainId, tokens }: { chainId: number; tokens: Array<{ address: string; symbol: string }> }) {
  return (
    <div className="space-y-4">
      <SegmentedControl
        value="testnet"
        onChange={() => undefined}
        options={[
          { label: 'Mainnet', value: 'mainnet' },
          { label: 'Testnet', value: 'testnet' },
        ]}
      />
      <WalletButton className="w-full" connectLabel="Connect eSpace wallet" />
      <NetworkSwitchNotice chainName="Conflux eSpace" expectedChainId={chainId} />
      <Notice tone="warning">Product copy and auth gating stay in your wrapper layer.</Notice>
      <TokenAmountField
        amount=""
        onAmountChange={() => undefined}
        onTokenChange={() => undefined}
        tokens={tokens}
        tokenValue={tokens[0]?.address ?? ''}
      />
      <Field label="RPC endpoint" hint="Validation and persistence stay app-level.">
        <input className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2" />
      </Field>
      <StatusGrid columns={2}>
        <Metric label="Portfolio" value="$12.4k" delta="+4.2%" />
        <Metric label="Gas budget" value="$42.80" />
      </StatusGrid>
    </div>
  );
}
```

## Customization example

```tsx
function PortfolioHeader() {
  return (
    <div className="rounded-[1.5rem] border border-emerald-400/20 bg-slate-950/90 p-5">
      <SegmentedControl
        className="bg-slate-900/80"
        activeOptionClassName="bg-emerald-400 text-slate-950"
        options={[
          { label: 'Mainnet', value: 'mainnet' },
          { label: 'Testnet', value: 'testnet' },
        ]}
        onChange={() => undefined}
        value="testnet"
      />
      <WalletButton
        connectLabel="Connect portfolio"
        disconnectedClassName="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
      />
      <Notice tone="warning" className="mt-4 border-amber-300/20 bg-amber-300/10 text-amber-50">
        Product-specific messaging stays local while the shared package owns the shell styling.
      </Notice>
    </div>
  );
}
```

## Boundary

- `@cfxdevkit/ui` owns reusable styled wallet status, wallet selection, segmented-control, network notice, and token-selection surfaces.
- `@cfxdevkit/wallet-connect/ui` remains only for legacy consumers that have not yet moved to the shared `ui` package.
- Product-specific auth, session, and orchestration UI stays in app-level wrappers.

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 33b4843251a4340fc9a9571d145afea92b5775695d0ddc7fd597086eee7ae93d -->
