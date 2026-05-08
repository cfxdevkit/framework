# @cfxdevkit/protocol

**Scope:** Pure Conflux protocol helpers, precompile ABIs, and reusable DevKit contract metadata.

This package is intentionally non-UI and has no RPC side effects. It gives backend services, MCP tools, CLIs, and tests a stable place to import:

- receipt/chain helpers built around `@cfxdevkit/core` clients,
- Conflux internal contract addresses and ABIs (`AdminControl`, `SponsorWhitelist`, `Staking`, `CrossSpaceCall`, `PoSRegister`),
- WCFX ABI/address constants for app-level wrap, unwrap, and approval flows,
- DevKit reusable contract ABIs, bytecode, and generated address maps (`AutomationManager`, `PermitHandler`, `SwappiPriceAdapter`).

`ParamsControl` is included in `CONFLUX_PRECOMPILE_ADDRESSES`; the legacy DevKit source did not ship a verified ABI for it.
