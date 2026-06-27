## ADDED Requirements

### Requirement: Signer session files SHALL use kebab-case naming convention
The system SHALL enforce kebab-case naming conventions for all TypeScript files within the `signer-session/src` directory. Specifically, files matching the `onekey*.ts` pattern MUST be renamed to `onekey-diagnostics.ts` and `onekey-session.ts` to resolve kebab-groups warnings and maintain consistent module grouping.

#### Scenario: Rename onekey diagnostics file
- **WHEN** the repository structure is scanned for the `signer-session/src` directory
- **THEN** the diagnostics file MUST be named `onekey-diagnostics.ts` and grouped correctly under the kebab-case convention.

#### Scenario: Rename onekey session file
- **WHEN** the repository structure is scanned for the `signer-session/src` directory
- **THEN** the session file MUST be named `onekey-session.ts` and grouped correctly under the kebab-case convention.

#### Scenario: Validate kebab-groups check passes
- **WHEN** the command `pnpm run cdk -- repo check kebab-groups` is executed against the repository
- **THEN** the validation MUST report zero warnings for the `cfx-keys/packages/signer-session/src` group and confirm all files adhere to the kebab-case naming standard.
