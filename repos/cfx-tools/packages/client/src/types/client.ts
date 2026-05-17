/** Options for `ConfluxDevkitClient`. */
export interface ConfluxDevkitClientOptions {
  /** Base URL of the devnode-server, e.g. `http://localhost:52000`. */
  baseUrl: string;
  /**
   * Optional fetch implementation. Defaults to the global `fetch`.
   * Useful for Node.js environments or testing.
   */
  fetch?: typeof fetch;
}
