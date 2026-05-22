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

### Usage

```ts
import { createConfluxWagmiConfig, ConfluxWagmiProviders } from '@cfxdevkit/wallet-connect';

const config = createConfluxWagmiConfig();

function App() {
  return (
    <ConfluxWagmiProviders config={config}>
      <YourApp />
    </ConfluxWagmiProviders>
  );
}
```

```ts
// The package name identifier.
export declare const __packageName: "@cfxdevkit/wallet-connect";
// Espace mainnet chain definition.
export declare const espaceMainnet: Chain, espaceTestnet: Chain, espaceLocal: Chain;
// List of supported Espace chains.
export declare const SUPPORTED_ESPACE_CHAINS: readonly [Chain, ...Chain[]];
// Mapping of chain IDs to their respective configurations.
export declare const CORE_CHAIN_CONFIGS: Record<number, CoreChainConfig>;
// Options for creating supported Espace chains.
export interface CreateSupportedEspaceChainsOptions {
  // Custom chain configurations to merge with defaults.
  chains?: CoreChainConfig[];
}
// Options for creating a Conflux Wagmi configuration.
export interface CreateConfluxWagmiConfigOptions extends CreateSupportedEspaceChainsOptions {
  // Optional Wagmi config overrides.
  wagmi?: import('wagmi').CreateConfigParameters;
}
// Props for the ConfluxWagmiProviders component.
export interface ConfluxWagmiProvidersProps {
  // Children to wrap with providers.
  children: React.ReactNode;
  // Pre-built Wagmi config (optional if `configOptions` provided).
  config?: import('wagmi').Config;
  // Options to build Wagmi config (used if `config` not provided).
  configOptions?: CreateConfluxWagmiConfigOptions;
  // Pre-built QueryClient (optional if `queryClientConfig` provided).
  queryClient?: import('@tanstack/query-core').QueryClient;
  // Options to build QueryClient (used if `queryClient` not provided).
  queryClientConfig?: import('@tanstack/react-query').QueryClientConfig;
}
// Return type for the useEspaceConnectors hook.
export interface UseEspaceConnectorsReturn {
  // List of available connectors.
  connectors: import('wagmi').Connector[];
  // Whether connectors are loading.
  isLoading: boolean;
}
// Interface for an enhanced EIP-1193 provider.
export interface FluentProvider extends Eip1193Provider {
  // Indicates if the provider is a Fluent wallet.
  isFluent: true;
  // Fluent-specific methods.
  request: (request: { method: string; params?: any[] }) => Promise<any>;
}
// Configuration for a core chain.
export interface CoreChainConfig {
  // Chain ID.
  id: number;
  // Chain name.
  name: string;
  // Native currency symbol.
  nativeCurrency: { name: string; symbol: string; decimals: number };
  // RPC URLs.
  rpcUrls: { default: { http: string[] }; public: { http: string[] } };
  // Block explorer URLs.
  blockExplorers?: { default: { name: string; url: string } };
  // Chain testnet flag.
  testnet?: boolean;
}
// Parameters for adding a chain to a provider.
export interface ConfluxAddChainParams {
  // Chain configuration to add.
  chain: CoreChainConfig;
}
// Standard EIP-1193 provider interface.
export interface Eip1193Provider {
  // Send a JSON-RPC request.
  request(request: { method: string; params?: any[] }): Promise<any>;
  // Subscribe to events.
  on(event: string, callback: (...args: any[]) => void): void;
  // Remove event listener.
  off(event: string, callback: (...args: any[]) => void): void;
}
// Options for switching chains.
export interface SwitchChainOptions {
  // Target chain ID.
  chainId: number;
}
// State for core wallet UI pills.
export interface CorePillState {
  // Connected account address.
  address?: string;
  // Chain ID.
  chainId?: number;
  // Wallet connector name.
  connectorName?: string;
}
// State for Espace wallet UI pills.
export interface ESpacePillState extends CorePillState {
  // Espace-specific wallet metadata.
  walletInfo?: { icon?: string; name?: string };
}
// Options for generating a SIWE nonce.
export interface GenerateSiweNonceOptions {
  // Optional custom nonce length.
  length?: number;
}
// Input for creating a SIWE message.
export interface SiweMessageInput {
  // Domain of the application.
  domain: string;
  // URI of the application.
  uri: string;
  // Address of the signer.
  address: string;
  // Statement to include in the message.
  statement?: string;
  // Nonce for the message.
  nonce: string;
  // ISO 8601 timestamp.
  issuedAt: string;
  // Expiration time (ISO 8601).
  expirationTime?: string;
  // Not before time (ISO 8601).
  notBefore?: string;
  // Request ID.
  requestId?: string;
  // Resources.
  resources?: string[];
}
// Parsed SIWE message data.
export interface ParsedSiweMessage {
  domain: string;
  uri: string;
  address: string;
  statement?: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}
// Input for verifying a SIWE message.
export interface VerifySiweMessageInput {
  // The SIWE message string.
  message: string;
  // Signature over the message.
  signature: string;
  // Address of the signer.
  address: string;
}
// Result of a SIWE message verification.
export interface VerifySiweMessageResult {
  // Whether the signature is valid.
  valid: boolean;
  // Error message if invalid.
  error?: string;
}
// Props for the ConnectButton component.
export interface ConnectButtonProps {
  // Label for the connect button.
  connectLabel?: string;
  // Callback when connecting.
  onConnect?: (connector: import('wagmi').Connector) => void;
  // Callback when disconnecting.
  onDisconnect?: () => void;
  // Custom styles.
  style?: React.CSSProperties;
  // Custom CSS class.
  className?: string;
}
// Props for the WalletPickerModal component.
export interface WalletPickerModalProps {
  // Whether the modal is open.
  open: boolean;
  // Callback when closing the modal.
  onClose: () => void;
  // Optional section to pre-select.
  section?: 'core' | 'espace';
}
// Creates a list of supported Espace chains.
export declare function createSupportedEspaceChains(options?: CreateSupportedEspaceChainsOptions): readonly [Chain, ...Chain[]];
// Returns a non-fluent Ethereum target if applicable.
export declare function nonFluentEthereumTarget(): undefined | { id: number; name: string };
// Type guard to check if a provider is a FluentProvider.
export declare function isFluentProvider(provider: unknown): boolean;
// Creates a Wagmi configuration for Conflux.
export declare function createConfluxWagmiConfig(options?: CreateConfluxWagmiConfigOptions): import('wagmi').Config<readonly [Chain, ...Chain[]], import('wagmi').Transport, import('wagmi').Chain>;
// Creates a TanStack Query client for Conflux.
export declare function createConfluxQueryClient(config?: QueryClientConfig): QueryClient;
// React component that provides Wagmi and Query context for Conflux.
export declare function ConfluxWagmiProviders({ children, config, configOptions, queryClient, queryClientConfig, }: ConfluxWagmiProvidersProps): import("react/jsx-runtime").JSX.Element;
// Espace mainnet chain definition.
export declare const espaceMainnet: Chain, espaceTestnet: Chain, espaceLocal: Chain;
// List of supported Espace chains.
export declare const SUPPORTED_ESPACE_CHAINS: readonly [Chain, ...Chain[]];
```

