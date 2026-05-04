export interface CapabilityInput {
  chains: number[];
  contracts: string[];
  selectors: string[];
  maxValuePerTx: string;
  notAfterMs: number;
}

export interface IssuedKey {
  parent: string;
  session: string;
  attestation: { message: string; signature: string; digest: string };
  capability: Record<string, unknown>;
  inputCapability: CapabilityInput;
}

export const CHAIN_OPTIONS = [
  { id: 1030, label: 'Conflux eSpace mainnet (1030)' },
  { id: 71, label: 'Conflux eSpace testnet (71)' },
  { id: 2030, label: 'Conflux eSpace devnet (2030)' },
  { id: 1, label: 'Ethereum mainnet (1)' },
];
