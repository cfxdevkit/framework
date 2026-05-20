# Changelog

## [2.0.0] - 2026-05-20

First tagged release of the cfxdevkit framework monorepo.

### Framework packages (Tier 0 — published to npm)

- `@cfxdevkit/core` — addresses, RPC client, chain registry, units, error types
- `@cfxdevkit/protocol` — low-level encoding/decoding for Core Space and eSpace
- `@cfxdevkit/executor` — transaction execution pipeline
- `@cfxdevkit/devnode` — `child_process` wrapper for the Conflux Go node binary
- `@cfxdevkit/testing` — shared test fixtures and helpers
- `@cfxdevkit/wallet` — HD wallet derivation (Core + eSpace), session keys, hardware (Ledger)
- `@cfxdevkit/services` — pluggable keystore backends (file, memory, Ledger) and SIWE auth
- `@cfxdevkit/ui` — headless UI component library for Conflux applications
- `@cfxdevkit/react` — React context providers and hooks
- `@cfxdevkit/theme` — CSS custom-property design tokens
- `@cfxdevkit/wallet-connect` — wagmi-based browser wallet connector with SIWE support
- `@cfxdevkit/defi-react` — DeFi-specific React helpers
- `@cfxdevkit/contracts` — on-chain contract bindings (ERC-20/721/1155, multicall3, bridge)
- `@cfxdevkit/compiler` — Hardhat-based Solidity compilation wrapper

### Developer platform (Tier 1)

- `@cfxdevkit/client` — typed HTTP client for the devnode-server control plane
- `@cfxdevkit/devnode-server` — Express HTTP server that manages a devnode instance
- `@cfxdevkit/mcp-server` — MCP server exposing chain, keystore, compiler, and scaffold tools
- `@cfxdevkit/cli` — developer CLI (`cfxdevkit` command)
- `cfxdevkit-vscode-extension` — VS Code extension for local Conflux development
- `@cfxdevkit/create` — project scaffolding CLI (`create-cfxdevkit-app`)
- `@cfxdevkit/llm-client` — LLM provider abstraction (OpenAI, Anthropic, Ollama)
- `@cfxdevkit/llm-agents` — automated agents for codebase analysis and commit generation
- `@cfxdevkit/llm-tools` — agent CLI tooling
- `@cfxdevkit/arch-check` — architecture validation (tier rules, file-size limits, import hygiene)

### Domain packages (Tier 2)

- `@cfxdevkit/automation` — DeFi automation engine (SQLite persistence, keeper worker, strategy types)
- `@cfxdevkit/game-engine` — ECS-based game engine for Conflux-enabled games

### Applications

- **showcase-local** — self-contained local development environment: embedded devnode, keystore server, compiler, deploy tooling, accounts panel, reveal flow
- **showcase-public** — fully browser-side SDK demos: hardware wallet (Ledger), HD wallet derivation, browser wallet, Conflux RPC reads (blocks, transactions, receipts, cross-space), SIWE, DeFi
- **CAS (Conflux Automation Site)** — DeFi automation platform with SIWE auth, job management (Swap/Limit/DCA/TWAP), keeper engine, safety config, approval workflow, WCFX wrap helper

### Housekeeping

- Retired five legacy showcase applications (`showcase`, `showcase-browser`, `showcase-stack`, `showcase-gateway`, `showcase-backend`) — all unique capabilities ported to `showcase-local` and `showcase-public`
- Removed `@cfxdevkit/hardware-bridge` stub package (hardware wallet support consolidated into `@cfxdevkit/wallet`)
- Shared backend tooling alignment: MCP server and VS Code extension now use `@cfxdevkit/client` against `@cfxdevkit/devnode-server` as the canonical control plane
