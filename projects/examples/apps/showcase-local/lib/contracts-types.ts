// Contract types — canonical source is @cfxdevkit/client
export type {
  ContractRecord as ShowcaseContractRecord,
  Network as ContractNetworkId,
  Space as ContractSpaceId,
} from '@cfxdevkit/client';

import type { ContractRecord } from '@cfxdevkit/client';

export interface ShowcaseContractsResponse {
  ok: boolean;
  contracts: ContractRecord[];
  error?: string;
}
