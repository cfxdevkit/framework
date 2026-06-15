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
export declare const __packageName: "@cfxdevkit/theme";
export declare const colors: {
export declare const spacing: {
export declare const radius: {
export declare const typography: {
export declare const shadow: {
export declare const motion: {
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export interface ThemeContextValue {
export interface ThemeProviderProps {
export declare function ThemeProvider({ defaultTheme, storageKey, children, }: ThemeProviderProps): import("react").JSX.Element;
export declare function useTheme(): ThemeContextValue;
```

---

## `./tokens`

```ts
export declare const colors: {
export declare const spacing: {
export declare const radius: {
export declare const typography: {
export declare const shadow: {
export declare const motion: {
```

---

## `./react`

```ts
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export interface ThemeContextValue {
export interface ThemeProviderProps {
export declare function ThemeProvider({ defaultTheme, storageKey, children, }: ThemeProviderProps): import("react").JSX.Element;
export declare function useTheme(): ThemeContextValue;
```

---

## `./css`

*(no named exports detected)*

---

## `./dark`

*(no named exports detected)*

<!-- api-hash: 00971b2e35739809182d9926918c14de5fe95d5765dd0c1c579364e84d4c30eb -->
