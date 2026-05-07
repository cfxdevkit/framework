// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from './extension-helper-shared.js';

export async function pickTemplateArtifact(
  this: ExtensionRuntime,
): Promise<{ artifact: Artifact; template: TemplateMeta } | null> {
  const templates = listTemplates();
  const picked = await vscode.window.showQuickPick(
    templates.map((template) => ({
      label: template.name,
      description: template.description,
      template,
    })),
    { title: 'Built-in Templates', placeHolder: 'Choose a built-in contract template' },
  );
  if (!picked) return null;

  const output = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Compiling ${picked.template.name}…`,
    },
    () =>
      compile({
        sources: picked.template.sources,
        solcVersion: picked.template.solcVersion,
        evmVersion: picked.template.evmVersion ?? 'paris',
      }),
  );
  const artifact =
    output.artifacts.find((a) => a.contractName === picked.template.contractName) ?? null;
  if (!artifact) return null;
  return { artifact, template: picked.template };
}

export async function pickWorkspaceArtifact(this: ExtensionRuntime): Promise<Artifact | null> {
  const workspace = this.workspaceRoot();
  const files = await vscode.workspace.findFiles(
    '**/*.sol',
    '**/{node_modules,dist,coverage,.git}/**',
  );
  if (!files.length) {
    throw new Error('No Solidity files were found in the current workspace.');
  }
  const picked = await vscode.window.showQuickPick(
    files.map((file) => ({
      label: relative(workspace, file.fsPath),
      file,
    })),
    { title: 'Workspace Solidity Files', placeHolder: 'Choose a Solidity source file' },
  );
  if (!picked) return null;

  const solcVersion =
    (await vscode.window.showInputBox({
      title: 'Solc version',
      prompt: 'Exact Solidity compiler version to use',
      value: '0.8.26',
    })) ?? '0.8.26';

  const content = await fs.readFile(picked.file.fsPath, 'utf8');
  const output = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Compiling ${picked.label}…`,
    },
    () =>
      compile({
        sources: [{ path: relative(workspace, picked.file.fsPath), content }],
        solcVersion,
        evmVersion: this.selectedNetwork() === 'local' ? 'paris' : undefined,
        resolver: npmResolver({ rootDir: workspace }),
      }),
  );

  if (output.warnings.length) {
    this.log(output.warnings.map((warning) => warning.message).join('\n'));
  }

  if (output.artifacts.length === 1) return output.artifacts[0] ?? null;

  const artifactPick = await vscode.window.showQuickPick(
    output.artifacts.map((artifact) => ({
      label: artifact.contractName,
      description: artifact.path,
      artifact,
    })),
    { title: 'Compiled Artifacts', placeHolder: 'Choose the contract artifact to deploy' },
  );
  return artifactPick?.artifact ?? null;
}

export async function promptConstructorArgs(
  this: ExtensionRuntime,
  artifact: Artifact,
  defaults?: ReadonlyArray<{ name?: string; type?: string; defaultValue?: string }>,
): Promise<unknown[] | null> {
  const constructorAbi = (
    artifact.abi as unknown as ReadonlyArray<{
      type?: string;
      inputs?: ReadonlyArray<{ name?: string; type: string }>;
    }>
  ).find((entry) => entry.type === 'constructor');
  const inputs = constructorAbi?.inputs ?? [];
  const args: unknown[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (!input) continue;
    const defaultValue = defaults?.[i]?.defaultValue;
    const raw = await vscode.window.showInputBox({
      title: `${artifact.contractName} constructor`,
      prompt: `${input.name || '(arg)'}: ${input.type}`,
      placeHolder: input.type,
      value: defaultValue,
      ignoreFocusOut: true,
    });
    if (raw === undefined) return null;
    args.push(this.parseArgValue(raw, input.type));
  }

  return args;
}
