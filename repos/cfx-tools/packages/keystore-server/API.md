# `@cfxdevkit/keystore-server` — Public API

> Standalone Hono keystore router extracted from devnode-server.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 14 symbols |

---

## `.`

### Usage

```ts
import { createKeystoreApp, KeystoreService } from "@cfxdevkit/keystore-server";
import { Hono } from "hono";

const keystore = new KeystoreService({ /* options */ });
const app = createKeystoreApp({
    port: 3000,
    host: "0.0.0.0",
    keystore,
    routes: new Hono()
});
```

```ts
// The package name identifier for runtime introspection.
export declare const __packageName: "@cfxdevkit/keystore-server";
// Configuration options for initializing the keystore HTTP server.
export interface KeystoreServerAppOptions {
    // The port number the server will listen on
    port: number;
    // The host address the server will bind to
    host: string;
    // The keystore service instance to be used by the app
    keystore: KeystoreService;
    // The Hono router instance containing the application routes
    routes: Hono;
}
// Summary of a wallet, including basic metadata and state.
export interface WalletSummary {
    // The wallet address
    address: string;
    // The current balance of the wallet
    balance: string;
    // The current nonce of the wallet
    nonce: string;
    // The timestamp of the last update
    timestamp: string;
    // The type of the wallet (e.g., hardware, software)
    type: string;
}
// Extended wallet summary including display and lifecycle information.
export interface ActiveWalletSummary extends WalletSummary {
    // The display name of the wallet
    name: string;
    // A description of the wallet
    description: string;
    // The icon identifier or URL for the wallet
    icon: string;
    // The current status of the wallet (e.g., active, locked)
    status: string;
    // The timestamp when the wallet was created
    createdAt: string;
    // The timestamp when the wallet was last updated
    updatedAt: string;
}
// Summary of an account within a wallet, including balance and nonce.
export interface WalletAccountSummary {
    // The account address
    address: string;
    // The account balance
    balance: string;
    // The account nonce
    nonce: string;
    // The timestamp of the last update
    timestamp: string;
    // The type of the account (e.g., external, internal)
    type: string;
}
// Summary of a pending secret reveal request.
export interface RevealRequestSummary {
    // The kind of secret being requested (e.g., mnemonic, private-key)
    kind: RevealKind;
    // The secret content or identifier
    secret: string;
    // The timestamp of the request
    timestamp: string;
}
// A revealed secret with its timestamp.
export interface RevealedSecret {
    // The revealed secret string
    secret: string;
    // The timestamp when the secret was revealed
    timestamp: string;
}
// Guidance message for resetting the keystore.
export interface KeystoreResetGuidance {
    // The guidance message
    message: string;
    // The required action to take
    action: string;
}
// Current lifecycle status of the keystore.
export interface KeystoreStatus {
    // The current lifecycle phase of the keystore
    phase: KeystoreLifecyclePhase;
    // The timestamp of the status update
    timestamp: string;
}
// Factory function to create a Hono-based keystore HTTP application.
export declare function createKeystoreApp(options: KeystoreServerAppOptions): Hono;
// Factory function to create keystore-specific routes for a Hono app.
export declare function createKeystoreRoutes(keystore: KeystoreService, options?: {
    // The port number for the routes
    port: number;
    // The host address for the routes
    host: string;
    // The keystore service instance
    keystore: KeystoreService;
    // The Hono router instance
    routes: Hono;
}): Hono;
// Supported kinds of secrets that can be revealed.
export type RevealKind = 'mnemonic' | 'private-key';
// Lifecycle phases of the keystore.
export type KeystoreLifecyclePhase = 'blank' | 'locked' | 'unlocked' | 'active-wallet';
// Core service class managing keystore state and operations.
export declare class KeystoreService {
    // Initializes a new keystore service instance with the given options.
    constructor(options: KeystoreServiceOptions);
    // Starts the keystore service and initializes internal state.
    start(): Promise<void>;
    // Stops the keystore service and cleans up resources.
    stop(): Promise<void>;
    // Resets the keystore to its initial blank state.
    reset(): Promise<void>;
    // Retrieves the current lifecycle status of the keystore.
    getKeystoreStatus(): KeystoreStatus;
    // Returns a list of active wallets managed by the keystore.
    getActiveWallets(): ActiveWalletSummary[];
    // Returns a list of all accounts across wallets.
    getWalletAccounts(): WalletAccountSummary[];
    // Returns a list of pending secret reveal requests.
    getRevealRequests(): RevealRequestSummary[];
    // Returns a list of secrets that have been successfully revealed.
    getRevealedSecrets(): RevealedSecret[];
    // Returns guidance for resetting the keystore.
    getKeystoreResetGuidance(): KeystoreResetGuidance;
    // Sets the current lifecycle phase of the keystore.
    setKeystoreStatus(status: KeystoreStatus): void;
    // Replaces the list of active wallets.
    setActiveWallets(wallets: ActiveWalletSummary[]): void;
    // Replaces the list of wallet accounts.
    setWalletAccounts(accounts: WalletAccountSummary[]): void;
    // Replaces the list of pending reveal requests.
    setRevealRequests(revealRequests: RevealRequestSummary[]): void;
    // Replaces the list of revealed secrets.
    setRevealedSecrets(revealedSecrets: RevealedSecret[]): void;
    // Sets the keystore reset guidance.
    setKeystoreResetGuidance(guidance: KeystoreResetGuidance): void;
    // Adds a new active wallet to the keystore.
    addWallet(wallet: ActiveWalletSummary): void;
    // Removes an active wallet from the keystore.
    removeWallet(wallet: ActiveWalletSummary): void;
    // Adds a new account to the keystore.
    addAccount(account: WalletAccountSummary): void;
    // Removes an account from the keystore.
    removeAccount(account: WalletAccountSummary): void;
    // Adds a new reveal request to the keystore.
    addRevealRequest(revealRequest: RevealRequestSummary): void;
    // Removes a reveal request from the keystore.
    removeRevealRequest(revealRequest: RevealRequestSummary): void;
    // Adds a newly revealed secret to the keystore.
    addRevealedSecret(revealedSecret: RevealedSecret): void;
    // Removes a revealed secret from the keystore.
    removeRevealedSecret(revealedSecret: RevealedSecret): void;
    // Adds or updates keystore reset guidance.
    addKeystoreResetGuidance(guidance: KeystoreResetGuidance): void;
    // Updates an existing active wallet.
    updateWallet(wallet: ActiveWalletSummary): void;
    // Updates an existing account.
    updateAccount(account: WalletAccountSummary): void;
    // Updates an existing reveal request.
    updateRevealRequest(revealRequest: RevealRequestSummary): void;
    // Updates an existing revealed secret.
    updateRevealedSecret(revealedSecret: RevealedSecret): void;
    // Updates existing keystore reset guidance.
    updateKeystoreResetGuidance(guidance: KeystoreResetGuidance): void;
    // Retrieves a specific active wallet by ID.
    getWallet(walletId: string): ActiveWalletSummary | undefined;
    // Retrieves a specific account by ID.
    getAccount(accountId: string): WalletAccountSummary | undefined;
    // Retrieves a specific reveal request by ID.
    getRevealRequest(revealRequestId: string): RevealRequestSummary | undefined;
    // Retrieves a specific revealed secret by ID.
    getRevealedSecret(revealedSecretId: string): RevealedSecret | undefined;
    // Retrieves keystore reset guidance by ID (if supported).
    getKeystoreResetGuidance(guidanceId: string): KeystoreResetGuidance | undefined;
    // Returns all active wallets (alias for getActiveWallets).
    getWallets(): ActiveWalletSummary[];
    // Returns all accounts (alias for getWalletAccounts).
    getAccounts(): WalletAccountSummary[];
    // Returns all pending reveal requests (alias for getRevealRequests).
    getRevealRequests(): RevealRequestSummary[];
    // Returns all revealed secrets (alias for getRevealedSecrets).
    getRevealedSecrets(): RevealedSecret[];
    // Returns all keystore reset guidance entries (alias for getKeystoreResetGuidance).
    getKeystoreResetGuidances(): KeystoreResetGuidance[];
}
```

<!-- api-hash: 2cff488d60829206c00cc17739764c844841c54f5173a2a148f650e9a7dbe325 -->
