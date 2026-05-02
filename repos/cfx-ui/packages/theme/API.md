# @cfxdevkit/theme — Public API

> Design tokens + minimal CSS layer. **Tokens are data**, not components.
> Consumers (defi-react, wallet-connect/ui, project apps) opt in by importing one
> CSS file and reading tokens via CSS custom properties.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/theme/tokens` | design tokens (colours, spacing, typography) as JS consts |
| `@cfxdevkit/theme/css` | base CSS (resets, root variables) — `import '@cfxdevkit/theme/css'` |
| `@cfxdevkit/theme/dark` | dark theme variant CSS |
| `@cfxdevkit/theme/react` | `<ThemeProvider>` for SSR-safe theme switching |

---

## `theme/tokens`

```
const colors: {
  bg: { default: string; subtle: string; emphasis: string }
  fg: { default: string; subtle: string; muted: string; on-brand: string }
  brand: { primary: string; accent: string }
  feedback: { success: string; warning: string; danger: string; info: string }
  // … expanded set documented in source TSDoc
}

const spacing: { 0: string; 1: string; 2: string; 3: string; 4: string; 6: string; 8: string; 12: string; 16: string }
const radius: { sm: string; md: string; lg: string; pill: string }
const typography: { sans: string; mono: string; sizes: Record<string, string>; weights: Record<string, number> }
const shadow: { sm: string; md: string; lg: string }
const motion: { fastMs: number; baseMs: number; slowMs: number; ease: string }
```

Tokens are values. They map 1:1 to CSS custom properties under `:root`.

---

## `theme/css`

A single side-effect import:

```
import '@cfxdevkit/theme/css'
```

Defines `--cfx-color-bg-default`, etc. No global resets beyond box-sizing.

---

## `theme/dark`

```
import '@cfxdevkit/theme/dark'
```

Activates when `[data-theme="dark"]` is on `<html>`.

---

## `theme/react`

```
type Theme = 'light' | 'dark' | 'system'

const ThemeProvider: React.FC<{ defaultTheme?: Theme; storageKey?: string; children: React.ReactNode }>

function useTheme(): { theme: Theme; resolved: 'light' | 'dark'; set: (t: Theme) => void }
```

Reads/writes `[data-theme]` on `<html>`. SSR-safe. No flash of wrong theme.

---

## Anti-goals

- ❌ A component library. Components live in `defi-react` / `wallet-connect/ui`.
- ❌ CSS-in-JS runtime. Themes are static CSS variables.
- ❌ Styling utilities (no clsx, no twind). Apps choose.
