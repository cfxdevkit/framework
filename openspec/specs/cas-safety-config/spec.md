## ADDED Requirements

### Requirement: Admin can read safety configuration at runtime
The system SHALL expose a `GET /admin/safety` endpoint returning the current safety guard configuration: `maxSwapUsd`, `slippageBps`, `maxRetries`, and `globalPause`.

#### Scenario: Safety config is read
- **WHEN** an admin sends `GET /admin/safety`
- **THEN** the backend SHALL respond with `{ maxSwapUsd: number | null, slippageBps: number, maxRetries: number, globalPause: boolean }`

#### Scenario: Non-admin is rejected
- **WHEN** a non-admin authenticated user sends `GET /admin/safety`
- **THEN** the backend SHALL respond with `403`

### Requirement: Admin can update safety configuration at runtime
The system SHALL expose a `PATCH /admin/safety` endpoint that updates one or more safety config fields in the SQLite settings store. Updated values SHALL take effect on the next Keeper execution cycle.

#### Scenario: Partial patch applied
- **WHEN** an admin sends `PATCH /admin/safety` with `{ slippageBps: 50 }`
- **THEN** only `slippageBps` SHALL be updated; other fields remain unchanged

#### Scenario: maxSwapUsd null disables the cap
- **WHEN** an admin sets `maxSwapUsd: null`
- **THEN** the Keeper SHALL not apply a USD cap on swaps

#### Scenario: Invalid values rejected
- **WHEN** `slippageBps` is negative or greater than 10000
- **THEN** the backend SHALL respond with `400 { error: "slippageBps must be between 0 and 10000" }`

### Requirement: SqliteSettingsStore stores safety config fields
The `SqliteSettingsStore` SHALL provide typed getters and setters for `safetyMaxSwapUsd`, `safetySlippageBps`, and `safetyMaxRetries` persisted as individual key/value rows.

#### Scenario: Default values returned when keys absent
- **WHEN** no safety config keys exist in the database
- **THEN** `getMaxSwapUsd()` SHALL return `null`, `getSlippageBps()` SHALL return `0`, `getMaxRetries()` SHALL return `3`

### Requirement: Safety admin panel shows and edits config
The frontend safety page (`/safety`) SHALL display a form allowing admins to view and update the safety config fields, submitting changes via the `CasApiClient`.

#### Scenario: Form loads current config
- **WHEN** an admin opens the safety page
- **THEN** the form SHALL be pre-filled with the current values from `GET /admin/safety`

#### Scenario: Form submits partial patch
- **WHEN** the admin changes a field and clicks Save
- **THEN** the frontend SHALL call `PATCH /admin/safety` with only the changed fields and display the updated values
