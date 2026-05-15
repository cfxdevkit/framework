# @cfxdevkit/ui-core

Headless wallet, network, and token-selection controllers for reusable Conflux UI.

## Responsibilities

- Own reusable web3 UI state and controller logic with no styling assets.
- Depend only on lower-level framework packages and generic peers such as React and wagmi.
- Stay safe to consume from Tailwind packages, app-level wrappers, or product-specific shells.

## Current surfaces

- `useWalletSession`
- `useNetworkSwitchController`
- `normalizeAddress`
- `wcfxAddress`
- `resolveTokenAddress`
- `getPairedTokens`
- `useSelectableTokens`

## Usage

```tsx
import { useNetworkSwitchController, useWalletSession } from '@cfxdevkit/ui-core';

export function WalletGate({ expectedChainId }: { expectedChainId: number }) {
  const wallet = useWalletSession();
  const network = useNetworkSwitchController({ expectedChainId });

  if (!wallet.isConnected) {
    return <button onClick={wallet.connect}>Connect wallet</button>;
  }

  if (network.isWrongNetwork) {
    return <button onClick={() => void network.switchNetwork()}>Switch network</button>;
  }

  return <span>{wallet.address}</span>;
}
```

## Rules

- Do not add CSS imports, inline style objects, or product-specific visual tokens here.
- Do not import app packages such as CAS or showcase packages.
- Add tests for every new controller or helper before expanding consumers.