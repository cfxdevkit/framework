/**
 * Canonical hex addresses for Conflux internal contracts.
 * Valid on both mainnet (chainId 1029/1030) and testnet (1/71).
 */
export const CONFLUX_PRECOMPILE_ADDRESSES = {
  /** Core Space: set/revoke/query admin for a contract */
  AdminControl: '0x0888000000000000000000000000000000000000',
  /** Core Space: gas/storage sponsorship management */
  SponsorWhitelist: '0x0888000000000000000000000000000000000001',
  /** Core Space: PoS staking deposit, withdraw, vote lock */
  Staking: '0x0888000000000000000000000000000000000002',
  /** Core Space: PoS validator registration and reward tracking */
  PoSRegister: '0x0888000000000000000000000000000000000005',
  /** eSpace & Core Space: synchronous Core↔eSpace message passing */
  CrossSpaceCall: '0x0888000000000000000000000000000000000006',
  /** Core Space: on-chain governance parameter control */
  ParamsControl: '0x0888000000000000000000000000000000000007',
} as const;
