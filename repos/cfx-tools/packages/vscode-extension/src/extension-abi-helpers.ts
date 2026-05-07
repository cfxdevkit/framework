// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode, waitForReceipt } from './extension-helper-shared.js';

export async function abiCallRead(
  this: ExtensionRuntime,
  fn: AbiFunctionTreeRecord,
  contract: ContractTreeRecord,
): Promise<void> {
  if (contract.network !== this.selectedNetwork()) {
    const action = await vscode.window.showWarningMessage(
      `Switch active network to ${contract.network} before calling this contract?`,
      'Switch',
    );
    if (action !== 'Switch') return;
    await this.setSelectedNetwork(contract.network as NetworkSelection);
  }
  const args = await this.promptAbiArgs(fn);
  if (!args) return;
  const client = await this.createClientFor(contract.target);
  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Calling ${contract.label}.${fn.name}...`,
    },
    () =>
      readContract({
        client,
        address: contract.address,
        abi: contract.abi as never,
        functionName: fn.name as never,
        args: args as never,
      }),
  );
  this.output.appendLine(`[READ] ${contract.label}.${fn.name} -> ${stringifyResult(result)}`);
  this.output.show(true);
}

export async function abiCallWrite(
  this: ExtensionRuntime,
  fn: AbiFunctionTreeRecord,
  contract: ContractTreeRecord,
): Promise<void> {
  if (contract.network !== this.selectedNetwork()) {
    const action = await vscode.window.showWarningMessage(
      `Switch active network to ${contract.network} before sending this transaction?`,
      'Switch',
    );
    if (action !== 'Switch') return;
    await this.setSelectedNetwork(contract.network as NetworkSelection);
  }
  const args = await this.promptAbiArgs(fn);
  if (!args) return;
  const value = fn.stateMutability === 'payable' ? await this.promptPayableValue() : undefined;
  if (value === null) return;
  const client = await this.createClientFor(contract.target);
  const signer = await this.walletSignerFor(contract.target);

  // Submit without waiting for receipt so we can immediately pack-mine on local.
  const submitted = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Sending ${contract.label}.${fn.name}…`,
    },
    () =>
      sendWrite({
        client,
        signer,
        address: contract.address,
        abi: contract.abi as never,
        functionName: fn.name as never,
        args: args as never,
        ...(value !== undefined ? { value } : {}),
        waitForReceipt: false,
      }),
  );

  // On local, pack immediately so the receipt arrives quickly.
  if (this.selectedNetwork() === 'local' && this.node?.isRunning()) {
    await this.node.packMine().catch(() => {});
  }

  const receiptTimeoutMs = this.selectedNetwork() === 'local' ? 60_000 : 120_000;
  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Waiting for ${fn.name} receipt…`,
    },
    () =>
      waitForReceipt(client, submitted.hash, { pollIntervalMs: 500, timeoutMs: receiptTimeoutMs }),
  );

  this.output.appendLine(
    `[WRITE] ${contract.label}.${fn.name} -> ${submitted.hash} (block ${(result as unknown as { blockNumber?: unknown }).blockNumber ?? 'n/a'})`,
  );
  this.output.show(true);
  await vscode.window.showInformationMessage(`${fn.name} confirmed: ${submitted.hash}`);
}

export async function promptAbiArgs(
  this: ExtensionRuntime,
  fn: AbiFunctionTreeRecord,
): Promise<unknown[] | null> {
  const inputs = fn.inputs ?? [];
  if (!inputs.length) return [];
  const raw = await vscode.window.showInputBox({
    title: `${fn.name} arguments`,
    prompt: inputs.map((input) => `${input.name || '(arg)'}: ${input.type}`).join(', '),
    placeHolder: this.abiArgsPlaceholder(inputs),
    ignoreFocusOut: true,
    validateInput: (value) => {
      try {
        const parsed = value.trim() ? (JSON.parse(value) as unknown) : [];
        return Array.isArray(parsed) ? null : 'Enter a JSON array';
      } catch {
        return 'Enter valid JSON';
      }
    },
  });
  if (raw === undefined) return null;
  return raw.trim() ? (JSON.parse(raw) as unknown[]) : [];
}

export function abiArgsPlaceholder(
  this: ExtensionRuntime,
  inputs: ReadonlyArray<{ name?: string; type: string }>,
): string {
  return `[${inputs.map((input) => this.placeholderForSolidityType(input.type)).join(', ')}]`;
}

export function placeholderForSolidityType(this: ExtensionRuntime, type: string): string {
  if (type.endsWith('[]')) return '[]';
  if (type.includes('address')) return '"0x..."';
  if (type.includes('bool')) return 'true';
  if (type.includes('string')) return '"text"';
  if (type.includes('bytes')) return '"0x"';
  if (type.includes('int')) return '"0"';
  return 'null';
}

export async function promptPayableValue(
  this: ExtensionRuntime,
): Promise<bigint | undefined | null> {
  const raw = await vscode.window.showInputBox({
    title: 'Payable value',
    prompt: 'Value in wei/drip. Leave empty for 0.',
    validateInput: (value) =>
      value.trim() === '' || /^\d+$/.test(value.trim()) ? null : 'Enter a non-negative integer',
  });
  if (raw === undefined) return null;
  return raw.trim() ? BigInt(raw.trim()) : undefined;
}

export function parseArgValue(
  this: ExtensionRuntime,
  value: string,
  solidityType: string,
): unknown {
  if (solidityType.endsWith('[]')) {
    return JSON.parse(value);
  }
  if (solidityType.startsWith('uint') || solidityType.startsWith('int')) {
    return BigInt(value);
  }
  if (solidityType === 'bool') {
    return value.toLowerCase() === 'true';
  }
  return value;
}
