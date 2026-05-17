# SIWE Release Decision

The `/siwe` route is release-ready for `v0.1.0` as a public showcase demo.

Current behavior is intentionally minimal and browser-demo oriented:

- `/api/auth/nonce` issues a random nonce and stores it in memory for five minutes.
- `/api/auth/verify` verifies the signed SIWE message against the stored nonce.
- Successful verification consumes the nonce so signatures cannot be replayed.
- The response returns a simple demo payload and does not persist a session or issue a production JWT.

This route should not move to `@cfxdevkit/services/auth` for the first release unless the showcase starts demonstrating reusable production auth infrastructure. The current implementation is enough to show the framework wallet-signing flow without adding backend state beyond the nonce map.