---

## `./config`

### Usage

```ts
import { createSupportedEspaceChains } from '@cfxdevkit/wallet-connect/config';

const chains = createSupportedEspaceChains();
```

```ts
// Options for creating supported Espace chains.
export interface CreateSupportedEspaceChainsOptions {
  // Custom chain configurations to merge with defaults.
  chains?: CoreChainConfig[];
}
// Options for creating a Conflux Wagmi configuration.
export interface CreateConfluxWagmiConfigOptions extends CreateSupportedEspaceChainsOptions {
  // Optional Wagmi config overrides.
  wagmi?: import('wagmi').CreateConfigParameters;
}
// Props for the ConfluxWagmiProviders component.
export interface ConfluxWagmiProvidersProps {
  // Children to wrap with providers.
  children: React.ReactNode;
  // Pre-built Wagmi config (optional if `configOptions` provided).
  config?: import('wagmi').Config;
  // Options to build Wagmi config (used if `config` not provided).
  configOptions?: CreateConfluxWagmiConfigOptions;
  // Pre-built QueryClient (optional if `queryClientConfig` provided).
  queryClient?: import('@tanstack/query-core').QueryClient;
  // Options to build QueryClient (used if `queryClient` not provided).
  queryClientConfig?: import('@tanstack/react-query').QueryClientConfig;
}
// Creates a list of supported Espace chains.
export declare function createSupportedEspaceChains(options?: CreateSupportedEspaceChainsOptions): readonly [Chain, ...Chain[]];
// Returns a non-fluent Ethereum target if applicable.
export declare function nonFluentEthereumTarget(): undefined | { id: number; name: string };
// Type guard to check if a provider is a FluentProvider.
export declare function isFluentProvider(provider: unknown): boolean;
// Creates a Wagmi configuration for Conflux.
export declare function createConfluxWagmiConfig(options?: CreateConfluxWagmiConfigOptions): import('wagmi').Config<readonly [Chain, ...Chain[]], import('wagmi').Transport, import('wagmi').Chain>;
// Creates a TanStack Query client for Conflux.
export declare function createConfluxQueryClient(config?: QueryClientConfig): QueryClient;
// React component that provides Wagmi and Query context for Conflux.
export declare function ConfluxWagmiProviders({ children, config, configOptions, queryClient, queryClientConfig, }: ConfluxWagmiProvidersProps): import("react/jsx-runtime").JSX.Element;
// Espace mainnet chain definition.
export declare const espaceMainnet: Chain, espaceTestnet: Chain, espaceLocal: Chain;
// List of supported Espace chains.
export declare const SUPPORTED_ESPACE_CHAINS: readonly [Chain, ...Chain[]];
```

