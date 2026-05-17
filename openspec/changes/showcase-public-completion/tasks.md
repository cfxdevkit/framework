## 1. Wallet Route Completion

- [x] 1.1 Extend `/wallet` with personal-sign, EIP-712, and CIP-23 signing demonstrations.
- [x] 1.2 Add send-transaction flows for eSpace and Core Space with a send-to-self shortcut.
- [x] 1.3 Preserve the current connection and chain-switch surface while adding the new wallet actions.
- [x] 1.4 Ensure the richer dashboard shows address, balance, and chain-state context for both wallet families.
- [x] 1.5 Evaluate whether `/siwe` needs hardening for release or can remain as-is, and document that decision.

## 2. Core Route Completion

- [x] 2.1 Read the current `/core` page and decide whether new lookup sections can stay inline or should be factored into components.
- [x] 2.2 Add block lookup examples for hash- and epoch-based reads.
- [x] 2.3 Add transaction and receipt lookup examples.
- [x] 2.4 Add cross-space read examples to `/core`.
- [x] 2.5 Keep the existing chain list, codec, and unit-helper demos intact.

## 3. Hardware Wallet Completion

- [x] 3.1 Add `@cfxdevkit/wallet` to `projects/examples/apps/showcase-public/package.json`.
- [x] 3.2 Read the current `/keys` page and add a dedicated hardware wallet section to it.
- [x] 3.3 Audit the legacy `hardware-wallet-showcase` flows so no unique release-critical behavior is dropped during the port.
- [x] 3.4 Implement a memory-wallet panel that generates a browser wallet, derives Core and eSpace addresses, displays current balance context, and signs a demo message.
- [x] 3.5 Implement a Ledger panel that checks WebHID availability, connects to the device, derives Core and eSpace addresses, displays current balance context, and signs a demo message.
- [x] 3.6 Port any remaining release-critical on-chain interaction proof from the legacy hardware app, or document and supersede it before deleting the old app.
- [x] 3.7 Keep file-keystore behavior out of the public showcase hardware section.
- [x] 3.8 Delete `projects/examples/apps/hardware-wallet-showcase/` after its keeper content is ported.

## 4. Validation

- [x] 4.1 Verify the existing `/wallet` connection and chain-switch flows still behave as before.
- [x] 4.2 Verify the `/core` route remains browser-only and does not introduce backend dependencies.
- [x] 4.3 Verify the `/keys` hardware section is rendered from `/keys` and does not introduce backend dependencies.
- [x] 4.4 Run the affected app validation and workspace typecheck after the public showcase additions land.
- [ ] 4.5 Run `pnpm check:unused` and confirm the legacy hardware-wallet app has no remaining references.
	- Ran `pnpm check:unused`; the deleted app no longer has active workspace/script references, but the command still fails on unrelated workspace unused-export and duplicate-export findings.