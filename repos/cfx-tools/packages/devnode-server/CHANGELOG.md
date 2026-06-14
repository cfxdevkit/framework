# @cfxdevkit/devnode-server

## 3.0.0

### Major Changes

- f0cb9a2: Removed Swappi V2 Factory and Pair ABI exports.
  Removed contract action routes for register, read, and write operations.
  Removed keystore-related React hooks including useKeystoreAccounts, useKeystoreIdentity, useKeystoreLifecycle, and useKeystoreMutations.
  Removed Ledger Core APDU integration and framing utilities.

### Patch Changes

- c03977e: Reorganized Swappi ABI source files into subdirectories.
  Refactored internal contract route file structure.
  Reorganized keystore hooks and components into subdirectories.
  Refactored internal ledger service file structure.
- Updated dependencies [f0cb9a2]
- Updated dependencies [c03977e]
  - @cfxdevkit/services@3.0.0
  - @cfxdevkit/contracts@2.0.1
  - @cfxdevkit/wallet@2.0.1
  - @cfxdevkit/keystore-server@2.0.1
