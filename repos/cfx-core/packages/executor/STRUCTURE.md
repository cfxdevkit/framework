# framework/executor — Detailed Structure

Generic execution primitives. **No domain logic** (strategies live in
[domains/automation/](../../domains/automation/STRUCTURE.md)).

```
executor/
├── README.md
├── package.json                    @cfxdevkit/executor
├── tsconfig.json
├── vite.config.ts
├── moon.yml
└── src/
    ├── index.ts
    │
    ├── job/                        ── Job lifecycle ──
    │   ├── index.ts
    │   ├── types.ts                Job, JobResult, JobStatus
    │   ├── handler.ts              JobHandler interface
    │   └── context.ts              JobContext (signer, client, logger)
    │
    ├── queue/                      ── Pluggable queue backend ──
    │   ├── index.ts                Queue interface
    │   ├── memory.ts               in-memory (tests, single-node)
    │   ├── postgres.ts             pg-boss-style adapter
    │   └── redis.ts                BullMQ adapter
    │
    ├── scheduler/                  ── Time-based triggers ──
    │   ├── index.ts
    │   ├── cron.ts
    │   └── interval.ts
    │
    ├── policy/                     ── Execution policies ──
    │   ├── index.ts
    │   ├── retry.ts                exponential backoff with jitter
    │   ├── circuit-breaker.ts
    │   ├── rate-limit.ts
    │   └── idempotency.ts
    │
    ├── gas/                        ── Gas-aware submission ──
    │   ├── index.ts
    │   ├── estimate.ts
    │   ├── price-strategy.ts       fixed / oracle / replace-by-fee
    │   └── replace.ts              speed-up / cancel
    │
    ├── observability/              ── Metrics & tracing hooks ──
    │   ├── index.ts
    │   ├── metrics.ts              OpenTelemetry counters/histograms
    │   └── trace.ts
    │
    └── internal/
        └── clock.ts                injectable clock for tests
```

### Public exports map

```
".", "./job", "./queue", "./queue/memory", "./queue/postgres", "./queue/redis",
"./scheduler", "./policy", "./gas", "./observability"
```

### Dependencies

- Runtime: `framework/core`, `framework/wallet` (for signing), OpenTelemetry API.
- Queue backends are optional peer deps.
