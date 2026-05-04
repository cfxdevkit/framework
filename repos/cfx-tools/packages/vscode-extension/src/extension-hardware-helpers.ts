// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './extension-helper-shared.js';

export async function ensureHardwareSigner(this: ExtensionRuntime): Promise<Signer> {
  const backend = this.selectedBackend();
  if (this.cachedSigner?.backend === backend) return this.cachedSigner.signer;
  const signer =
    backend === 'onekey' ? await this.connectOneKeySigner() : await this.connectSatoshiSigner();
  this.cachedSigner = { backend, signer };
  return signer;
}

export async function connectOneKeySigner(this: ExtensionRuntime): Promise<Signer> {
  const connectId = await vscode.window.showInputBox({
    title: 'OneKey connect id',
    prompt: 'Device connect id returned by the OneKey SDK',
    ignoreFocusOut: true,
  });
  if (!connectId) throw new Error('OneKey connection cancelled.');
  const deviceId = await vscode.window.showInputBox({
    title: 'OneKey device id',
    prompt: 'Device id returned by the OneKey SDK',
    ignoreFocusOut: true,
  });
  if (!deviceId) throw new Error('OneKey connection cancelled.');
  const path = await vscode.window.showInputBox({
    title: 'OneKey derivation path',
    value: "m/44'/60'/0'/0/0",
    ignoreFocusOut: true,
  });
  const sdkModule = await dynamicImport('@onekeyfe/hd-common-sdk').catch((cause) => {
    throw new Error(
      `OneKey SDK is not installed in the extension host (${cause instanceof Error ? cause.message : String(cause)}).`,
    );
  });
  const sdk = (sdkModule.default ?? sdkModule) as OneKeySdkLike & {
    init?: (input: { debug: boolean }) => Promise<void>;
  };
  await sdk.init?.({ debug: false });
  return signerFromOneKey({
    sdk,
    connectId,
    deviceId,
    chainId: this.currentChain('espace').id,
    ...(path ? { path } : {}),
  });
}

export async function connectSatoshiSigner(this: ExtensionRuntime): Promise<Signer> {
  const bridgeUrl = await vscode.window.showInputBox({
    title: 'Satoshi/Satochip bridge URL',
    value: this.config().get<string>('satoshiBridgeUrl', 'http://127.0.0.1:8397'),
    ignoreFocusOut: true,
  });
  if (!bridgeUrl) throw new Error('Satoshi connection cancelled.');
  const pin = await vscode.window.showInputBox({
    title: 'Satoshi/Satochip PIN',
    prompt: 'Leave empty if the card is already unlocked',
    password: true,
    ignoreFocusOut: true,
  });
  const keypath = await vscode.window.showInputBox({
    title: 'Satoshi/Satochip derivation path',
    value: "m/44'/60'/0'/0/0",
    ignoreFocusOut: true,
  });
  return signerFromSatochip({
    bridgeUrl,
    ...(pin ? { pin } : {}),
    ...(keypath ? { keypath } : {}),
  });
}
