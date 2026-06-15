# `@cfxdevkit/wallet-connect` — Public API

> Browser wallet connectors and headless UI.

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

```ts
export declare const __packageName: "@cfxdevkit/wallet-connect";
export declare const espaceMainnet: Chain, espaceTestnet: Chain, espaceLocal: Chain;
export declare const SUPPORTED_ESPACE_CHAINS: readonly [
export declare const CORE_CHAIN_CONFIGS: Record<number, CoreChainConfig>;
export interface CreateSupportedEspaceChainsOptions {
export interface CreateConfluxWagmiConfigOptions extends CreateSupportedEspaceChainsOptions {
export interface ConfluxWagmiProvidersProps {
export interface UseEspaceConnectorsReturn {
export interface FluentProvider {
export interface CoreChainConfig {
export interface ConfluxAddChainParams {
export interface Eip1193Provider {
export interface SwitchChainOptions {
export interface CorePillState {
export interface ESpacePillState {
export interface GenerateSiweNonceOptions {
export interface SiweMessageInput {
export interface ParsedSiweMessage {
export interface VerifySiweMessageInput {
export interface VerifySiweMessageResult {
export interface ConnectButtonProps {
export interface WalletPickerModalProps {
export declare function createSupportedEspaceChains(options?: CreateSupportedEspaceChainsOptions): readonly [
export declare function nonFluentEthereumTarget(): undefined | {
export declare function isFluentProvider(provider: unknown): boolean;
export declare function createConfluxWagmiConfig(options?: CreateConfluxWagmiConfigOptions): import('wagmi').Config<readonly [
export declare function createConfluxQueryClient(config?: QueryClientConfig): QueryClient;
export declare function ConfluxWagmiProviders({ children, config, configOptions, queryClient, queryClientConfig, }: ConfluxWagmiProvidersProps): import("react").JSX.Element;
export declare function useCoreWallet(): {
export declare function useEspaceConnectors(): UseEspaceConnectorsReturn;
export declare function normalizeCoreChainId(raw: string): string;
export declare function getFluentCoreProvider(): FluentProvider | null;
export declare function getCoreChainConfig(chainIdHex: string): CoreChainConfig | null;
export declare function buildAddChainParams(target: CoreChainConfig, rpcUrl?: string): ConfluxAddChainParams;
export declare function detectFluentCore(maxMs?: number): Promise<FluentProvider | null>;
export declare function rpcCoreChainId(provider: FluentProvider): Promise<string | null>;
export declare function rpcCoreAccounts(provider: FluentProvider): Promise<string[]>;
export declare function rpcRequestCoreAccounts(provider: FluentProvider): Promise<string[]>;
export declare function switchConfluxChain(provider: FluentProvider, chainId: string, addParams: ConfluxAddChainParams): Promise<void>;
export declare function waitForCoreChain(provider: FluentProvider, targetHex: string, maxMs?: number, pollIntervalMs?: number): Promise<boolean>;
export declare function formatProviderError(error: unknown): string;
export declare function errMsg(error: unknown): string;
export declare function switchEspaceChain(provider: Eip1193Provider, chain: Chain, options?: SwitchChainOptions): Promise<void>;
export declare function switchEspaceChainFromConfig(provider: Eip1193Provider, chainConfig: ChainConfig, options?: SwitchChainOptions): Promise<void>;
export declare function deriveCoreState(status: string, chainId: string | undefined, targetHex: string): CorePillState;
export declare function deriveESpaceState(isConnected: boolean, chainId: number, targetChainId: number): ESpacePillState;
export declare function needsESpaceSwitch(isConnected: boolean, connectedChainId: number, targetChainId: number): boolean;
export declare function coreChainLabel(chainId: string | undefined): string;
export declare function espaceChainLabel(chainId: number | undefined): string;
export declare function createSiweMessage(input: SiweMessageInput): string;
export declare function generateSiweNonce(options?: GenerateSiweNonceOptions): string;
export declare function parseSiweMessage(message: string): ParsedSiweMessage;
export declare function verifySiweMessage(input: VerifySiweMessageInput): Promise<VerifySiweMessageResult>;
export declare function ConnectButton({ connectLabel, onConnect, onDisconnect, style, className, }: ConnectButtonProps): import("react").JSX.Element;
export declare function WalletPickerModal({ open, onClose, section }: WalletPickerModalProps): import("react").JSX.Element | null;
export type WalletStatus = 'detecting' | 'not-installed' | 'not-active' | 'connecting' | 'active';
export type CoreWalletStatus = 'not-installed' | 'in-detecting' | 'in-activating' | 'not-active' | 'chain-error' | 'active';
```

---

## `./config`

```ts
export interface CreateSupportedEspaceChainsOptions {
export interface CreateConfluxWagmiConfigOptions extends CreateSupportedEspaceChainsOptions {
export interface ConfluxWagmiProvidersProps {
export declare function createSupportedEspaceChains(options?: CreateSupportedEspaceChainsOptions): readonly [
export declare function nonFluentEthereumTarget(): undefined | {
export declare function isFluentProvider(provider: unknown): boolean;
export declare function createConfluxWagmiConfig(options?: CreateConfluxWagmiConfigOptions): import('wagmi').Config<readonly [
export declare function createConfluxQueryClient(config?: QueryClientConfig): QueryClient;
export declare function ConfluxWagmiProviders({ children, config, configOptions, queryClient, queryClientConfig, }: ConfluxWagmiProvidersProps): import("react").JSX.Element;
export declare const espaceMainnet: Chain, espaceTestnet: Chain, espaceLocal: Chain;
export declare const SUPPORTED_ESPACE_CHAINS: readonly [
```

---

## `./hooks`

```ts
export declare function useCoreWallet(): {
export declare function useEspaceConnectors(): UseEspaceConnectorsReturn;
export interface UseEspaceConnectorsReturn {
```

---

## `./siwe`

```ts
export declare function createSiweMessage(input: SiweMessageInput): string;
export declare function generateSiweNonce(options?: GenerateSiweNonceOptions): string;
export declare function parseSiweMessage(message: string): ParsedSiweMessage;
export declare function verifySiweMessage(input: VerifySiweMessageInput): Promise<VerifySiweMessageResult>;
export interface GenerateSiweNonceOptions {
export interface SiweMessageInput {
export interface ParsedSiweMessage {
export interface VerifySiweMessageInput {
export interface VerifySiweMessageResult {
```

---

## `./ui`

```ts
export interface ConnectButtonProps {
export interface WalletPickerModalProps {
export declare function ConnectButton({ connectLabel, onConnect, onDisconnect, style, className, }: ConnectButtonProps): import("react").JSX.Element;
export declare function WalletPickerModal({ open, onClose, section }: WalletPickerModalProps): import("react").JSX.Element | null;
```

---

## `./auth`

```ts
export interface AuthState {
export interface AuthContextValue extends AuthState {
export interface AuthProviderProps {
export declare function AuthProvider({ children, domain, uri }: AuthProviderProps): import("react").JSX.Element;
export declare function useAuth(): AuthContextValue;
```

<!-- api-hash: 0ff0f7b27329dde2c47302ccbdf818ec9e578cfd72a3e16c022427133569b184 -->
