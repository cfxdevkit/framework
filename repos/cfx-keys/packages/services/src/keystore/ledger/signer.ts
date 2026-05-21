import type { Address, Hex } from '@cfxdevkit/cdk';
import {
  KeystoreError,
  type SignableTx,
  type Signer,
  type SignOptions,
  type TypedData,
} from '@cfxdevkit/cdk';
import { DEFAULT_CORE_PATH, DEFAULT_ESPACE_PATH } from '@cfxdevkit/cdk/wallet';
import { serializeTransaction } from 'viem';
import {
  getCoreLedgerAddress,
  getCoreLedgerInfo,
  signCoreLedgerMessage,
  signCoreLedgerTransaction,
} from './core-apdu.js';
import {
  canonicalHex,
  finaliseEip1559Tx,
  messageHex,
  normaliseLedgerSignature,
  signatureToHex,
  stripHex,
  toEip1559,
} from './signature.js';
import type { SignerFromLedgerInput } from './types.js';

export async function signerFromLedger(input: SignerFromLedgerInput): Promise<Signer> {
  const path = input.path ?? (input.family === 'core' ? DEFAULT_CORE_PATH : DEFAULT_ESPACE_PATH);
  if (input.family === 'core') return signerFromLedgerCore(input, path);
  const eth = input.eth;
  if (!eth) throw missingApp('Ethereum');
  const addressResponse = await ledgerCall(
    () => eth.getAddress(path, input.showAddressOnDevice ?? false, false, input.chainId),
    'get address',
  );
  const address = canonicalHex(addressResponse.address) as Address;
  if (input.expectedAddress && address.toLowerCase() !== input.expectedAddress.toLowerCase()) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/address-mismatch',
      message: 'Ledger returned an address that does not match expectedAddress',
      meta: { expected: input.expectedAddress, actual: address },
    });
  }
  const account = {
    address,
    publicKey: addressResponse.publicKey ? canonicalHex(addressResponse.publicKey) : ('0x' as Hex),
  };
  return {
    account,
    signTransaction: (tx, opts) => signLedgerTransaction(input, eth, path, tx, opts),
    signMessage: (message, opts) => signLedgerMessage(eth, path, message, opts),
    signTypedData: (typedData, opts) => signLedgerTypedData(eth, path, typedData, opts),
  };
}

async function signLedgerTransaction(
  input: SignerFromLedgerInput,
  eth: NonNullable<SignerFromLedgerInput['eth']>,
  path: string,
  tx: SignableTx,
  opts?: SignOptions,
): Promise<Hex> {
  checkAborted(opts?.signal);
  if (tx.family === 'core') {
    if (!input.coreTransport) throw missingApp('Conflux Core');
    return signCoreLedgerTransaction({ transport: input.coreTransport, path, tx });
  }
  const eip1559 = toEip1559(tx);
  const sig = await ledgerCall(
    () => eth.signTransaction(path, stripHex(serializeTransaction(eip1559)), null),
    'sign transaction',
  );
  return finaliseEip1559Tx(eip1559, normaliseLedgerSignature(sig));
}

async function signerFromLedgerCore(input: SignerFromLedgerInput, path: string): Promise<Signer> {
  if (!input.coreTransport) throw missingApp('Conflux Core');
  const networkId = Number(input.coreNetworkId ?? input.chainId ?? 1029);
  const appInfo = await getCoreLedgerInfo(input.coreTransport);
  const canSignMessages = versionAtLeast(appInfo, 2, 3, 0);
  const account = await getCoreLedgerAddress({
    transport: input.coreTransport,
    path,
    networkId,
    ...(input.showAddressOnDevice !== undefined ? { display: input.showAddressOnDevice } : {}),
  });
  return {
    account,
    signTransaction: async (tx, opts) => {
      checkAborted(opts?.signal);
      return signCoreLedgerTransaction({ transport: input.coreTransport as never, path, tx });
    },
    signMessage: async (message, opts) => {
      checkAborted(opts?.signal);
      if (!canSignMessages) throw unsupportedCoreMessageSigning(appInfo);
      return signCoreLedgerMessage({
        transport: input.coreTransport as never,
        path,
        chainId: networkId,
        message,
      });
    },
    signTypedData: async (_typedData, _opts) => {
      throw new KeystoreError({
        code: 'services/keystore/ledger/core-typed-data-unsupported',
        message: 'Conflux Core Ledger app does not expose EIP-712 signing',
      });
    },
  };
}

function versionAtLeast(
  version: { major: number; minor: number; patch: number },
  major: number,
  minor: number,
  patch: number,
): boolean {
  if (version.major !== major) return version.major > major;
  if (version.minor !== minor) return version.minor > minor;
  return version.patch >= patch;
}

function unsupportedCoreMessageSigning(version: {
  major: number;
  minor: number;
  patch: number;
}): KeystoreError {
  return new KeystoreError({
    code: 'services/keystore/ledger/core-message-unsupported',
    message: `Conflux Core Ledger app ${version.major}.${version.minor}.${version.patch} does not expose Core message signing in the published app source. Transaction signing still uses the current SIGN_TX APDU flow.`,
  });
}

function missingApp(app: string): KeystoreError {
  return new KeystoreError({
    code: 'services/keystore/ledger/app-unavailable',
    message: `${app} Ledger app client is required for this signer`,
  });
}

async function signLedgerMessage(
  eth: NonNullable<SignerFromLedgerInput['eth']>,
  path: string,
  message: string | Uint8Array,
  opts?: SignOptions,
): Promise<Hex> {
  checkAborted(opts?.signal);
  const sig = await ledgerCall(
    () => eth.signPersonalMessage(path, stripHex(messageHex(message))),
    'sign message',
  );
  return signatureToHex(normaliseLedgerSignature(sig));
}

async function signLedgerTypedData(
  eth: NonNullable<SignerFromLedgerInput['eth']>,
  path: string,
  typedData: TypedData,
  opts?: SignOptions,
): Promise<Hex> {
  checkAborted(opts?.signal);
  const signEip712 = eth.signEIP712Message;
  if (!signEip712) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/typed-data-unsupported',
      message: 'Ledger Ethereum app client does not expose EIP-712 signing',
    });
  }
  const sig = await ledgerCall(() => signEip712.call(eth, path, typedData), 'sign typed data');
  return signatureToHex(normaliseLedgerSignature(sig));
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/aborted',
      message: 'Ledger operation aborted',
      cause: signal.reason,
    });
  }
}

async function ledgerCall<T>(call: () => Promise<T>, action: string): Promise<T> {
  try {
    return await call();
  } catch (cause) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/device-error',
      message: cause instanceof Error ? cause.message : `Ledger failed to ${action}`,
      cause,
      meta: { action },
    });
  }
}
