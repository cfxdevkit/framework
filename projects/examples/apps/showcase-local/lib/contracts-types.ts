export type ContractNetworkId = 'local' | 'testnet' | 'mainnet';
export type ContractSpaceId = 'core' | 'espace';

export interface ShowcaseContractRecord {
  id: string;
  name: string;
  address: string;
  abi: unknown[];
  network: ContractNetworkId;
  chainId: number;
  space: ContractSpaceId;
  deployedAt: number;
}

export interface ShowcaseContractsResponse {
  ok: boolean;
  contracts: ShowcaseContractRecord[];
  error?: string;
}
