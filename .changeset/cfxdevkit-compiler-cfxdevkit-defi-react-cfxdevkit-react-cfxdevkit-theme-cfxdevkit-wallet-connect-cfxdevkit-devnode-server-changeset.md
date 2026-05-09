---
"@cfxdevkit/compiler": minor
"@cfxdevkit/defi-react": minor
"@cfxdevkit/react": minor
"@cfxdevkit/theme": minor
"@cfxdevkit/wallet-connect": minor
"@cfxdevkit/devnode-server": patch
---

Added five new smart contract templates: Simple Escrow, Multi-Sig Wallet, Name Registry, and Ballot, alongside existing templates.
Exposed new submodules for swap, balance, token-picker, tx-status, and primitives; added viem and @tanstack/react-query as peer and dev dependencies.
Reorganized public API with granular exports for account, balance, context, contract, events, and tx; added viem and @tanstack/react-query as peer dependencies.
Reorganized public API with submodules for tokens and react; added CSS files as entry points for base and dark themes.
Added new hooks and utilities for Espace connectors and chain switching; removed wagmi and @tanstack/react-query as direct dependencies.
Internal formatting and build configuration cleanup with no functional changes.
