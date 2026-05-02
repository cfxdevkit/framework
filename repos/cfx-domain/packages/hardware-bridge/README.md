# domains/hardware-bridge

**Scope:** Reusable bridge between physical hardware and chain/backend.

**Sub-packages**
- `ws-protocol/` — WebSocket message schemas device ↔ backend
- `sensor-types/` — typed sensor descriptors and value encoders
- `hardware-diagram/` — JSON pin-mapping + codegen for firmware headers

**Origin:** `Electro/packages/{ws-protocol,sensor-types,hardware-diagram}`.

**Non-goals**
- Specific firmware (stays in `projects/electro/apps/firmware/`).
- Project-specific dashboards.
