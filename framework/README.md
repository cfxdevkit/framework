# framework/ — moved

This tier has been carved into the `repos/` layout per
[ADR-0003](../docs/adr/0003-multi-repo-split.md).

| Old path | New path |
|----------|----------|
| `framework/core` | `repos/cfx-core/packages/core` |
| `framework/protocol` | `repos/cfx-core/packages/protocol` |
| `framework/contracts` | `repos/cfx-core/packages/contracts` |
| `framework/compiler` | `repos/cfx-core/packages/compiler` |
| `framework/executor` | `repos/cfx-core/packages/executor` |
| `framework/devnode` | `repos/cfx-core/packages/devnode` |
| `framework/testing` | `repos/cfx-core/packages/testing` |
| `framework/services` | `repos/cfx-keys/packages/services` |
| `framework/wallet` | `repos/cfx-keys/packages/wallet` |
| `framework/react` | `repos/cfx-ui/packages/react` |
| `framework/defi-react` | `repos/cfx-ui/packages/defi-react` |
| `framework/theme` | `repos/cfx-ui/packages/theme` |
| `framework/wallet-connect` | `repos/cfx-ui/packages/wallet-connect` |

This directory is kept only so historical links resolve. New code goes
into `repos/cfx-{core,keys,ui}/packages/`.
