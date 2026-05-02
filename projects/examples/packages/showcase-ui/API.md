# `@cfxdevkit/example-showcase-ui` — API Reference

> Shared example UI surface used by the showcase applications.

## Components

```ts
function ConnectWall(...): JSX.Element
function CopyButton(...): JSX.Element
function LogBox(...): JSX.Element
function WalletPickerModal(...): JSX.Element
```

## Helpers

```ts
function copy(...): Promise<void>
function errMsg(error: unknown): string

type LogEntry
type LogLevel
function makeEntry(...): LogEntry
function useLogList(...): { entries: LogEntry[]; push: (...args: unknown[]) => void; clear: () => void }
```

## Core wallet surface

```ts
type CoreChainConfig
type FluentProvider
type WalletStatus
function useCoreWallet(...): { status: WalletStatus; provider: FluentProvider | null; error: Error | null }
function buildAddChainParams(...): unknown
const CORE_CHAIN_CONFIGS: readonly CoreChainConfig[]
function detectFluentCore(...): Promise<unknown>
function formatProviderError(...): string
function getCoreChainConfig(...): CoreChainConfig
function getFluentCoreProvider(...): Promise<FluentProvider | null>
function normalizeCoreChainId(...): number
function rpcCoreAccounts(...): Promise<readonly string[]>
function rpcCoreChainId(...): Promise<number>
function rpcRequestCoreAccounts(...): Promise<readonly string[]>
function switchConfluxChain(...): Promise<void>
function waitForCoreChain(...): Promise<void>
```

## Wallet state helpers

```ts
type CorePillState
type CoreWalletStatus
type ESpacePillState
function coreChainLabel(...): string
function deriveCoreState(...): CorePillState
function deriveESpaceState(...): ESpacePillState
function espaceChainLabel(...): string
function needsESpaceSwitch(...): boolean
```