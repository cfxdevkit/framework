## Context

The repository currently flags a hard hotspot error in `repos/cfx-tools/packages/cli/src/commands/keystore.ts` (590 lines), exceeding the acceptable line-count threshold and impacting maintainability. Additionally, a kebab-groups warning is triggered by `onekey*.ts` files in `repos/cfx-keys/packages/signer-session/src`, violating the repository's strict naming conventions. These issues block CI validation and increase cognitive load during code reviews. This design outlines the architectural approach to modularize the keystore CLI module and enforce kebab-case naming, as specified in the change proposal and requirements. The refactor operates within the existing CLI and signer-session packages without introducing new dependencies or altering external APIs.

## Goals / Non-Goals

**Goals:**
- Reduce `keystore.ts` below the hard hotspot threshold by extracting sub-commands and shared utilities into a modular directory structure.
- Resolve the kebab-groups warning by renaming `onekey*.ts` files to strictly adhere to kebab-case conventions and updating all internal references.
- Maintain backward compatibility for CLI command registration and existing import paths where applicable.
- Ensure all CI checks (`hotspots`, `kebab-groups`) pass post-refactor.

**Non-Goals:**
- Refactoring soft hotspots or other large files outside the specified scope.
- Changing the functional behavior, flags, or output of existing keystore CLI commands.
- Modifying external dependencies, build tooling configurations,
