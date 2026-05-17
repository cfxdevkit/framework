## Phase 1 — Type and routing scaffolding

- [x] 1.1 Add `'reveal'` to `WorkspaceSectionId` union and `WORKSPACE_SECTIONS` array in
       `app/workspace/shared.ts`
- [x] 1.2 Add a **Reveal** nav entry under the "Auth" group in `app/shell/index.tsx` and
       add `'reveal'` to the `GATE_EXEMPT` list

## Phase 2 — Client helpers

- [x] 2.1 Add `requestReveal` and `consumeReveal` fetch helpers to
       `app/keystore/client.ts`, including the inline response types
       (`RevealRequestResponse`, `RevealConsumeResponse`)
- [x] 2.2 Verify `pnpm --filter @cfxdevkit/example-showcase-local exec tsc --noEmit` is
       clean after helper additions

## Phase 3 — RevealPanel component

- [x] 3.1 Create `app/panels/reveal.tsx`:
       - Phase guard (null `activeWallet` → locked message)
       - Request form: kind selector, conditional account index, passphrase input,
         submit button
       - Consume view: token display, reveal button, revealed secret with copy +
         auto-clear countdown + clear button, warning note
- [x] 3.2 Register `RevealPanel` in `app/panels/registry.ts` under section `'reveal'`
- [x] 3.3 Wire any needed props through `ShowcaseWorkspacePanelsProps` if not already
       present (check `activeWallet` and `walletAccounts` are already passed)

## Phase 4 — Validation

- [x] 4.1 Run `pnpm --filter @cfxdevkit/example-showcase-local exec tsc --noEmit` —
       must pass with zero errors
- [x] 4.2 Browser smoke test:
       - Navigate to the **Reveal** section (Auth group)
       - With keystore locked: confirm locked-state message is shown
       - Unlock keystore and activate a wallet
       - Request a mnemonic reveal: enter passphrase, click Request → token appears
       - Click Reveal secret → mnemonic displayed with copy button
       - Confirm auto-clear countdown ticks and secret clears at 0
       - Request a private-key reveal with an explicit account index → verify it
         reveals a private key (different material from the mnemonic)
       - Confirm error state when wrong passphrase is entered
- [x] 4.3 Mark task 4.1 in the `examples-showcase-local` change as complete
