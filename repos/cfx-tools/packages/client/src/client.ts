import { HttpClient } from './http.js';
import {
  type AccountsNamespace,
  type BootstrapNamespace,
  type CompilerNamespace,
  type ContractsNamespace,
  createAccountsNamespace,
  createBootstrapNamespace,
  createCompilerNamespace,
  createContractsNamespace,
  createDeployNamespace,
  createHealthNamespace,
  createKeystoreNamespace,
  createMiningNamespace,
  createNetworkNamespace,
  createNodeNamespace,
  createSessionKeysNamespace,
  type DeployNamespace,
  type HealthNamespace,
  type KeystoreNamespace,
  type MiningNamespace,
  type NetworkNamespace,
  type NodeNamespace,
  type SessionKeysNamespace,
} from './namespaces.js';
import type { ConfluxDevkitClientOptions } from './types.js';

export type { ConfluxDevkitClientOptions };

/**
 * Typed HTTP client for the Conflux Devkit devnode-server control plane.
 *
 * @example
 * ```ts
 * const client = new ConfluxDevkitClient({ baseUrl: 'http://localhost:52000' });
 * await client.node.status();
 * await client.keystore.unlock({ passphrase: 'secret' });
 * await client.accounts.fund({ address: '0x...', amount: 10 });
 * ```
 */
export class ConfluxDevkitClient {
  readonly health: HealthNamespace;
  readonly node: NodeNamespace;
  readonly keystore: KeystoreNamespace;
  readonly accounts: AccountsNamespace;
  readonly bootstrap: BootstrapNamespace;
  readonly compiler: CompilerNamespace;
  readonly contracts: ContractsNamespace;
  readonly deploy: DeployNamespace;
  readonly network: NetworkNamespace;
  readonly mining: MiningNamespace;
  readonly sessionKeys: SessionKeysNamespace;

  constructor(options: ConfluxDevkitClientOptions) {
    const http = new HttpClient(options.baseUrl, options.fetch);
    this.health = createHealthNamespace(http);
    this.node = createNodeNamespace(http);
    this.keystore = createKeystoreNamespace(http);
    this.accounts = createAccountsNamespace(http);
    this.bootstrap = createBootstrapNamespace(http);
    this.compiler = createCompilerNamespace(http);
    this.contracts = createContractsNamespace(http);
    this.deploy = createDeployNamespace(http);
    this.network = createNetworkNamespace(http);
    this.mining = createMiningNamespace(http);
    this.sessionKeys = createSessionKeysNamespace(http);
  }
}

/**
 * Factory function alternative to `new ConfluxDevkitClient(...)`.
 *
 * @example
 * ```ts
 * const client = createConfluxDevkitClient({ baseUrl: 'http://localhost:52000' });
 * ```
 */
export function createConfluxDevkitClient(
  options: ConfluxDevkitClientOptions,
): ConfluxDevkitClient {
  return new ConfluxDevkitClient(options);
}

/** @internal */
export { HttpClient } from './http.js';
