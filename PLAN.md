# Implementation Plan: Tier 0 & Tier 1 Complete

**Version:** 1.0  
**Date:** 2025-04-11  
**Scope:** Complete implementation of Framework (Tier 0) and Platform (Tier 1) packages

---

## Current State Assessment

### ✅ Fully Implemented
- `@cfxdevkit/core` - Core primitives, client, wallet, address handling
- `@cfxdevkit/contracts` - Contract wrappers, ABI management
- `@cfxdevkit/compiler` - Solidity compilation pipeline
- `@cfxdevkit/cli` - Developer CLI (status, derive, generate)
- `@cfxdevkit/vscode-extension` - Full VS Code extension

### ⚠️ Stub Packages (Need Implementation)
- `@cfxdevkit/react`, `@cfxdevkit/defi-react`, `@cfxdevkit/theme`, `@cfxdevkit/wallet-connect`
- `@cfxdevkit/executor`, `@cfxdevkit/protocol`, `@cfxdevkit/testing`
- `@cfxdevkit/mcp-server`, `@cfxdevkit/create`
- `@cfxdevkit/wallet`, `@cfxdevkit/services` (barrel stubs with implementation in submodules)

---

## Phase 1: Core Framework Completeness (Weeks 1-4)

### Priority 1A: Critical Supporting Packages
**Goal:** Enable Tier 0 packages to be published with full functionality

| Package | Status | Implementation Scope | Dependencies |
|---------|--------|---------------------|--------------|
| `@cfxdevkit/executor` | Stub | Implement execution engine for smart contract calls, transaction batches, and state transitions | `@cfxdevkit/core` |
| `@cfxdevkit/protocol` | Stub | Implement protocol-level primitives: gas estimation, block processing, event filtering | `@cfxdevkit/core` |
| `@cfxdevkit/testing` | Stub | Create test fixtures, mock clients, assertion helpers for dev workflows | `@cfxdevkit/core`, `@cfxdevkit/protocol` |

**Deliverables:**
- All packages have `./src/index.ts` with barrel exports
- Full API documentation in `./API.md` files
- Test coverage: 80%+ for all new code
- CI pipelines enabled and passing

---

### Priority 1B: Keys Package Unification
**Goal:** Consolidate split wallet/services packages into coherent API

| Package | Status | Implementation Scope |
|---------|--------|---------------------|
| `@cfxdevkit/wallet` | Stub barrel | Expose unified wallet API combining submodules: `init`, `signers`, `session-key`, `policies`, `hardware` |
| `@cfxdevkit/services` | Stub barrel | Re-export keystore implementations: `file`, `memory`, `ledger` with consistent error types |

**Deliverables:**
- Clean public API surface in `index.ts`
- Migration guide for consumers of split packages
- Updated READMEs with usage examples

---

### Priority 1C: Solidity Tooling Gap
**Goal:** Complete contract codegen pipeline

| Package | Status | Implementation Scope |
|---------|--------|---------------------|
| `@cfxdevkit/codegen-contracts` | Stub | Implement ABI/bytecode extraction from Hardhat artifacts, TypeScript module rendering |

**Deliverables:**
- CLI for contract extraction: `cfx contracts extract`
- Programmatic API for build integrations
- Test suite with sample contracts

---

## Phase 2: React/Theme Ecosystem (Weeks 5-8)

### Priority 2A: React Package Foundation
**Goal:** Build reusable React components for DeFi applications

| Package | Implementation Scope |
|---------|---------------------|
| `@cfxdevkit/react` | - Core hooks: `useClient`, `useWallet`, `useContract`<br>- Form components: `ContractForm`, `AddressInput`<br>- Display components: `BalanceDisplay`, `TxStatus`<br>- Provider components: `ClientProvider`, `WalletProvider` |
| `@cfxdevkit/defi-react` | - DeFi-specific hooks: `usePool`, `useReward`, `usePosition`<br>- Components: `LiquidityPoolCard`, `StakingDashboard`, `YieldAggregator` |

**Technical Requirements:**
- TypeScript-first with strict mode
- React 18+ concurrent features
- Vite + Vitest for development/testing
- Storybook for component documentation

**Deliverables:**
- Complete API surface documented in `./API.md`
- 10+ storybook examples
- E2E tests with Playwright

---

### Priority 2B: Theme System
**Goal:** Unified theming for all UI packages

| Component | Implementation Scope |
|-----------|---------------------|
| `@cfxdevkit/theme` | - Design token system (colors, spacing, typography)<br>- React context provider<br>- Dark/light mode support<br>- Token export to CSS custom properties |

