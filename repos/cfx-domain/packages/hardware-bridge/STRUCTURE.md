# domains/hardware-bridge — Detailed Structure

Three thin packages share a parent folder for cohesion. Each is its own npm package.

```
hardware-bridge/
├── README.md
│
├── ws-protocol/
│   ├── README.md
│   ├── package.json                @cfxdevkit/hw-ws-protocol
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── moon.yml
│   └── src/
│       ├── index.ts
│       ├── messages/               versioned message schemas
│       │   ├── index.ts
│       │   ├── v1/
│       │   │   ├── device-to-server.ts
│       │   │   ├── server-to-device.ts
│       │   │   └── shared.ts
│       │   └── version.ts
│       ├── codec/                  encode / decode (CBOR + JSON)
│       │   ├── index.ts
│       │   ├── cbor.ts
│       │   └── json.ts
│       ├── transport/
│       │   ├── index.ts
│       │   ├── ws.ts
│       │   └── reconnect.ts
│       └── auth/
│           ├── index.ts
│           ├── handshake.ts
│           └── session.ts
│
├── sensor-types/
│   ├── README.md
│   ├── package.json                @cfxdevkit/hw-sensor-types
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── moon.yml
│   └── src/
│       ├── index.ts
│       ├── catalog/                one file per sensor family
│       │   ├── index.ts
│       │   ├── temperature.ts
│       │   ├── humidity.ts
│       │   ├── motion.ts
│       │   └── digital-input.ts
│       ├── encoding/
│       │   ├── index.ts
│       │   └── value.ts            uniform value encoding (units, scale)
│       └── validate.ts
│
└── hardware-diagram/
    ├── README.md
    ├── package.json                @cfxdevkit/hw-diagram
    ├── tsconfig.json
    ├── vite.config.ts
    ├── moon.yml
    ├── bin/
    │   └── hw-diagram-gen          CLI: read JSON → emit Pins.h + JSON schema
    └── src/
        ├── index.ts
        ├── schema/
        │   ├── index.ts
        │   ├── pin.ts              Pin, PinRole, BoardSpec
        │   └── board.ts
        ├── parse/
        │   ├── index.ts
        │   └── load.ts             load + validate JSON descriptor
        ├── codegen/
        │   ├── index.ts
        │   ├── pins-h.ts           emit C++ header
        │   ├── ts-types.ts         emit TS types for backend
        │   └── markdown.ts         emit human-readable wiring doc
        └── boards/                 reusable board descriptors
            ├── esp32-devkitc.json
            └── esp32-s3.json
```

### Origin

Extracted from `Electro/packages/{ws-protocol,sensor-types,hardware-diagram}`.
ESP32-specific firmware stays in `projects/electro/apps/firmware/`.
Hardware-specific driver implementations stay in `projects/electro/apps/firmware/`.
