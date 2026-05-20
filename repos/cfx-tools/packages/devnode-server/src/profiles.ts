import { join } from 'node:path';
import type { DevNodeConfig } from '@cfxdevkit/devnode';
import type { KeystoreService, WalletSummary } from '@cfxdevkit/keystore-server';

export interface NodeProfileSummary {
  id: string;
  name: string;
  dataDir: string;
  selected: boolean;
  locked: boolean;
  accountCount: number;
  firstAddress?: string;
}

export interface NodeProfileState {
  locked: boolean;
  profiles: NodeProfileSummary[];
  selectedProfile: NodeProfileSummary | null;
}

export interface NodeProfileServiceOptions {
  keystore: KeystoreService;
  isNodeRunning: () => boolean;
  dataDirRoot?: string;
}

const DEFAULT_DATA_DIR_ROOT = join(process.cwd(), '.devnode-profiles');

export class NodeProfileService {
  readonly #keystore: KeystoreService;
  readonly #isNodeRunning: () => boolean;
  readonly #dataDirRoot: string;
  #selectedProfileId: string | null = null;
  #selectedProfileSnapshot: NodeProfileSummary | null = null;

  constructor(options: NodeProfileServiceOptions) {
    this.#keystore = options.keystore;
    this.#isNodeRunning = options.isNodeRunning;
    this.#dataDirRoot = options.dataDirRoot ?? DEFAULT_DATA_DIR_ROOT;
  }

  async status(): Promise<NodeProfileState> {
    const locked = this.#isNodeRunning();
    const keystoreStatus = await this.#keystore.status();

    if (!keystoreStatus.initialized || keystoreStatus.walletCount === 0) {
      this.#selectedProfileId = null;
      this.#selectedProfileSnapshot = null;
      return { locked, profiles: [], selectedProfile: null };
    }

    if (keystoreStatus.locked) {
      return {
        locked,
        profiles: [],
        selectedProfile: this.#selectedProfileSnapshot
          ? { ...this.#selectedProfileSnapshot, locked }
          : null,
      };
    }

    const wallets = this.#keystore.listWallets();
    const selectedId = this.#resolveSelectedProfileId(wallets);
    const profiles = wallets.map((wallet) => this.#toSummary(wallet, wallet.id === selectedId));
    const selectedProfile = profiles.find((profile) => profile.id === selectedId) ?? null;

    this.#selectedProfileSnapshot = selectedProfile;
    return {
      locked,
      profiles,
      selectedProfile,
    };
  }

  async selectProfile(id: string): Promise<NodeProfileSummary> {
    if (this.#isNodeRunning()) {
      throw new Error('node profile cannot change while the node is running');
    }

    const keystoreStatus = await this.#keystore.status();
    if (!keystoreStatus.initialized || keystoreStatus.walletCount === 0) {
      throw new Error('create or import a mnemonic before selecting a node profile');
    }
    if (keystoreStatus.locked) {
      throw new Error('unlock the keystore before selecting a node profile');
    }

    const wallet = this.#keystore.listWallets().find((entry) => entry.id === id);
    if (!wallet) {
      throw new Error(`wallet not found: ${id}`);
    }

    this.#selectedProfileId = id;
    const summary = this.#toSummary(wallet, true);
    this.#selectedProfileSnapshot = summary;
    return summary;
  }

  async resolveNodeConfig(input: DevNodeConfig = {}): Promise<DevNodeConfig> {
    const keystoreStatus = await this.#keystore.status();
    if (!keystoreStatus.initialized || keystoreStatus.walletCount === 0) {
      return { ...input };
    }

    if (keystoreStatus.locked) {
      if (input.mnemonic?.trim()) {
        return { ...input };
      }
      throw new Error('unlock the keystore before starting the node with a stored profile');
    }

    const wallets = this.#keystore.listWallets();
    const selectedId = this.#resolveSelectedProfileId(wallets);
    if (!selectedId) {
      return { ...input };
    }

    const wallet = wallets.find((entry) => entry.id === selectedId);
    if (!wallet) {
      return { ...input };
    }

    const summary = this.#toSummary(wallet, true);
    this.#selectedProfileSnapshot = summary;

    return {
      ...input,
      dataDir: summary.dataDir,
      mnemonic: await this.#keystore.readWalletMnemonic(selectedId),
    };
  }

  #resolveSelectedProfileId(wallets: readonly WalletSummary[]): string | null {
    if (this.#selectedProfileId) {
      const selected = wallets.find((wallet) => wallet.id === this.#selectedProfileId);
      if (selected) {
        return selected.id;
      }
      this.#selectedProfileId = null;
    }

    const active = wallets.find((wallet) => wallet.active);
    return active?.id ?? wallets[0]?.id ?? null;
  }

  #toSummary(wallet: WalletSummary, selected: boolean): NodeProfileSummary {
    return {
      id: wallet.id,
      name: wallet.name,
      dataDir: join(this.#dataDirRoot, wallet.id),
      selected,
      locked: this.#isNodeRunning(),
      accountCount: wallet.accountCount,
      ...(wallet.firstEspaceAddress ? { firstAddress: wallet.firstEspaceAddress } : {}),
    };
  }
}
