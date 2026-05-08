# `@cfxdevkit/automation` — API Reference

> Pure automation logic for CAS-style strategies. The package contains no UI and no app-level HTTP server.

## Public Exports

```ts
const __packageName: '@cfxdevkit/automation'

// Strategy input types for UI/app layers
type LimitOrderStrategy
type DCAStrategy
type TWAPStrategy
type SwapStrategy
type Strategy

// Runtime jobs and repositories
type Job
type JobStatus
type JobType
interface JobRepository
class MemoryJobRepository

// Keeper and execution
class Keeper
interface KeeperClient
interface ExecutionRepository
class RetryQueue

// Safety
interface SafetyConfig
const DEFAULT_SAFETY_CONFIG: SafetyConfig
class SafetyGuard
```

## Database Subpath

```ts
import { createSqliteDb, DrizzleJobRepository, DrizzleExecutionRepository } from '@cfxdevkit/automation/db';
```

The `@cfxdevkit/automation/db` subpath provides Drizzle-backed repositories and a SQLite bootstrap helper. Repository constructors accept a minimal Drizzle-like interface so project-level backends can wire PostgreSQL or MariaDB adapters later.

## Safety Config

```ts
type SafetyConfig = {
  maxSwapUsd: number
  maxSlippageBps: number
  maxRetries: number
  minExecutionIntervalSeconds: number
  globalPause: boolean
}

const DEFAULT_SAFETY_CONFIG = {
  maxSwapUsd: 10_000,
  maxSlippageBps: 500,
  maxRetries: 5,
  minExecutionIntervalSeconds: 30,
  globalPause: false,
}
```

App-level backends should store project-specific overrides and feed them into `new SafetyGuard(config)`.

## Internal Workspace Dependencies

```json
{
  "@cfxdevkit/core": "workspace:^",
  "@cfxdevkit/executor": "workspace:^",
  "@cfxdevkit/protocol": "workspace:^"
}
```

## Tier

Defined per [ARCHITECTURE.md](../../../../../ARCHITECTURE.md). Dependencies must respect the one-way rule: `projects → domains → platform → framework`.
