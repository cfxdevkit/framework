## ADDED Requirements

### Requirement: User can wrap native CFX to wCFX
The system SHALL provide a modal that allows the connected wallet to wrap a specified amount of native CFX into wCFX by calling the WCFX contract's `deposit()` function.

#### Scenario: Wrap CFX
- **WHEN** the user enters an amount and clicks "Wrap"
- **THEN** the system SHALL call `deposit()` on the WCFX contract with the entered amount as `value`, wait for confirmation, and show a success state

#### Scenario: Insufficient CFX balance
- **WHEN** the entered amount exceeds the user's native CFX balance
- **THEN** the "Wrap" button SHALL be disabled and an "Insufficient CFX balance" message SHALL be shown

#### Scenario: Wrap in progress
- **WHEN** a wrap transaction has been submitted and is waiting for confirmation
- **THEN** the modal SHALL show a pending state and the "Wrap" button SHALL be disabled

### Requirement: User can unwrap wCFX back to native CFX
The system SHALL allow the connected wallet to unwrap wCFX to native CFX by calling the WCFX contract's `withdraw(amount)` function.

#### Scenario: Unwrap wCFX
- **WHEN** the user enters an amount and clicks "Unwrap"
- **THEN** the system SHALL call `withdraw(amount)` on the WCFX contract, wait for confirmation, and show a success state

#### Scenario: Insufficient wCFX balance
- **WHEN** the entered amount exceeds the user's wCFX token balance
- **THEN** the "Unwrap" button SHALL be disabled and an "Insufficient wCFX balance" message SHALL be shown

### Requirement: WcfxWrapModal is controlled by parent
The modal SHALL accept `open: boolean` and `onClose: () => void` props and render as an overlay when `open` is true.

#### Scenario: Modal closes after successful wrap or unwrap
- **WHEN** a wrap or unwrap transaction confirms successfully
- **THEN** `onClose` SHALL be called to dismiss the modal

#### Scenario: Modal closed by user
- **WHEN** the user clicks the close button or backdrop
- **THEN** `onClose` SHALL be called
