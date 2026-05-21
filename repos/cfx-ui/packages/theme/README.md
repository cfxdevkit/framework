# @cfxdevkit/theme

**Scope:** Shared design tokens (colors, spacing, typography, shadows, motion) usable from any UI library.

No React, no CSS-in-JS dependency. Outputs JSON + CSS variables + (optional) Tailwind preset.

## Install

```bash
npm install @cfxdevkit/theme
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 13 symbols |
| `./tokens` | 6 symbols |
| `./react` | 6 symbols |
| `./css` | 0 symbols |
| `./dark` | 0 symbols |

---

## `.`

Exports the full theme API, including tokens and React integration.

```ts
import { colors, spacing, radius, typography, shadow, motion, ThemeProvider, useTheme } from '@cfxdevkit/theme';
```

- `colors`, `spacing`, `radius`, `typography`, `shadow`, `motion`: Raw design token objects.
- `ThemeProvider`, `useTheme`: React context provider and hook for theme switching.

### Example

```tsx
import { ThemeProvider, useTheme } from '@cfxdevkit/theme';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <Main />
    </ThemeProvider>
  );
}

function Main() {
  const { theme, resolvedTheme } = useTheme();
  // `theme`: user preference ('light' | 'dark' | 'system')
  // `resolvedTheme`: effective theme ('light' | 'dark')
  return <div style={{ color: colors.text.primary }}>Hello</div>;
}
```

---

## `./tokens`

Exports only the raw design tokens (no React dependencies).

```ts
import { colors, spacing, radius, typography, shadow, motion } from '@cfxdevkit/theme/tokens';
```

Useful for non-React environments (e.g., vanilla JS, Storybook, Figma plugins).

### Example

```ts
import { colors, spacing } from '@cfxdevkit/theme/tokens';

const buttonStyle = {
  backgroundColor: colors.primary.default,
  padding: spacing.md,
  borderRadius: radius.md,
};
```

---

## `./react`

Exports only the React integration (context provider + hook).

```ts
import { ThemeProvider, useTheme } from '@cfxdevkit/theme/react';
```

Requires `@cfxdevkit/theme` to be installed separately for token access.

### Example

```tsx
import { ThemeProvider } from '@cfxdevkit/theme/react';
import { colors } from '@cfxdevkit/theme/tokens';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="cfx-theme">
      <div style={{ color: colors.text.primary }}>Theme-aware content</div>
    </ThemeProvider>
  );
}
```

---

## `./css`

No named exports. Used internally to generate CSS variable files.

---

## `./dark`

No named exports. Used internally for dark-mode token variants.

<!-- api-hash: ba95a10df911d17e6a3f41fa73d6390375968421514deffab697e3cc2b3c74c3 -->

<!-- readme-hash: f321ad06e9d103e1d333e8a1dcac8ec65c94d4d553947f53e94cbf7bdfc36c3a -->
