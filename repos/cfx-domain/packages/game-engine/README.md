# domains/game-engine

**Scope:** Engine-agnostic, on-chain game primitives.

**Responsibilities**
- Game state machine abstractions
- Turn / round / action dispatch
- Inventory & character interfaces
- Bridge between chain events and a Zustand-style local store
- Adapter interfaces for renderer (React, Phaser, …)

**Non-goals**
- Specific game rules (those stay in `projects/<game>`).
- UI/rendering.

**Origin:** `chainbrawler/packages/core` — extract the truly engine-shaped pieces, leave RPG-specific rules in the project.
