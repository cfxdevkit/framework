---
"@cfxdevkit/abis": minor
"@cfxdevkit/compiler": minor
"@cfxdevkit/core": minor
"@cfxdevkit/llm-tools": patch
"@cfxdevkit/protocol": minor
"@cfxdevkit/services": minor
"@cfxdevkit/testing": patch
"@cfxdevkit/wallet": minor
---

Added extended ERC ABIs (ERC-2612, ERC-4626, ERC-165, ERC-721 enumerable/royalty), camel-case aliases, and comprehensive tests.
Added basic ERC-721 template and exported it alongside existing templates.
Exported common EVM constants (MAX_UINT128, MAX_UINT256, ZERO_ADDRESS) for use in approvals and address comparisons.
Improved generated file detection to include specific filenames and .generated.ts/.generated.js suffixes.
Added Conflux precompile addresses/ABIs, WCFX metadata, and DevKit reusable contract ABIs and bytecode.
Exposed embedded-wallet module entry point.
Documented planned mock inventory and Vitest matchers for backend test doubles.
Added batcher module entry point and dependency on @cfxdevkit/executor.
