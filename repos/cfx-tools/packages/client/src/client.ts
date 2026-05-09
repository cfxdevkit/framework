import { HttpClient } from './http.js';
import {
  type AccountsNamespace,
  type ContractsNamespace,
  createAccountsNamespace,
  createContractsNamespace,
  createKeystoreNamespace,
  createMiningNamespace,
  createNetworkNamespace,
  createNodeNamespace,
  type KeystoreNamespace,
  type MiningNamespace,
  type NetworkNamespace,
  type NodeNamespace,
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
  readonly node: NodeNamespace;
  readonly keystore: KeystoreNamespace;
  readonly accounts: AccountsNamespace;
  readonly contracts: ContractsNamespace;
  readonly network: NetworkNamespace;
  readonly mining: MiningNamespace;

  constructor(options: ConfluxDevkitClientOptions) {
    const http = new HttpClient(options.baseUrl, options.fetch);
    this.node = createNodeNamespace(http);
    this.keystore = createKeystoreNamespace(http);
    this.accounts = createAccountsNamespace(http);
    this.contracts = createContractsNamespace(http);
    this.network = createNetworkNamespace(http);
    this.mining = createMiningNamespace(http);
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
