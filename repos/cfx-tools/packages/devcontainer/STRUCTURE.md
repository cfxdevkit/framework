# platform/devcontainer — Detailed Structure

```
devcontainer/
├── README.md
├── devcontainer.json               VS Code Dev Containers spec
├── docker-compose.yml              optional multi-service compose (node + db)
├── Dockerfile                      base image (Node 20, pnpm, moon, foundry, solc, gh, age, sops)
├── post-create.sh                  runs once per container (pnpm install, moon setup)
├── post-start.sh                   runs each container start (env checks)
├── features/                       Dev Container Features (composable)
│   ├── conflux-toolchain/          installs xcfx-node, hardhat helpers
│   │   ├── devcontainer-feature.json
│   │   └── install.sh
│   ├── cfx-keystore/               installs the file-keystore CLI + age + sops
│   │   ├── devcontainer-feature.json
│   │   └── install.sh
│   └── platformio/                 ESP32 firmware toolchain (opt-in)
│       ├── devcontainer-feature.json
│       └── install.sh
├── env/
│   ├── .env.example                documented variables
│   └── README.md
└── docs/
    ├── keystore.md                 how host-keyring forwarding works on Linux/macOS
    └── troubleshooting.md
```

### Goals

- `git clone && open in container` works with no host setup beyond Docker + VS Code.
- No key material in the image. Keystore is mounted/created at first run.
- Image rebuild is fast: deps in a separate layer, framework prebuilt in a published layer.
