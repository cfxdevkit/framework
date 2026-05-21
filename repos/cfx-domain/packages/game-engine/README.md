# @cfxdevkit/game-engine

**Scope:** Engine-agnostic, on-chain game primitives.

**Responsibilities**
- Game state machine abstractions (`GameEngine`, `GameState`, `Transition`)
- Turn / round / action dispatch (`dispatchAction`, `nextTurn`, `roundState`)
- Inventory & character interfaces (`Inventory`, `Character`, `Item`)
- Bridge between chain events and a Zustand-style local store (`createStoreAdapter`)
- Adapter interfaces for renderer (React, Phaser, …) (`RendererAdapter`, `RendererContext`)

**Non-goals**
- Specific game rules (those stay in `projects/<game>`).
- UI/rendering (only defines interfaces to integrate with them).

**Origin:** `chainbrawler/packages/core` — extract the truly engine-shaped pieces, leave RPG-specific rules in the project.

## Install

```bash
npm install @cfxdevkit/game-engine
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | `GameEngine`, `GameState`, `Transition`, `dispatchAction`, `nextTurn`, `roundState`, `Inventory`, `Character`, `Item`, `createStoreAdapter`, `RendererAdapter`, `RendererContext`, `__packageName` |

---

## `.`

### Core Engine Types

```ts
export interface GameState {
  currentRound: number;
  currentPlayerIndex: number;
  status: 'idle' | 'active' | 'paused' | 'finished';
}

export type Transition = (state: GameState) => GameState;

export interface GameEngine {
  getState(): GameState;
  applyTransition(transition: Transition): void;
  reset(): void;
}
```

### Action Dispatch

```ts
export function dispatchAction(action: unknown): void;
export function nextTurn(): void;
export function roundState(): GameState['status'];
```

### Inventory & Character

```ts
export interface Item {
  id: string;
  name: string;
  quantity: number;
}

export interface Inventory {
  items: Item[];
  addItem(item: Item): void;
  removeItem(itemId: string, quantity: number): void;
}

export interface Character {
  id: string;
  name: string;
  inventory: Inventory;
  stats: Record<string, number>;
}
```

### Store Bridge

```ts
export function createStoreAdapter(store: {
  subscribe: (listener: () => void) => () => void;
  getState: () => GameState;
  dispatch: (action: unknown) => void;
}): {
  subscribe: (listener: () => void) => () => void;
  getState: () => GameState;
  dispatch: (action: unknown) => void;
};
```

### Renderer Integration

```ts
export interface RendererAdapter {
  render(state: GameState): void;
}

export interface RendererContext {
  engine: GameEngine;
  adapter: RendererAdapter;
}
```

### Package Identifier

```ts
export declare const __packageName: "@cfxdevkit/game-engine";
```

<!-- api-hash: 5119ebb383421364720f996e4e91c953a356795c94f23bce8c18e7ba2e9faee6 -->

<!-- readme-hash: 25935059625d2a68564de4c525ca0ba903c3a9add7e8b1d77eb6c2dca017711a -->
