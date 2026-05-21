# `@cfxdevkit/client` — Public API

> Typed HTTP client for the Conflux Devkit devnode-server control plane.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 76 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/client";
export { ConfluxDevkitClientOptions }
export { HttpClient }
export { CompilerNamespace }
export { DeployNamespace }
export { MiningNamespace }
export { NetworkNamespace }
export { SessionKeysNamespace }
export { createCompilerNamespace }
export { createDeployNamespace }
export { createMiningNamespace }
export { createNetworkNamespace }
export { createSessionKeysNamespace }
export declare class ConfluxDevkitClient {
export declare function createConfluxDevkitClient(options: ConfluxDevkitClientOptions): ConfluxDevkitClient;
export declare function createNodeNamespace(http: HttpClient): NodeNamespace;
export declare function createHealthNamespace(http: HttpClient): HealthNamespace;
export declare function createKeystoreNamespace(http: HttpClient): KeystoreNamespace;
export declare function createAccountsNamespace(http: HttpClient): AccountsNamespace;
export declare function createContractsNamespace(http: HttpClient): ContractsNamespace;
export declare function createBootstrapNamespace(http: HttpClient): BootstrapNamespace;
export interface NodeStartInput {
export interface NodeRestartInput {
export interface NodeWipeInput {
export interface NodeMineInput {
export interface NodeNamespace {
export interface HealthNamespace {
export interface KeystoreNamespace {
export interface AccountsNamespace {
export interface ContractsNamespace {
export interface BootstrapNamespace {
export interface OkResponse {
export interface HealthResponse {
export interface AccountInfo {
export interface WalletSummary {
export interface ActiveWalletSummary extends WalletSummary {
export interface WalletAccountSummary {
export interface RevealRequestInput {
export interface RevealRequestSummary {
export interface RevealRequestResponse {
export interface RevealedSecret {
export interface RevealConsumeResponse {
export interface KeystoreStatus {
export interface NodeProfileSummary {
export interface NodeProfileState {
export interface NodeProfileSelection {
export interface ContractRecord {
export interface CompileWarning {
export interface CompileArtifact {
export interface SessionCapability {
export interface SessionKeyIssueResponse {
export interface SessionKeyVerifyResponse {
export interface DeployReceiptSummary {
export interface DeployRunResponse {
export interface BootstrapTemplateSummary {
export interface BootstrapTemplate extends BootstrapTemplateSummary {
export interface BootstrapCatalogResponse {
export interface BootstrapTemplateResponse {
export interface BootstrapDeployInput {
export interface BootstrapDeployResponse {
export interface NetworkConfig {
export interface NetworkChainIds {
export interface NetworkCapabilities {
export interface NetworkProfileResponse {
export interface NetworkCapabilitiesResponse {
export interface NetworkConfigResponse {
export interface ContractReadResponse {
export interface ContractWriteResponse {
export interface MiningStatus {
export interface NodeStatus {
export type RevealKind = 'mnemonic' | 'private-key';
export type Network = 'local' | 'testnet' | 'mainnet';
export type NetworkMode = 'local' | 'public';
export type Space = 'core' | 'espace';
export type SignerSource = 'env' | 'request' | 'keystore' | (string & {});
export type TrackedContractCallResponse = ContractReadResponse | ContractWriteResponse;
```

<!-- api-hash: 773886c17875f7971d8b2b725d0649673f0dffff050c34c5e3cf1483da90dbe7 -->
