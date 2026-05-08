// @ts-nocheck
// biome-ignore-all lint/correctness/noUnusedImports: extension helper groups share the VS Code runtime surface.
// biome-ignore-all format: compact generated wallet helper stays below hotspot limits.
// biome-ignore format: shared helper import is intentionally kept compact for hotspot limits.
import { BACKEND_LABELS, compile, coreAddressFromPrivateKey, coreSpaceLocal, coreSpaceMainnet, coreSpaceTestnet, createAppendOnlyAuditLogger, createClient, createDevNode, createFileKeystore, DERIVATION_BASE, deployContract, deriveAccount, dynamicImport, espaceLocal, espaceMainnet, espaceTestnet, formatBalance, formatCFX, fs, generateMnemonic, hexToBase32, http, initFileKeystore, isAbsolute, isInsideWorkspace, join, KEYSTORE_SERVICE, listTemplates, makeAccountItems, makeContractItems, makeNetworkItems, makeNodeItems, NETWORKS, npmResolver, readContract, relative, rotateLocalPassphrase, STATE_ACTIVE_ACCOUNT_INDEX, STATE_ACTIVE_FILE_REF, STATE_KEYSTORE_BACKEND, STATE_NETWORK, STATE_SPACE, StaticTreeProvider, sendWrite, signerFromOneKey, signerFromSatochip, stringifyResult, validateMnemonic, vscode } from '../shared.js';
export async function initializeWallet(this: ExtensionRuntime): Promise<void> {
  if (!(await this.ensureFileBackend())) return;
  if (!(await this.keystoreExists())) {
    await this.addWallet();
    return;
  }
  const action = await vscode.window.showQuickPick(
    [
      { label: 'Add mnemonic', command: 'add' as const },
      { label: 'Select active mnemonic account', command: 'select' as const },
      { label: 'Unlock keystore', command: 'unlock' as const },
    ],
    { title: 'Conflux: Keystore Mnemonics', placeHolder: 'Choose a keystore operation' },
  );
  if (!action) return;
  if (action.command === 'add') await this.addWallet();
  else if (action.command === 'select') await this.selectWallet();
  else await this.unlockKeystore();
}
export async function addWallet(this: ExtensionRuntime): Promise<void> {
  if (!(await this.ensureFileBackend())) return;
  let passphrase = this.unlockedPassphrase;
  if (!(await this.keystoreExists())) {
    passphrase = await this.promptNewKeystorePassphrase();
    if (!passphrase) return;
    await this.ensureWorkspaceDir();
    await initFileKeystore({ path: this.keystorePath(), passphrase });
    this.unlockedPassphrase = passphrase;
    this.fileProvider = this.fileKeystore(passphrase);
  }
  const provider = this.fileProvider ?? (await this.ensureFileKeystoreUnlocked());
  const wallets = await provider.list({ service: KEYSTORE_SERVICE });
  const source = await vscode.window.showQuickPick(
    [
      { label: 'Generate new mnemonic', value: 'generate' as const },
      { label: 'Import existing mnemonic', value: 'import-mnemonic' as const },
    ],
    { title: 'Conflux: Add Mnemonic Wallet', placeHolder: 'Choose mnemonic source' },
  );
  if (!source) return;
  const label = await vscode.window.showInputBox({
    title: 'Mnemonic label',
    prompt: 'Human-readable label for this mnemonic root',
    value: wallets.length ? `mnemonic-${wallets.length}` : 'mnemonic-default',
    validateInput: (value) => (value.trim() ? null : 'Mnemonic label is required'),
  });
  if (!label) return;
  const accountName = await vscode.window.showInputBox({
    title: 'Mnemonic root id',
    prompt: 'Stable id inside the keystore',
    value: this.sanitizeAccountName(label),
    validateInput: (value) => {
      const clean = value.trim();
      if (!clean) return 'Mnemonic id is required';
      if (wallets.some((wallet) => wallet.ref.account === clean)) return 'Mnemonic id exists';
      return null;
    },
  });
  if (!accountName) return;
  const ref: SecretRef = { service: KEYSTORE_SERVICE, account: accountName.trim() };
  const accountCountInput = await vscode.window.showInputBox({
    title: 'Derived accounts',
    prompt: 'Number of relative accounts to show for this mnemonic root',
    value: '5',
    validateInput: (value) => {
      const count = Number(value.trim());
      return Number.isInteger(count) && count >= 1 && count <= 50 ? null : 'Enter 1-50';
    },
  });
  if (!accountCountInput) return;
  const accountCount = Number(accountCountInput.trim());
  const mnemonic =
    source.value === 'generate'
      ? generateMnemonic(128)
      : await vscode.window.showInputBox({
          title: 'Import mnemonic',
          prompt: 'Enter your 12 or 24-word BIP-39 mnemonic phrase',
          password: true,
          ignoreFocusOut: true,
          validateInput: (value) =>
            validateMnemonic(value.trim()) ? null : 'Enter a valid BIP-39 mnemonic',
        });
  if (!mnemonic || !validateMnemonic(mnemonic.trim())) return;
  const first = deriveAccount({ mnemonic: mnemonic.trim(), path: this.derivationPath(0) });
  const firstAddress = first.account.address;
  await provider.put?.({
    ref,
    kind: 'mnemonic',
    secret: mnemonic.trim(),
    meta: {
      label: label.trim(),
      firstAddress,
      accountCount: String(accountCount),
      derivationBase: DERIVATION_BASE,
      storage: 'encrypted-file',
      createdBy: 'cfxdevkit-vscode-extension',
      source: source.value,
    },
  });
  await this.context.workspaceState.update(STATE_ACTIVE_FILE_REF, ref);
  await this.context.workspaceState.update(STATE_ACTIVE_ACCOUNT_INDEX, 0);
  this.localNodeMnemonic = mnemonic.trim();
  this.output.clear();
  this.output.appendLine('Conflux DevKit mnemonic wallet added.');
  this.output.appendLine(`Label: ${label.trim()}`);
  this.output.appendLine(`Ref: ${this.refKey(ref)}`);
  this.output.appendLine(`First account: ${firstAddress}`);
  this.output.appendLine(`Keystore: ${this.keystorePath()}`);
  this.output.show(true);
  if (source.value === 'generate') {
    const action = await vscode.window.showWarningMessage(
      'Mnemonic wallet added. Copy the recovery mnemonic now and store it outside this workspace.',
      { modal: true },
      'Copy Mnemonic',
    );
    if (action === 'Copy Mnemonic') await vscode.env.clipboard.writeText(mnemonic.trim());
  } else {
    await vscode.window.showInformationMessage('Mnemonic wallet added.');
  }
  await this.refreshAll();
}
export async function selectWallet(
  this: ExtensionRuntime,
  target?: WalletCommandTarget,
): Promise<void> {
  if (!(await this.ensureFileBackend())) return;
  const selectedTarget = this.walletTarget(target);
  if (selectedTarget?.walletRef) {
    this.cachedSigner = null;
    await this.context.workspaceState.update(STATE_ACTIVE_FILE_REF, selectedTarget.walletRef);
    await this.context.workspaceState.update(
      STATE_ACTIVE_ACCOUNT_INDEX,
      selectedTarget.accountIndex ?? 0,
    );
    await this.refreshAll();
    return;
  }
  const provider = await this.ensureFileKeystoreUnlocked();
  const wallets = await provider
    .list({ service: KEYSTORE_SERVICE })
    .then((items) => items.filter((item) => item.kind === 'mnemonic'));
  if (!wallets.length) {
    await vscode.window.showInformationMessage(
      'No mnemonic wallets are stored in the selected keystore.',
    );
    return;
  }
  const activeRef = this.selectedFileRef();
  const activeIndex = this.selectedAccountIndex();
  const picks = [] as Array<{
    label: string;
    description: string;
    detail: string;
    wallet: StoredSecret;
    index: number;
    picked: boolean;
  }>;
  for (const wallet of wallets) {
    const label = wallet.meta?.label ?? wallet.ref.account;
    const accountCount = Math.max(1, Number(wallet.meta?.accountCount ?? '1'));
    for (let index = 0; index < accountCount; index++) {
      const signer = await provider.getSigner(wallet.ref, this.currentCapability(), {
        derivationPath: this.derivationPath(index),
      });
      picks.push({
        label: `${label} #${index}`,
        description: signer.account.address,
        detail: `${this.refKey(wallet.ref)} • ${this.derivationPath(index)}`,
        wallet,
        index,
        picked: this.refKey(wallet.ref) === this.refKey(activeRef) && index === activeIndex,
      });
    }
  }
  const pick = await vscode.window.showQuickPick(picks, {
    title: 'Conflux: Select Active Mnemonic Account',
    placeHolder: 'Choose a mnemonic root and derived account',
  });
  if (!pick) return;
  this.cachedSigner = null;
  await this.context.workspaceState.update(STATE_ACTIVE_FILE_REF, pick.wallet.ref);
  await this.context.workspaceState.update(STATE_ACTIVE_ACCOUNT_INDEX, pick.index);
  await this.refreshAll();
}
export async function removeWallet(
  this: ExtensionRuntime,
  target?: WalletCommandTarget,
): Promise<void> {
  if (!(await this.ensureFileBackend())) return;
  const provider = await this.ensureFileKeystoreUnlocked();
  const wallets = await provider.list({ service: KEYSTORE_SERVICE });
  const mnemonicRoots = wallets.filter((wallet) => wallet.kind === 'mnemonic');
  if (!mnemonicRoots.length) {
    await vscode.window.showInformationMessage(
      'No mnemonic wallets are stored in the selected keystore.',
    );
    return;
  }
  const activeRef = this.selectedFileRef();
  const targetRef = this.walletTarget(target)?.walletRef;
  const targetWallet = targetRef
    ? mnemonicRoots.find((wallet) => this.refKey(wallet.ref) === this.refKey(targetRef))
    : undefined;
  const pick = targetWallet
    ? { label: targetWallet.meta?.label ?? targetWallet.ref.account, wallet: targetWallet }
    : await vscode.window.showQuickPick(
        mnemonicRoots.map((wallet) => ({
          label: wallet.meta?.label ?? wallet.ref.account,
          description: this.refKey(wallet.ref),
          detail:
            this.refKey(wallet.ref) === this.refKey(activeRef)
              ? 'active mnemonic root'
              : `${wallet.meta?.accountCount ?? '1'} derived account(s)`,
          wallet,
        })),
        { title: 'Conflux: Remove Mnemonic', placeHolder: 'Choose the mnemonic root to remove' },
      );
  if (!pick) return;
  const confirm = await vscode.window.showWarningMessage(
    `Remove mnemonic root ${pick.label} from ${this.keystorePathLabel()}?`,
    { modal: true },
    'Remove',
  );
  if (confirm !== 'Remove') return;
  await provider.remove?.(pick.wallet.ref);
  const remaining = (await provider.list({ service: KEYSTORE_SERVICE })).filter(
    (wallet) =>
      wallet.kind === 'mnemonic' && this.refKey(wallet.ref) !== this.refKey(pick.wallet.ref),
  );
  if (this.refKey(pick.wallet.ref) === this.refKey(activeRef)) {
    await this.context.workspaceState.update(STATE_ACTIVE_FILE_REF, remaining[0]?.ref ?? null);
    await this.context.workspaceState.update(STATE_ACTIVE_ACCOUNT_INDEX, 0);
    this.localNodeMnemonic = null;
  }
  await this.refreshAll();
  void vscode.window.showInformationMessage(`Removed ${pick.label}.`);
}
