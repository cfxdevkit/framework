## ADDED Requirements

### Requirement: JobsTable displays token symbols instead of raw addresses
The `JobsTable` component SHALL resolve token addresses to human-readable symbols and logos using the pools context cache, and fall back to abbreviated hex addresses only when metadata is unavailable.

#### Scenario: Symbol resolved from pools cache
- **WHEN** a job's `tokenIn` or `tokenOut` address exists in the pools context token list
- **THEN** `JobsTable` SHALL display the token symbol (e.g., "CFX") and logo instead of the raw address

#### Scenario: Fallback to abbreviated address
- **WHEN** a job's token address is not found in the pools context
- **THEN** `JobsTable` SHALL display `0x1234…abcd` (first 6 + last 4 chars) as fallback

#### Scenario: Token logo displayed
- **WHEN** the pools context entry for a token includes a `logoURI`
- **THEN** a small circular logo image SHALL appear next to the symbol in the job row

#### Scenario: Logo load error handled gracefully
- **WHEN** a token logo image URL fails to load (HTTP error or CORS)
- **THEN** the image SHALL be hidden and the symbol SHALL remain visible without a broken image indicator
