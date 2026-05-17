/** Shape of all server `{ ok }` responses. */
export interface OkResponse {
  ok: boolean;
}

/** Health response from the shared runtime. */
export interface HealthResponse {
  ok: boolean;
}

/** Account info as returned by `/accounts`. */
export interface AccountInfo {
  index: number;
  evmAddress: string;
  coreAddress: string;
  initialBalanceCfx: number;
}
