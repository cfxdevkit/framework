/**
 * CDK Starter — public API surface
 *
 * Re-exports the full CDK API for convenience. Import from sub-paths directly
 * for better tree-shaking:
 *
 *   import { createClient, http } from '@cfxdevkit/cdk/client';
 *   import { espaceTestnet }      from '@cfxdevkit/cdk/chains';
 */

// chains
export {
  espaceMainnet,
  espaceTestnet,
  espaceLocal,
  coreSpaceMainnet,
  coreSpaceTestnet,
  coreSpaceLocal,
  getChain,
  listChains,
  type ChainConfig,
  type ChainFamily,
  type Network,
} from '@cfxdevkit/cdk/chains';

// client
export {
  createClient,
  http,
  ws,
  fallback,
  type Client,
  type EspaceClient,
  type CoreSpaceClient,
  type RpcRequest,
  type CallOptions,
  type GetBalanceOptions,
} from '@cfxdevkit/cdk/client';

// wallet
export {
  signerFromPrivateKey,
  signerFromDualAccount,
  deriveAccount,
  deriveAccounts,
  deriveDualAccount,
  generateMnemonic,
  validateMnemonic,
  type Signer,
  type Account,
  type SignableTx,
} from '@cfxdevkit/cdk/wallet';

// units
export {
  formatUnits,
  parseUnits,
  formatCFX,
  parseCFX,
  formatDrip,
  parseDrip,
  formatGDrip,
  parseGDrip,
  formatToken,
  stringifyBigInt,
  MAX_UINT256,
  MAX_UINT128,
  ZERO_ADDRESS,
} from '@cfxdevkit/cdk/units';

// address
export {
  hexToBase32,
  base32ToHex,
  isBase32Address,
  getCoreAddress,
} from '@cfxdevkit/cdk/address';

// errors
export {
  CfxError,
  isCfxError,
  RpcError,
  ContractError,
  WalletError,
  KeystoreError,
  type CfxErrorInit,
} from '@cfxdevkit/cdk/errors';

// types
export type {
  Address,
  Hex,
  Hash,
  Wei,
  ChainId,
  BlockTag,
  EpochTag,
  TxReceipt,
  TxRequest,
  NodeStatus,
  Block,
} from '@cfxdevkit/cdk/types';
