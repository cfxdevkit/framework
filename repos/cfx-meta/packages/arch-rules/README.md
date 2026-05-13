# @cfxdevkit/arch-rules

Typed access to the monorepo architecture rules stored in `repos/cfx-meta/arch-rules.yaml`.

## API

```ts
import { getLifecycle, getRulesFor, getTierFor } from '@cfxdevkit/arch-rules';
```

- `getTierFor(path)` resolves a workspace-relative path to its architectural tier.
- `getRulesFor(tierId)` returns rules that apply to a tier.
- `getLifecycle()` returns the rule lifecycle (`pre-release` or `release`).

This package is private and dependency-free at runtime.
