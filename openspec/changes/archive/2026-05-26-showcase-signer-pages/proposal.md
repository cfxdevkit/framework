## Why

The current `app/keys/page.tsx` renders the mnemonic tools AND the `HardwareWalletSection`
(Memory + Ledger + OneKey panels) on a single scrolling page. Three problems:

1. **Error attribution is impossible.** When a hardware error appears it's not clear which
   panel caused it. Errors from a Ledger disconnect can appear while you're reading a
   OneKey signature result.

2. **Can't test one wallet without the other visible.** The three panels have independent
   connection lifecycles. Having them adjacent adds visual and cognitive overhead during
   development or QA.

3. **Page is too long.** The capability matrix + three signing panels + referral card exceed
   comfortable scroll depth. Deep-linking to a specific wallet is not possible.

## What Changes

**Route structure:**
```
/keys              → overview page: mnemonic tools + capability matrix + links to each panel
/keys/memory       → memory wallet demo (gen + sign + EIP-712)
/keys/ledger       → Ledger demo (eSpace + Core, signMessage ×2)
/keys/onekey       → OneKey demo (connect + addresses + 4-op signing + referral)
```

Each wallet page:
- Has its own `<title>` and back-link to `/keys`
- Shows only its own error state
- Loads only the dependencies it needs (Ledger: no OneKey SDK; OneKey: no Ledger imports)

**`/keys` overview:**
- Keeps the mnemonic/validate/derive cards
- Shows `CapabilityMatrix`
- Shows three `<Link>` cards with device name, icon, and "exclusive" feature badges
  (e.g. OneKey card shows "EIP-712 ✅  CIP-23 ✅")

## Capabilities

### Modified Capabilities
- `hardware-wallet-section`: split across 3 sub-routes; overview remains at `/keys`

## Impact

- `app/keys/page.tsx` — becomes the overview; remove `HardwareWalletSection`, add device link cards
- `app/keys/hardware-wallet-section.tsx` — deleted (logic moved to sub-routes)
- `app/keys/memory/page.tsx` — new; wraps `MemoryPanel`
- `app/keys/ledger/page.tsx` — new; wraps `LedgerPanel`
- `app/keys/onekey/page.tsx` — new; wraps `OneKeyPanel` and `OneKeyReferralCard`
- `app/keys/device-link-card.tsx` — new small component for overview
