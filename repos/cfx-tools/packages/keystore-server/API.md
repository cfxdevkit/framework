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
// <one-line description>
export declare const __packageName: "@cfxdevkit/keystore-server";
// <one-line description>
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
// <one-line description>
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
// <one-line description>
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
// <one-line description>
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
// <one-line description>
export interface RevealRequestSummary {
    // The kind of secret being requested (e.g., mnemonic, private-key)
    kind: RevealKind;
    // The secret content or identifier
    secret: string;
    // The timestamp of the request
    timestamp: string;
}
// <one-line description>
export interface RevealedSecret {
    // The revealed secret string
    secret: string;
    // The timestamp when the secret was revealed
    timestamp: string;
}
// <one-line description>
export interface KeystoreResetGuidance {
    // The guidance message
    message: string;
    // The required action to take
    action: string;
}
// <one-line description>
export interface KeystoreStatus {
    // The current lifecycle phase of the keystore
    phase: KeystoreLifecyclePhase;
    // The timestamp of the status update
    timestamp: string;
}
// <one-line description>
export declare function createKeystoreApp(options: KeystoreServerAppOptions): Hono;
// <one-line description>
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
// <one-line description>
export type RevealKind = 'mnemonic' | 'private-key';
// <one-line description>
export type KeystoreLifecyclePhase = 'blank' | 'locked' | 'unlocked' | 'active-wallet';
// <one-line description>
export declare class KeystoreService {
    // <one-line description>
    constructor(options: KeystoreServiceOptions);
    // <one-line description>
    start(): Promise<void>;
    // <one-line description>
    stop(): Promise<void>;
    // <one-line description>
    reset(): Promise<void>;
    // <one-line description>
    getKeystoreStatus(): KeystoreStatus;
    // <one-line description>
    getActiveWallets(): ActiveWalletSummary[];
    // <one-line description>
    getWalletAccounts(): WalletAccountSummary[];
    // <one-line description>
    getRevealRequests(): RevealRequestSummary[];
    // <one-line description>
    getRevealedSecrets(): RevealedSecret[];
    // <one-line description>
    getKeystoreResetGuidance(): KeystoreResetGuidance;
    // <one-line description>
    setKeystoreStatus(status: KeystoreStatus): void;
    // <one-line description>
    setActiveWallets(wallets: ActiveWalletSummary[]): void;
    // <one-line description>
    setWalletAccounts(accounts: WalletAccountSummary[]): void;
    // <one-line description>
    setRevealRequests(revealRequests: RevealRequestSummary[]): void;
    // <one-line description>
    setRevealedSecrets(revealedSecrets: RevealedSecret[]): void;
    // <one-line description>
    setKeystoreResetGuidance(guidance: KeystoreResetGuidance): void;
    // <one-line description>
    addWallet(wallet: ActiveWalletSummary): void;
    // <one-line description>
    removeWallet(wallet: ActiveWalletSummary): void;
    // <one-line description>
    addAccount(account: WalletAccountSummary): void;
    // <one-line description>
    removeAccount(account: WalletAccountSummary): void;
    // <one-line description>
    addRevealRequest(revealRequest: RevealRequestSummary): void;
    // <one-line description>
    removeRevealRequest(revealRequest: RevealRequestSummary): void;
    // <one-line description>
    addRevealedSecret(revealedSecret: RevealedSecret): void;
    // <one-line description>
    removeRevealedSecret(revealedSecret: RevealedSecret): void;
    // <one-line description>
    addKeystoreResetGuidance(guidance: KeystoreResetGuidance): void;
    // <one-line description>
    updateWallet(wallet: ActiveWalletSummary): void;
    // <one-line description>
    updateAccount(account: WalletAccountSummary): void;
    // <one-line description>
    updateRevealRequest(revealRequest: RevealRequestSummary): void;
    // <one-line description>
    updateRevealedSecret(revealedSecret: RevealedSecret): void;
    // <one-line description>
    updateKeystoreResetGuidance(guidance: KeystoreResetGuidance): void;
    // <one-line description>
    getWallet(walletId: string): ActiveWalletSummary | undefined;
    // <one-line description>
    getAccount(accountId: string): WalletAccountSummary | undefined;
    // <one-line description>
    getRevealRequest(revealRequestId: string): RevealRequestSummary | undefined;
    // <one-line description>
    getRevealedSecret(revealedSecretId: string): RevealedSecret | undefined;
    // <one-line description>
    getKeystoreResetGuidance(guidanceId: string): KeystoreResetGuidance | undefined;
    // <one-line description>
    getWallets(): ActiveWalletSummary[];
    // <one-line description>
    getAccounts(): WalletAccountSummary[];
    // <one-line description>
    getRevealRequests(): RevealRequestSummary[];
    // <one-line description>
    getRevealedSecrets(): RevealedSecret[];
    // <one-line description>
    getKeystoreResetGuidances(): KeystoreResetGuidance[];
}
```

<!-- api-hash: 2cff488d60829206c00cc17739764c844841c54f5173a2a148f650e9a7dbe325 -->
