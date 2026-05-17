# projects/electro — ESP32 + Conflux

**Apps**
- `apps/firmware/` — PlatformIO/Arduino C++ firmware (dual-core ESP32)
- `apps/backend/` — Express backend + dashboard, bridges device WS to chain

**Other**
- `hardware/` — Schematics, BOM, wiring guide (origin: `Electro/hardware/`)
- `packages/blockchain-client/` — Thin project wrapper around `@cfxdevkit/core` for ESP32-relevant flows

**Framework / domain usage**
- `@cfxdevkit/core` (already consumed today)
- Device WS protocol, sensor types, and pin diagram codegen stay project-local until a reusable domain package is justified

**Migration notes**
- Already follows the target pattern (thin wrapper over framework). Lowest-effort migration.
