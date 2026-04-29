# framework/core

**Scope:** Foundation chain client. Everything else in `framework/` builds on this.

**Responsibilities**
- JSON-RPC clients for Conflux eSpace and Core Space (Viem-based)
- Typed contract read/write helpers
- HD wallet derivation
- Multicall batching
- Standard ABIs (ERC-20, ERC-721, etc.)
- Network/chain configuration

**Public API surface (Phase 2 to detail):**
`createClient`, `createWallet`, `readContract`, `writeContract`, `batch`, chain configs.

**MUST NOT** depend on: any other framework package.
