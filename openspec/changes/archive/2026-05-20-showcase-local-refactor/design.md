## Context

The local showcase is a Next.js app-router workspace that uses `ConfluxDevkitClient` to call an embedded `@cfxdevkit/devnode-server` control plane. The working design is already panel-oriented: runtime state and actions are assembled centrally and passed down to presentational panels. The cleanup work is about removing artifacts that imply a different architecture, not inventing a new one.

## Goals / Non-Goals

**Goals:**
- Make the shared workspace state and action flow the only supported panel pattern.
- Remove deprecated guide/tutorial metadata without breaking the live snippet content that panels still render.
- Trim unused helper exports while preserving the runtime helpers the current panels still consume.

**Non-Goals:**
- Rebuilding the local showcase shell or visual layout.
- Introducing a new tutorial or server-action abstraction.
- Expanding panel scope beyond the verified cleanup and registration checks.

## Decisions

- Keep `ShowcaseWorkspacePanelsProps` as the canonical contract for panel data and callbacks; new panels must join that pipeline rather than opening direct client loops.
- Split or trim `lib/showcase-guide.ts` so only live snippets remain on the active path.
- Trim `app/keystore/client.ts` surgically: preserve `fetchDevnodeAccounts()` and `revealSecret()`, remove unused wrappers.
- Remove unused exports and style helpers instead of retaining them as speculative extension points.

## Risks / Trade-offs

- [Cleanup accidentally removes a still-live helper] → Verify concrete call sites before deleting each export.
- [Architecture guidance stays implicit] → Capture the prop-driven panel pattern in spec text and tasks, not only in the plan.
- [A live panel is present but unregistered] → Verify `accounts` and `reveal` in the panel registry as part of the cleanup.
