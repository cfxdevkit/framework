# `@cfxdevkit/theme` — Public API

> Design tokens and CSS layer.

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

```ts
// Package name identifier for runtime introspection.
export declare const __packageName: "@cfxdevkit/theme";

// Color design tokens (e.g., semantic, functional, and base colors).
export declare const colors: {
  // Color definitions (e.g., `primary`, `background`, `text`)
};

// Spacing design tokens (e.g., scale-based spacing values).
export declare const spacing: {
  // Spacing values (e.g., `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `12`, `16`, `20`, `24`, `32`)
};

// Border radius design tokens (e.g., `sm`, `md`, `lg`, `xl`, `full`).
export declare const radius: {
  // Radius values (e.g., `4px`, `8px`, `12px`, `9999px`)
};

// Typography design tokens (e.g., font families, sizes, weights, line heights).
export declare const typography: {
  // Typography definitions (e.g., `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`)
};

// Shadow design tokens (e.g., `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `inner`).
export declare const shadow: {
  // Shadow definitions (e.g., `0 1px 2px 0 rgb(0 0 0 / 0.05)`)
};

// Motion design tokens (e.g., duration, easing, delay).
export declare const motion: {
  // Motion definitions (e.g., `duration`, `easing`, `delay`)
};

// Theme variant type: `'light'`, `'dark'`, or `'system'` (auto-detected).
export type Theme = 'light' | 'dark' | 'system';

// Resolved theme type: `'light'` or `'dark'` (after system detection).
export type ResolvedTheme = 'light' | 'dark';

// Context value interface for theme state and helpers.
export interface ThemeContextValue {
  theme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  systemTheme: ResolvedTheme;
}

// Props accepted by `ThemeProvider`.
export interface ThemeProviderProps {
  defaultTheme?: Theme;
  storageKey?: string;
  children: React.ReactNode;
}

// React component that provides theme context to its descendants.
export declare function ThemeProvider({ defaultTheme, storageKey, children, }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;

// Hook to access theme context (theme state and setter).
export declare function useTheme(): ThemeContextValue;
```

### Usage

```tsx
import { ThemeProvider, useTheme } from '@cfxdevkit/theme';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <MainContent />
    </ThemeProvider>
  );
}

function MainContent() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Switch to Dark</button>
    </div>
  );
}
```

---

## `./tokens`

```ts
// Re-export of color design tokens (same as root `colors`).
export declare const colors: {
  // Color definitions (e.g., `primary`, `background`, `text`)
};

// Re-export of spacing design tokens (same as root `spacing`).
export declare const spacing: {
  // Spacing values (e.g., `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `12`, `16`, `20`, `24`, `32`)
};

// Re-export of border radius design tokens (same as root `radius`).
export declare const radius: {
  // Radius values (e.g., `4px`, `8px`, `12px`, `9999px`)
};

// Re-export of typography design tokens (same as root `typography`).
export declare const typography: {
  // Typography definitions (e.g., `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`)
};

// Re-export of shadow design tokens (same as root `shadow`).
export declare const shadow: {
  // Shadow definitions (e.g., `0 1px 2px 0 rgb(0 0 0 / 0.05)`)
};

// Re-export of motion design tokens (same as root `motion`).
export declare const motion: {
  // Motion definitions (e.g., `duration`, `easing`, `delay`)
};
```

### Usage

```ts
import { spacing, radius, colors } from '@cfxdevkit/theme/tokens';

const styles = {
  padding: spacing[4], // '1rem'
  borderRadius: radius.lg, // '12px'
  backgroundColor: colors.background,
};
```

---

## `./react`

```ts
// Theme variant type: `'light'`, `'dark'`, or `'system'` (auto-detected).
export type Theme = 'light' | 'dark' | 'system';

// Resolved theme type: `'light'` or `'dark'` (after system detection).
export type ResolvedTheme = 'light' | 'dark';

// Context value interface for theme state and helpers.
export interface ThemeContextValue {
  theme: ResolvedTheme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  systemTheme: ResolvedTheme;
}

// Props accepted by `ThemeProvider`.
export interface ThemeProviderProps {
  defaultTheme?: Theme;
  storageKey?: string;
  children: React.ReactNode;
}

// React component that provides theme context to its descendants.
export declare function ThemeProvider({ defaultTheme, storageKey, children, }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;

// Hook to access theme context (theme state and setter).
export declare function useTheme(): ThemeContextValue;
```

### Usage

```tsx
import { ThemeProvider, useTheme } from '@cfxdevkit/theme/react';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <MainContent />
    </ThemeProvider>
  );
}

function MainContent() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Switch to Dark</button>
    </div>
  );
}
```

---

## `./css`

*(no named exports detected)*

---

## `./dark`

*(no named exports detected)*

<!-- api-hash: ba95a10df911d17e6a3f41fa73d6390375968421514deffab697e3cc2b3c74c3 -->
