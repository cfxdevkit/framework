---
"@cfxdevkit/compiler": minor
"@cfxdevkit/devnode": patch
"@cfxdevkit/services": minor
---

Added three new template contracts (Example Counter, Simple Storage, Payable Vault), made constructor arguments optional with defaults, and added EVM version metadata for broader compatibility.
Reduced default mining interval from 2000ms to 500ms and added concurrency protection to prevent overlapping auto-mine operations.
Added secure `readFileKeystoreMnemonic` function to retrieve encrypted mnemonics without exposing them in listings, improving keystore security and usability.
