## ADDED Requirements

### Requirement: Format phase must produce valid JSON
The system SHALL ensure that all JSON output generated during the format phase conforms to the JSON specification (RFC 8259), including proper handling of numeric values and operators.

#### Scenario: Valid numeric value in JSON output
- **WHEN** the format phase generates a numeric value
- **THEN** the value is represented as a sequence of digits optionally preceded by a single minus sign, with no stray minus signs or malformed syntax

#### Scenario: JSON output passes downstream parser
- **WHEN** the format phase produces JSON output
- **THEN** the output can be successfully parsed by a standard JSON parser without syntax errors

#### Scenario: Format phase rejects malformed numeric tokens
- **WHEN** the format phase encounters a token that would produce invalid JSON (e.g., a minus sign not followed by a digit)
- **THEN** the phase either corrects the token or fails with a clear diagnostic indicating the malformed structure
