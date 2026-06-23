# @cfxdevkit/pi-extensions

Local npm package for Pi extension modules and skills.

## Purpose

Provides project-local Pi extensions that:

- Guard against working with uncommitted git changes
- Auto-stash checkpoint at turn boundaries
- Persist session state across restarts
- Add context-aware tool guidance to the system prompt

## Installation

After cloning the repository, Pi auto-discovers this package from `.pi/settings.json`:

```json
{
  "packages": ["./repos/cfx-tools/infra/pi-extensions"]
}
```

No manual install needed — extensions load automatically on session start.

## Extensions

| Module | Responsibility |
|--------|---------------|
| `00-session-state.ts` | Dirty repo guard, Git checkpoint, state persistence |
| `01-prompt-customizer.ts` | Context-aware tool guidance based on active tools |

## Adding New Extensions

1. Create `extensions/NN-name.ts` (numeric prefix for load order)
2. Export a default function `(pi: ExtensionAPI) => void`
3. Add import to `extensions/index.ts`

## Skills

Skills go in `skills/` directory with standard `SKILL.md` files.
