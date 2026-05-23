# @cfxdevkit/cdk-repo-check

High-level deterministic repository checks and policy-reporting package for `cdk repo` workflows.

This package currently wraps the existing `@cfxdevkit/arch-check` implementation so callers can start moving to the higher-level `cdk-repo-check` surface without changing the underlying check engine yet.

## Current Scope

- Re-exports the `@cfxdevkit/arch-check` public API.
- Acts as the seed package for the planned `cdk-repo-check` rename and boundary cleanup.
- Keeps current `arch-check` consumers working while the higher-level package identity is introduced incrementally.

## Next Steps

- Move deterministic repo-check runners into this package.
- Retarget `cdk repo` callers from `@cfxdevkit/arch-check` to `@cfxdevkit/cdk-repo-check`.
- Retire the lower-level package name once the migration is complete.