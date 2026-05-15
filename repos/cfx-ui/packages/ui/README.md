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
- Provide the wagmi wallet context before rendering wallet or network components.
- Use app-level wrappers when an app needs product-specific copy, layout, or auth flows.

## Default theming

- Components ship with Tailwind utility classes only.
- No component-local CSS files or inline style objects are allowed in this package.
- Consumers customize visuals with `className`, slot-level class props, or wrappers.

## Current surfaces

- `SegmentedControl`
- `WalletButton`
- `WalletStatusChip`
- `WalletProviderCard`
- `WalletPickerModal`
- `NetworkSwitchNotice`
- `TokenSelect`
- `TokenAmountField`
- `TokenPairSelector`
- `AssetConversionPanel`

## Usage

```tsx
import {
  NetworkSwitchNotice,
  SegmentedControl,
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
      <TokenAmountField
        amount=""
        onAmountChange={() => undefined}
        onTokenChange={() => undefined}
        tokens={tokens}
        tokenValue={tokens[0]?.address ?? ''}
      />
    </div>
  );
}
```

## Customization example

```tsx
<WalletStatusChip
  address={address}
  className="border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
/>
```

## Boundary

- `@cfxdevkit/ui` owns reusable styled wallet status, wallet selection, segmented-control, network notice, and token-selection surfaces.
- `@cfxdevkit/wallet-connect/ui` remains only for legacy consumers that have not yet moved to the shared `ui` package.
- Product-specific auth, session, and orchestration UI stays in app-level wrappers.