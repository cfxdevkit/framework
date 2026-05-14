## ADDED Requirements

### Requirement: Wizard writes backend .env file
The system SHALL write `apps/backend/.env` from the collected wizard state, containing all required backend environment variables.

#### Scenario: File does not exist — write directly
- **WHEN** `apps/backend/.env` does not exist
- **THEN** the wizard SHALL write the file and display "✓ apps/backend/.env written"

#### Scenario: File exists — confirm overwrite
- **WHEN** `apps/backend/.env` already exists
- **THEN** the wizard SHALL prompt "apps/backend/.env already exists. Overwrite? [y/N]" and only write if the user confirms

#### Scenario: Force flag skips confirmation
- **WHEN** the wizard is run with `--force`
- **THEN** any existing `.env` files SHALL be overwritten without prompting

### Requirement: Wizard writes frontend .env.local file
The system SHALL write `apps/frontend/.env.local` from the collected wizard state, containing all required frontend environment variables.

#### Scenario: File does not exist — write directly
- **WHEN** `apps/frontend/.env.local` does not exist
- **THEN** the wizard SHALL write the file and display "✓ apps/frontend/.env.local written"

#### Scenario: File exists — confirm overwrite
- **WHEN** `apps/frontend/.env.local` already exists
- **THEN** the wizard SHALL prompt "apps/frontend/.env.local already exists. Overwrite? [y/N]" and only write if the user confirms

### Requirement: Generated env files match the example templates
The generated `.env` files SHALL include all variables documented in `.env.example` and `.env.local.example` respectively, with values derived from the wizard state.

#### Scenario: Testnet env values
- **WHEN** the user selected testnet
- **THEN** both generated files SHALL contain testnet contract addresses and `NEXT_PUBLIC_CAS_NETWORK=testnet`

#### Scenario: Mainnet env values
- **WHEN** the user selected mainnet
- **THEN** both generated files SHALL contain mainnet contract addresses and `NEXT_PUBLIC_CAS_NETWORK=mainnet`

#### Scenario: Keeper disabled in env
- **WHEN** keeper mode is disabled
- **THEN** the backend `.env` SHALL contain `KEEPER_ENABLED=false` and no `SIGNER_PRIVATE_KEY`

#### Scenario: Keeper enabled in env
- **WHEN** keeper mode is enabled
- **THEN** the backend `.env` SHALL contain `KEEPER_ENABLED=true` and `SIGNER_PRIVATE_KEY=<key>`
