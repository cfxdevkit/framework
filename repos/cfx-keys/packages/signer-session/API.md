# `@cfxdevkit/signer-session` — Public API

> Headless signer session factory — create a ready Signer pair (eSpace + Core) from any backend without browser UI.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 23 symbols |

---

## `.`

```ts
// Represents a file-based keystore input for initializing a signer session.
export { FileKeystoreSignerInput }

// Represents a Ledger hardware wallet input for initializing a signer session.
export { LedgerSignerInput }

// Represents an in-memory (ephemeral) input for initializing a signer session.
export { MemorySignerInput }

// Represents a OneKey hardware wallet input for initializing a signer session.
export { OneKeySignerInput }

// A session object encapsulating both eSpace and Core signer instances, ready for use.
export { SignerSession }

// Input configuration object used to create a `SignerSession`.
export { SignerSessionInput }

// Enum indicating the type of signer being used (e.g., file, ledger, memory, onekey).
export { SignerSessionKind }

// A file-based keystore entry, containing metadata and path info for a keystore file.
export { FileKeystoreSignerEntry }

// A Ledger hardware wallet entry, containing metadata for ledger device interaction.
export { LedgerSignerEntry }

// An in-memory (ephemeral) entry, representing a temporary signer instance.
export { MemorySignerEntry }

// A OneKey hardware wallet entry, containing metadata for OneKey device interaction.
export { OneKeySignerEntry }

// Configuration object for a signer, including options like derivation path and network.
export { SignerConfig }

// Union type representing any valid signer entry (file, ledger, memory, onekey).
export { SignerEntry }

// Enum indicating the kind of signer (e.g., 'file', 'ledger', 'memory', 'onekey').
export { SignerKind }

// Default configuration for a signer session, used when no explicit config is provided.
export { defaultSignerConfig }

// Ensures that a signer JSON config file is present and git-ignored for security.
export { ensureSignerJsonGitignored }

// Reads and parses a signer configuration file from disk.
export { readSignerConfig }

// Resolves a `SignerEntry` from a given input or configuration.
export { resolveSignerEntry }

// Returns the default path where signer configuration files are stored.
export { signerConfigPath }

// Writes a signer configuration object to disk.
export { writeSignerConfig }

// Creates a `SignerSession` from a `SignerSessionInput`, supporting all signer types.
export declare function createSignerSession(input: SignerSessionInput): Promise<SignerSession>;

// Creates a `SignerSession` by loading a named configuration from disk (or default if none).
// Optionally specify a custom working directory (`cwd`) for config resolution.
export declare function createSignerSessionFromConfig(name?: string | null, cwd?: string): Promise<SignerSession>;

// Warning message displayed when using an ephemeral (in-memory) signer.
export declare const EPHEMERAL_WARNING = "\u26A0 ephemeral memory signer \u2014 key exists only for this session. Use `cdk signer setup` to configure a persistent signer.";
```

### Usage

```ts
import { createSignerSession } from '@cfxdevkit/signer-session';

// Create a session using an in-memory signer (ephemeral)
const session = await createSignerSession({ kind: 'memory' });

// Or load from a named config file (e.g., `~/.cdk/signer-config.json`)
const sessionFromConfig = await createSignerSessionFromConfig('my-signer');
```

<!-- api-hash: 7203f5150428f8e3088c6a0cb8c9258047326ba6df370a27319ce309b419733f -->