**Deliverables:**
- Theme documentation with token reference
- Migration utilities from existing themes
- Example apps demonstrating theme usage

---

### Priority 2C: Wallet Connect Integration
**Goal:** Multi-wallet connection support

| Package | Implementation Scope |
|---------|---------------------|
| `@cfxdevkit/wallet-connect` | - WC2 protocol implementation<br>- Wallet detection and pairing<br>- Session management<br>- Transaction signing workflow |

**Deliverables:**
- WC2-compliant connection flow
- Support for MetaMask, Phalcon, hardware wallets
- Comprehensive error handling and user feedback

---

## Phase 3: Platform Tooling Enhancement (Weeks 9-11)

### Priority 3A: MCP Server
**Goal:** MCP (Model Context Protocol) server for AI tools

| Scope | Implementation Details |
|-------|----------------------|
| MCP Server | - Tool definitions: `chain_info`, `wallet_balance`, `contract_read`, `contract_write`<br>- Authentication and permission system<br>- Error handling and logging |

**Deliverables:**
- Complete tool schema definitions
- Documentation for tool integrators
- Test suite simulating LLM tool calls

---

### Priority 3B: Scaffold CLI Enhancement
**Goal:** Project scaffolding for rapid development

| Scope | Implementation Details |
|-------|----------------------|
| Scaffold CLI | - Template system for app types (simple contract, DeFi app, game)<br>- Package dependency injection<br>- Git repo initialization with CI setup |

**Deliverables:**
- 5+ templates covering common use cases
- Template customization options
- Template authoring guide

---

## Phase 4: Integration & Documentation (Week 12)

### Priority 4A: End-to-End Examples
**Goal:** Complete working applications demonstrating all Tier 0/1 packages

| Example | Description |
|---------|-------------|
| Simple DApp | Counter contract with React UI |
| DeFi Dashboard | Pool visualization with real-time data |
| CLI Tool | NFT minting CLI with wallet integration |

---

### Priority 4B: Documentation Completeness
**Goal:** All packages have comprehensive documentation

| Documentation Type | Requirements |
|-------------------|-------------|
| API Reference | Auto-generated from type signatures |
| Tutorials | Step-by-step guides for common tasks |
| Architecture | Design decisions documented in ADRs |
| Migration Guides | Clear paths from stub to implementation |

---

## Risk Mitigation

### Testing Strategy
- **Unit Tests:** Vitest for all packages (target: 85% coverage)
- **Integration Tests:** Playwright for cross-package workflows
- **Snapshot Tests:** For UI component consistency

### Breaking Change Management
- Semver major releases only for breaking changes
- Deprecation warnings in minor versions
- Migration guides for major versions

### CI/CD Pipeline
- **Commit Checks:** Biome linting, TypeScript type-checking
- **Test Stage:** All tests pass on PR
- **Build Stage:** Package compilation and distribution
- **Publish Stage:** Changesets-based releases

---

## Success Criteria

### Completion Milestones
- [ ] All Tier 0 packages have functional implementations (not stubs)
- [ ] All Tier 1 packages have full CLI/MCP/tooling functionality
- [ ] Test coverage ≥ 80% for all new implementations
- [ ] Documentation complete for all public APIs
- [ ] CI/CD pipelines passing for all packages

### Quality Gates
- [ ] No `stub`/`TODO`/`placeholder` comments in implementation files
- [ ] All public APIs documented in `API.md` files
- [ ] Example applications running successfully
- [ ] Security audit passed for key packages

---

## Post-Implementation Roadmap

### Tier 2 (Domains) - Future Phases
- `@cfxdevkit/automation` - Workflow automation engine
- `@cfxdevkit/game-engine` - Blockchain game development
- `@cfxdevkit/hardware-bridge` - Hardware wallet integration

### Tier 3 (Projects) - Application Focus
- Production applications leveraging Tier 0/1 packages
- Project-specific domain packages extracted from usage

---

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Weeks 1-4 | Core framework completeness |
| Phase 2 | Weeks 5-8 | React/Theme ecosystem |
| Phase 3 | Weeks 9-11 | Platform tooling enhancement |
| Phase 4 | Week 12 | Integration & documentation |

**Total Estimated Time:** 12 weeks (3 months)

---

## Notes

- This plan assumes dedicated development resources
- Phases can be partially overlapping with appropriate prioritization
- Priority order can be adjusted based on business requirements
- Regular stakeholder reviews recommended every 2 weeks