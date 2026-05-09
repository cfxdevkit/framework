import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';

export interface WalletSummary {
  id: string;
  name: string;
  active: boolean;
}

export interface KeystoreStatus {
  locked: boolean;
  initialized: boolean;
  walletCount: number;
}

interface WalletEntry {
  id: string;
  name: string;
  mnemonic: string;
}

interface VaultData {
  wallets: WalletEntry[];
}

interface VaultFile {
  version: 1;
  salt: string;
  iv: string;
  authTag: string;
  cipher: string;
  wallets: Array<{ id: string; name: string }>;
  active: string | null;
}

export class KeystoreService {
  readonly #path: string;
  #passphrase: string | null = null;
  #vault: VaultData | null = null;
  #active: string | null = null;

  constructor(path: string) {
    this.#path = path;
  }

  async status(): Promise<KeystoreStatus> {
    const initialized = await this.#isInitialized();
    return {
      locked: this.#passphrase === null,
      initialized,
      walletCount: this.#vault?.wallets.length ?? 0,
    };
  }

  async setup(passphrase: string): Promise<void> {
    if (await this.#isInitialized()) {
      throw new Error('keystore already initialized — use unlock instead');
    }
    this.#vault = { wallets: [] };
    this.#passphrase = passphrase;
    this.#active = null;
    await this.#save();
  }

  async unlock(passphrase: string): Promise<void> {
    const file = await this.#readFile();
    const decrypted = this.#decrypt(file, passphrase);
    this.#vault = decrypted;
    this.#passphrase = passphrase;
    this.#active = file.active;
  }

  lock(): void {
    this.#vault = null;
    this.#passphrase = null;
  }

  listWallets(): WalletSummary[] {
    this.#requireUnlocked();
    return (this.#vault as VaultData).wallets.map((w) => ({
      id: w.id,
      name: w.name,
      active: w.id === this.#active,
    }));
  }

  async addWallet(mnemonic: string, name: string): Promise<WalletSummary> {
    this.#requireUnlocked();
    const id = crypto.randomUUID();
    (this.#vault as VaultData).wallets.push({ id, name, mnemonic });
    if (this.#active === null) this.#active = id;
    await this.#save();
    return { id, name, active: this.#active === id };
  }

  async activateWallet(id: string): Promise<void> {
    this.#requireUnlocked();
    const wallet = (this.#vault as VaultData).wallets.find((w) => w.id === id);
    if (!wallet) throw new Error(`wallet not found: ${id}`);
    this.#active = id;
    await this.#save();
  }

  async deleteWallet(id: string): Promise<void> {
    this.#requireUnlocked();
    const vault = this.#vault as VaultData;
    const idx = vault.wallets.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`wallet not found: ${id}`);
    vault.wallets.splice(idx, 1);
    if (this.#active === id) {
      this.#active = vault.wallets[0]?.id ?? null;
    }
    await this.#save();
  }

  async renameWallet(id: string, name: string): Promise<void> {
    this.#requireUnlocked();
    const wallet = (this.#vault as VaultData).wallets.find((w) => w.id === id);
    if (!wallet) throw new Error(`wallet not found: ${id}`);
    wallet.name = name;
    await this.#save();
  }

  #requireUnlocked(): void {
    if (this.#vault === null) throw new Error('keystore is locked');
  }

  async #isInitialized(): Promise<boolean> {
    try {
      await access(this.#path);
      return true;
    } catch {
      return false;
    }
  }

  async #readFile(): Promise<VaultFile> {
    const raw = await readFile(this.#path, 'utf8');
    return JSON.parse(raw) as VaultFile;
  }

  #decrypt(file: VaultFile, passphrase: string): VaultData {
    const salt = Buffer.from(file.salt, 'hex');
    const key = scryptSync(passphrase, salt, 32);
    const iv = Buffer.from(file.iv, 'hex');
    const authTag = Buffer.from(file.authTag, 'hex');
    const cipherBuf = Buffer.from(file.cipher, 'hex');
    try {
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
      return JSON.parse(decrypted.toString('utf8')) as VaultData;
    } catch {
      throw new Error('invalid passphrase or corrupted keystore');
    }
  }

  async #save(): Promise<void> {
    const passphrase = this.#passphrase as string;
    const salt = randomBytes(32);
    const iv = randomBytes(16);
    const key = scryptSync(passphrase, salt, 32);
    const plaintext = Buffer.from(JSON.stringify(this.#vault), 'utf8');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const vault = this.#vault as VaultData;
    const file: VaultFile = {
      version: 1,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      cipher: encrypted.toString('hex'),
      wallets: vault.wallets.map((w) => ({ id: w.id, name: w.name })),
      active: this.#active,
    };
    await writeFile(this.#path, JSON.stringify(file, null, 2), 'utf8');
  }
}
