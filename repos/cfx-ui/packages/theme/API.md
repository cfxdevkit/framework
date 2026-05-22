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

### Usage

```ts
import { ThemeProvider, useTheme, colors } from '@cfxdevkit/theme';
```

```ts
// The package name.
export declare const __packageName: "@cfxdevkit/theme";
// Color palette tokens.
export declare const colors: {
  // Primary color tokens.
  primary: string;
  // Secondary color tokens.
  secondary: string;
  // Background color tokens.
  background: string;
  // Text color tokens.
  text: string;
  // Border color tokens.
  border: string;
  // Error color tokens.
  error: string;
};
// Spacing and sizing tokens.
export declare const spacing: {
  // Spacing scale values (e.g., '0', '1', '2', ..., '8', '10', '12', '16').
  [key: string]: string;
};
// Border radius tokens.
export declare const radius: {
  // Radius scale values (e.g., 'none', 'sm', 'md', 'lg', 'full').
  [key: string]: string;
};
// Typography and text style tokens.
export declare const typography: {
  // Font families.
  fontFamily: string;
  // Font sizes.
  fontSize: { [key: string]: string };
  // Line heights.
  lineHeight: { [key: string]: string };
  // Font weights.
  fontWeight: { [key: string]: string };
};
// Box shadow tokens.
export declare const shadow: {
  // Shadow scale values (e.g., 'sm', 'md', 'lg', 'xl').
  [key: string]: string;
};
// Motion and animation tokens.
export declare const motion: {
  // Duration scale values (e.g., 'fast', 'normal', 'slow').
  duration: { [key: string]: string };
  // Easing functions.
  easing: { [key: string]: string };
};
// Supported theme modes.
export type Theme = 'light' | 'dark' | 'system';
// The resolved theme value.
export type ResolvedTheme = 'light' | 'dark';
// The context value for theme management.
export interface ThemeContextValue {
  // Current resolved theme.
  theme: ResolvedTheme;
  // Function to toggle between light and dark themes.
  toggleTheme: () => void;
}
// Props for the ThemeProvider.
export interface ThemeProviderProps {
  // Default theme to use before hydration or storage is available.
  defaultTheme?: Theme;
  // Key used to persist theme preference in storage.
  storageKey?: string;
  // Child components to wrap with theme context.
  children: React.ReactNode;
}
// React component to provide theme context.
export declare function ThemeProvider({ defaultTheme, storageKey, children, }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
// Hook to access the current theme.
export declare function useTheme(): ThemeContextValue;
```

---

## `./tokens`

### Usage

```ts
import { colors, spacing } from '@cfxdevkit/theme/tokens';
```

```ts
// Color palette tokens.
export declare const colors: {
  // Primary color tokens.
  primary: string;
  // Secondary color tokens.
  secondary: string;
  // Background color tokens.
  background: string;
  // Text color tokens.
  text: string;
  // Border color tokens.
  border: string;
  // Error color tokens.
  error: string;
};
// Spacing and sizing tokens.
export declare const spacing: {
  // Spacing scale values (e.g., '0', '1', '2', ..., '8', '10', '12', '16').
  [key: string]: string;
};
// Border radius tokens.
export declare const radius: {
  // Radius scale values (e.g., 'none', 'sm', 'md', 'lg', 'full').
  [key: string]: string;
};
// Typography and text style tokens.
export declare const typography: {
  // Font families.
  fontFamily: string;
  // Font sizes.
  fontSize: { [key: string]: string };
  // Line heights.
  lineHeight: { [key: string]: string };
  // Font weights.
  fontWeight: { [key: string]: string };
};
// Box shadow tokens.
export declare const shadow: {
  // Shadow scale values (e.g., 'sm', 'md', 'lg', 'xl').
  [key: string]: string;
};
// Motion and animation tokens.
export declare const motion: {
  // Duration scale values (e.g., 'fast', 'normal', 'slow').
  duration: { [key: string]: string };
  // Easing functions.
  easing: { [key: string]: string };
};
```

---

## `./react`

### Usage

```ts
import { ThemeProvider, useTheme } from '@cfxdevkit/theme/react';
```

```ts
// Supported theme modes.
export type Theme = 'light' | 'dark' | 'system';
// The resolved theme value.
export type ResolvedTheme = 'light' | 'dark';
// The context value for theme management.
export interface ThemeContextValue {
  // Current resolved theme.
  theme: ResolvedTheme;
  // Function to toggle between light and dark themes.
  toggleTheme: () => void;
}
// Props for the ThemeProvider.
export interface ThemeProviderProps {
  // Default theme to use before hydration or storage is available.
  defaultTheme?: Theme;
  // Key used to persist theme preference in storage.
  storageKey?: string;
  // Child components to wrap with theme context.
  children: React.ReactNode;
}
// React component to provide theme context.
export declare function ThemeProvider({ defaultTheme, storageKey, children, }: ThemeProviderProps): import("react/jsx-runtime").JSX.Element;
// Hook to access the current theme.
export declare function useTheme(): ThemeContextValue;
```

---

## `./css`

### Usage

```css
/* Use theme variables in your CSS */
.element {
  color: var(--color-primary);
}
```

*(no named exports detected)*

---

## `./dark`

### Usage

```ts
import { darkTokens } from '@cfxdevkit/theme/dark';
```

*(no named exports detected)*

<!-- api-hash: dd77b4e92e06a978b7e25afa90b0237307f2769848e547e951cc00605aafabd7 -->
