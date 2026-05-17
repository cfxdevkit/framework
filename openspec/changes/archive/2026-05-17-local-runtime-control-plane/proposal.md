# Proposal: local-runtime-control-plane

> Closure note (2026-05-17): Archive this change as materially landed/superseded. `@cfxdevkit/devnode-server` already exposes compiler, deploy, session-key, reveal, contract, node-profile, and extension-route surfaces, and `showcase-local` already embeds that runtime. Remaining VS Code/MCP convergence should be scoped as new targeted changes, not driven from this older umbrella change.

## Why

The backend surface is still the main architectural bottleneck.

`@cfxdevkit/devnode-server` and `@cfxdevkit/client` already define the right direction, but the command surface is still incomplete and consumers are still diverging:

- showcase-local still owns some backend logic in app-local routes
- the VS Code extension still manages important runtime state directly
- MCP still documents a direct-package model that conflicts with the reusable backend story and makes shared state harder to keep in sync

The project now needs more than a devnode helper. It needs one canonical, extensible local runtime control plane that owns backend logic for node, wallets, accounts, contracts, compiler, session keys, deploy/interact flows, and project-specific custom operations.

## What Changes

- Promote `@cfxdevkit/devnode-server` into the canonical reusable local backend for network, node, keystore, wallet roots, derived accounts, funding, reveal flows, contracts, compiler/templates, session keys, deploy/interact actions, and custom extension routes
- Extend `@cfxdevkit/client` so it mirrors the shared runtime command surface instead of only a partial subset
- Keep keystore persistence on the framework keystore stack and keep account selection/derivation logic in the backend
- Add explicit backend extensibility so projects can attach custom route groups and reuse shared services without forking the runtime implementation
- Align showcase-local, the VS Code extension, and MCP around one command model and one orchestrated backend state model even if some consumers use HTTP and others use a matching in-process adapter
- Provide standalone CLI/service entrypoints over the same services so tools do not need bespoke orchestration wrappers

## New Capabilities

- `local-runtime-control-plane`: canonical and extensible local backend contract for wallet, node, compiler, contract, and custom operations

## Dependencies

- Depends on: existing `@cfxdevkit/devnode`, `@cfxdevkit/devnode-server`, `@cfxdevkit/client`, `@cfxdevkit/services`, `@cfxdevkit/wallet`, `@cfxdevkit/compiler`, and `@cfxdevkit/contracts`
- Follow-on consumers: `examples-showcase-local`, `repos/cfx-tools/packages/vscode-extension`, and `repos/cfx-tools/packages/mcp-server`