---

## `./hooks`

### Usage

```ts
import { useEspaceConnectors } from '@cfxdevkit/wallet-connect/hooks';

const { connectors } = useEspaceConnectors();
```

```ts
// Hook to access core wallet state.
export declare function useCoreWallet(): {
  // Connected account address.
  address?: string;
  // Chain ID.
  chainId?: number;
  // Wallet connector name.
  connectorName?: string;
  // Whether wallet is connected.
  isConnected: boolean;
};
// Hook to access Espace connectors.
export declare function useEspaceConnectors(): UseEspaceConnectorsReturn;
// Return type for the useEspaceConnectors hook.
export interface UseEspaceConnectorsReturn {
  // List of available connectors.
  connectors: import('wagmi').Connector[];
  // Whether connectors are loading.
  isLoading: boolean;
}
```

---

## `./siwe`

### Usage

```ts
import { createSiweMessage, verifySiweMessage } from '@cfxdevkit/wallet-connect/siwe';

const message = createSiweMessage(input);
const isValid = await verifySiweMessage({ message, signature, address });
```

```ts
// Creates a SIWE message string.
export declare function createSiweMessage(input: SiweMessageInput): string;
// Generates a SIWE nonce.
export declare function generateSiweNonce(options?: GenerateSiweNonceOptions): string;
// Parses a SIWE message string.
export declare function parseSiweMessage(message: string): ParsedSiweMessage;
// Verifies a SIWE message signature.
export declare function verifySiweMessage(input: VerifySiweMessageInput): Promise<VerifySiweMessageResult>;
// Options for generating a SIWE nonce.
export interface GenerateSiweNonceOptions {
  // Optional custom nonce length.
  length?: number;
}
// Input for creating a SIWE message.
export interface SiweMessageInput {
  // Domain of the application.
  domain: string;
  // URI of the application.
  uri: string;
  // Address of the signer.
  address: string;
  // Statement to include in the message.
  statement?: string;
  // Nonce for the message.
  nonce: string;
  // ISO 8601 timestamp.
  issuedAt: string;
  // Expiration time (ISO 8601).
  expirationTime?: string;
  // Not before time (ISO 8601).
  notBefore?: string;
  // Request ID.
  requestId?: string;
  // Resources.
  resources?: string[];
}
// Parsed SIWE message data.
export interface ParsedSiweMessage {
  domain: string;
  uri: string;
  address: string;
  statement?: string;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}
// Input for verifying a SIWE message.
export interface VerifySiweMessageInput {
  // The SIWE message string.
  message: string;
  // Signature over the message.
  signature: string;
  // Address of the signer.
  address: string;
}
// Result of a SIWE message verification.
export interface VerifySiweMessageResult {
  // Whether the signature is valid.
  valid: boolean;
  // Error message if invalid.
  error?: string;
}
```

---

## `./ui`

### Usage

```ts
import { ConnectButton, WalletPickerModal } from '@cfxdevkit/wallet-connect/ui';

function MyComponent() {
  return (
    <>
      <ConnectButton />
      <WalletPickerModal open={true} />
    </>
  );
}
```

```ts
// A React component for connecting wallets.
export declare function ConnectButton({ connectLabel, onConnect, onDisconnect, style, className, }: ConnectButtonProps): import("react/jsx-runtime").JSX.Element;
// A React component for selecting a wallet.
export declare function WalletPickerModal({ open, onClose, section }: WalletPickerModalProps): import("react/jsx-runtime").JSX.Element | null;
```

---

## `./auth`

### Usage

```ts
import { AuthProvider, useAuth } from '@cfxdevkit/wallet-connect/auth';

function App() {
  return (
    <AuthProvider domain="example.com" uri="https://example.com">
      <Main />
    </AuthProvider>
  );
}

function Main() {
  const { isAuthenticated } = useAuth();
  return <div>{isAuthenticated ? 'Logged In' : 'Logged Out'}</div>;
}
```

```ts
// The state of the authentication.
export interface AuthState {
  // Whether the user is authenticated.
  isAuthenticated: boolean;
  // Authenticated user's address.
  address?: string;
  // Authenticated user's SIWE message.
  siweMessage?: string;
}
// The value provided by the AuthContext.
export interface AuthContextValue extends AuthState {
  // Function to authenticate using SIWE.
  authenticate: (message: string, signature: string) => Promise<void>;
  // Function to logout.
  logout: () => void;
}
// Props for the AuthProvider.
export interface AuthProviderProps {
  // Children to wrap with auth context.
  children: React.ReactNode;
  // Domain for SIWE message.
  domain: string;
  // URI for SIWE message.
  uri: string;
}
// A React component that provides authentication context.
export declare function AuthProvider({ children, domain, uri }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
// Hook to access the authentication context.
export declare function useAuth(): AuthContextValue;
```

<!-- api-hash: 8eca35078f8390ef4958892078597e6abff4b38f72dff65fa46e368a61fbba95 -->
