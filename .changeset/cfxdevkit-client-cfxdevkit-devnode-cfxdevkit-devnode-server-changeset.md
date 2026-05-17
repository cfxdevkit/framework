---
"@cfxdevkit/client": minor
"@cfxdevkit/devnode": minor
"@cfxdevkit/devnode-server": minor
---

Updated wallet account structure to use accountType instead of derivationBase, and introduced separate espaceAddress and coreAddress fields.
Enhanced account derivation to support distinct eSpace and Core addresses using BIP-44 coin types 60 and 503 respectively.
Modified keystore API to support accountType and separate espaceAddress/coreAddress fields for wallet accounts.
