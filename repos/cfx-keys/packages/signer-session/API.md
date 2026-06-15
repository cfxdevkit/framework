# `@cfxdevkit/signer-session` — Public API

> Headless signer session factory — create a ready Signer pair (eSpace + Core) from any backend without browser UI.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 23 symbols |

---

## `.`

```ts
export { FileKeystoreSignerInput }
export { LedgerSignerInput }
export { MemorySignerInput }
export { OneKeySignerInput }
export { SignerSession }
export { SignerSessionInput }
export { SignerSessionKind }
export { FileKeystoreSignerEntry }
export { LedgerSignerEntry }
export { MemorySignerEntry }
export { OneKeySignerEntry }
export { SignerConfig }
export { SignerEntry }
export { SignerKind }
export { defaultSignerConfig }
export { ensureSignerJsonGitignored }
export { readSignerConfig }
export { resolveSignerEntry }
export { signerConfigPath }
export { writeSignerConfig }
export declare function createSignerSession(input: SignerSessionInput): Promise<SignerSession>;
export declare function createSignerSessionFromConfig(name?: string | null, cwd?: string): Promise<SignerSession>;
export declare const EPHEMERAL_WARNING = "\u26A0 ephemeral memory signer \u2014 key exists only for this session. Use `cdk signer setup` to configure a persistent signer.";
```

<!-- api-hash: 7203f5150428f8e3088c6a0cb8c9258047326ba6df370a27319ce309b419733f -->
