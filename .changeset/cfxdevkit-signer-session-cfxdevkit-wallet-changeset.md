---
"@cfxdevkit/signer-session": minor
"@cfxdevkit/wallet": patch
---

Add optional `includeCore` parameter to skip Core signer initialization and improve device connection reliability by serializing address probes.
Add retry logic for OneKey device operations to handle transient 'device interrupted' and 'device not acquired' errors.
