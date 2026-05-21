# @cfxdevkit/wallet-connect

**Scope:** Opinionated wallet-connection bundle for web apps targeting Conflux networks (Core & eSpace), built on top of Wagmi v2 and Viem.

**Responsibilities**
- Pre-configured Wagmi connectors for Conflux chains (Core & eSpace)
- ConnectKit-style UI wiring (via `./ui`)
- SIWE (Sign-In With Ethereum) flow helpers (via `./siwe` and `./auth`)
- FluentCore provider detection and integration

Depends on: `@cfxdevkit/cdk`, optionally `react`, `wagmi`, `viem`.

---

## Install

```bash
npm install @cfxdevkit/wallet-connect
# or
yarn add @cfxdevkit/wallet-connect
# or
pnpm add @cfxdevkit/wallet-connect
```

---

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 57 symbols |
| `./config` | 11 symbols |
| `./hooks` | 3 symbols |
| `./siwe` | 9 symbols |
| `./ui` | 4 symbols |
| `./auth` | 5 symbols |

---

## `.`

### Chains & Config

```ts
export declare const espaceMainnet: Chain;
export declare const espaceTestnet: Chain;
export declare const espaceLocal: Chain;
export declare const SUPPORTED_ESPACE_CHAINS: readonly Chain[];
export declare const CORE_CHAIN_CONFIGS: Record<number, CoreChainConfig>;

export declare function createSupportedEspaceChains(
  options?: CreateSupportedEspaceChainsOptions
): readonly Chain[];

export declare function createConfluxWagmiConfig(
  options?: CreateConfluxWagmiConfigOptions
): wagmi.Config;
```

### Providers & Connectors

```ts
export declare function ConfluxWagmiProviders({
  children,
  config,
  configOptions,
  queryClient,
  queryClientConfig,
}: ConfluxWagmiProvidersProps): React.JSX.Element;

export declare function useEspaceConnectors(): UseEspaceConnectorsReturn;

export declare function getFluentCoreProvider(): FluentProvider | null;
export declare function detectFluentCore(maxMs?: number): Promise<FluentProvider | null>;
export declare function isFluentProvider(provider: unknown): boolean;
```

### Chain Interaction

```ts
export declare function switchEspaceChain(
  provider: Eip1193Provider,
  chain: Chain,
  options?: SwitchChainOptions
): Promise<void>;

export declare function switchConfluxChain(
  provider: FluentProvider,
  chainId: string,
  addParams: ConfluxAddChainParams
): Promise<void>;

export declare function buildAddChainParams(
  target: CoreChainConfig,
  rpcUrl?: string
): ConfluxAddChainParams;

export declare function rpcCoreChainId(provider: FluentProvider): Promise<string | null>;
export declare function rpcCoreAccounts(provider: FluentProvider): Promise<string[]>;
```

### State Helpers

```ts
export declare function deriveCoreState(
  status: string,
  chainId: string | undefined,
  targetHex: string
): CorePillState;

export declare function deriveESpaceState(
  isConnected: boolean,
  chainId: number,
  targetChainId: number
): ESpacePillState;

export declare function needsESpaceSwitch(
  isConnected: boolean,
  connectedChainId: number,
  targetChainId: number
): boolean;

export declare function coreChainLabel(chainId: string | undefined): string;
export declare function espaceChainLabel(chainId: number): string;
```

### Utilities

```ts
export declare function normalizeCoreChainId(raw: string): string;
export declare function getCoreChainConfig(chainIdHex: string): CoreChainConfig | null;
export declare function formatProviderError(error: unknown): string;
export declare function errMsg(error: unknown): string;
```

---

## `./ui`

Exports React components for wallet connection UI (e.g., `ConnectButton`, `WalletPickerModal`).

```ts
export declare function ConnectButton(props?: ConnectButtonProps): React.JSX.Element;
export declare function WalletPickerModal(props: WalletPickerModalProps): React.JSX.Element;
```

---

## `./siwe`

SIWE message generation, parsing, and verification helpers.

```ts
export declare function generateSiweNonce(options?: GenerateSiweNonceOptions): string;
export declare function parseSiweMessage(message: string): ParsedSiweMessage;
export declare function verifySiweMessage(input: VerifySiweMessageInput): Promise<VerifySiweMessageResult>;
```

---

## `./auth`

Authentication helpers (e.g., SIWE integration with wallet connectors).

```ts
export declare function useAuth(): {
  login: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  user: string | null;
};
```

---

## `./hooks`

Custom React hooks for wallet state and chain switching.

```ts
export declare function useCoreWallet(): {
  provider: FluentProvider | null;
  accounts: string[];
  chainId: string | null;
};
```

---

## `./config`

Chain configuration types and defaults.

```ts
export interface CoreChainConfig {
  chainId: number;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrls?: string[];
}
```

<!-- readme-hash: f017a75e510ff3b582d60f53d2c09b01ba570881999c7a6f57a3b13d63e4df6d -->
