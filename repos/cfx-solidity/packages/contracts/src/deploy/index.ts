import type { Abi } from 'viem';
import { toHex } from 'viem';
import { deployCoreContract } from './core.js';
import { deployEspaceContract } from './espace.js';
import type { DeployContractInput, DeployContractResult } from './types.js';

export type { DeployContractInput, DeployContractResult } from './types.js';

export async function deployContract<TAbi extends Abi>(
  input: DeployContractInput<TAbi>,
): Promise<DeployContractResult> {
  return input.client.family === 'core'
    ? deployCoreContract(input, input.client)
    : deployEspaceContract(input, input.client);
}

// Keep `toHex` re-exported so callers can build raw txs without re-importing viem.
export { toHex };
