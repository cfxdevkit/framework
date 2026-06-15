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

// Core color design tokens (e.g., semantic, functional, and base colors).
export declare const colors: {
  // Color definitions (e.g., primary, secondary, background, text, etc.)
};

// Core spacing design tokens (e.g., scale, layout, and component spacing).
export declare const spacing: {
  // Spacing values (e.g., 0, 1, 2, ..., 'auto')
};

// Core border radius design tokens (e.g., rounded, pill, circle).
export declare const radius: {
  // Radius values (e.g., sm, md, lg, full)
};

// Core typography design tokens (e.g., font families, sizes, weights, line heights).
export declare const typography: {
  // Typography definitions (e.g., fontFamilies, fontSizes, fontWeights, lineHeights)
};

// Core shadow design tokens (e.g., depth, elevation, ambient).
export declare const shadow: {
  // Shadow definitions (e.g., xs, sm, md, lg, xl)
};

// Core motion design tokens (e.g., durations, easing curves, delays).
export declare const motion: {
  // Motion definitions (e.g., durations, easings)
};

// Theme mode type: 'light', 'dark', or 'system' (auto-detect).
export type Theme = 'light' | 'dark' | 'system';

// Resolved theme mode type: only 'light' or 'dark' (after system resolution).
export type ResolvedTheme = 'light' | 'dark';

// Context value interface for theme state and helpers.
export interface ThemeContextValue {
  theme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
}

// Props accepted by the ThemeProvider component.
export interface ThemeProviderProps {
  defaultTheme?: Theme;
  storageKey?: string;
  children: React.ReactNode;
}

// React component that provides theme context and persists user preference.
export declare function ThemeProvider({ defaultTheme, storageKey, children, }: ThemeProviderProps): import("react").JSX.Element;

// Hook to access theme context (theme, setTheme, toggleTheme).
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
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Toggle Theme ({theme})</button>;
}
```

---

## `./tokens`

```ts
// Re-export of core design token collections (colors, spacing, radius, typography, shadow, motion).
export declare const colors: {
  // Color definitions (e.g., primary, secondary, background, text, etc.)
};

// Re-export of spacing tokens.
export declare const spacing: {
  // Spacing values (e.g., 0, 1, 2, ..., 'auto')
};

// Re-export of border radius tokens.
export declare const radius: {
  // Radius values (e.g., sm, md, lg, full)
};

// Re-export of typography tokens.
export declare const typography: {
  // Typography definitions (e.g., fontFamilies, fontSizes, fontWeights, lineHeights)
};

// Re-export of shadow tokens.
export declare const shadow: {
  // Shadow definitions (e.g., xs, sm, md, lg, xl)
};

// Re-export of motion tokens.
export declare const motion: {
  // Motion definitions (e.g., durations, easings)
};
```

### Usage

```ts
import { spacing, radius, colors } from '@cfxdevkit/theme/tokens';

const styles = {
  padding: spacing[3], // e.g., '8px'
  borderRadius: radius.md, // e.g., '4px'
  backgroundColor: colors.background.default,
};
```

---

## `./react`

```ts
// Theme mode type: 'light', 'dark', or 'system' (auto-detect).
export type Theme = 'light' | 'dark' | 'system';

// Resolved theme mode type: only 'light' or 'dark' (after system resolution).
export type ResolvedTheme = 'light' | 'dark';

// Context value interface for theme state and helpers.
export interface ThemeContextValue {
  theme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
}

// Props accepted by the ThemeProvider component.
export interface ThemeProviderProps {
  defaultTheme?: Theme;
  storageKey?: string;
  children: React.ReactNode;
}

// React component that provides theme context and persists user preference.
export declare function ThemeProvider({ defaultTheme, storageKey, children, }: ThemeProviderProps): import("react").JSX.Element;

// Hook to access theme context (theme, setTheme, toggleTheme).
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
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Toggle Theme ({theme})</button>;
}
```

---

## `./css`

*(no named exports detected)*

---

## `./dark`

*(no named exports detected)*

<!-- api-hash: 00971b2e35739809182d9926918c14de5fe95d5765dd0c1c579364e84d4c30eb -->
