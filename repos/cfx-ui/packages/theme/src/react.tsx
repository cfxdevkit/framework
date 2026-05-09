import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  /** The actual rendered theme — never "system". */
  resolved: ResolvedTheme;
  set: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
ThemeContext.displayName = 'ThemeContext';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(t: Theme): ResolvedTheme {
  return t === 'system' ? getSystemTheme() : t;
}

function applyToDocument(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolved);
}

export interface ThemeProviderProps {
  /** Initial theme preference. Defaults to `"system"`. */
  defaultTheme?: Theme;
  /** localStorage key. Defaults to `"cfx-theme"`. */
  storageKey?: string;
  children: ReactNode;
}

/**
 * Manages `[data-theme]` on `<html>`. SSR-safe — server renders the
 * `defaultTheme` until hydration, then reads localStorage.
 *
 * Pair with `@cfxdevkit/theme/dark` CSS import to activate dark-mode overrides.
 */
export function ThemeProvider({
  defaultTheme = 'system',
  storageKey = 'cfx-theme',
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // SSR: skip localStorage
    if (typeof localStorage === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
  });

  const resolved = resolveTheme(theme);

  // Apply data-theme on every resolved change
  useEffect(() => {
    applyToDocument(resolved);
  }, [resolved]);

  // Re-resolve when OS preference changes while theme === "system"
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyToDocument(resolveTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const set = useCallback(
    (t: Theme) => {
      setThemeState(t);
      try {
        localStorage.setItem(storageKey, t);
      } catch {
        // localStorage may be unavailable in some sandboxed environments
      }
    },
    [storageKey],
  );

  return <ThemeContext.Provider value={{ theme, resolved, set }}>{children}</ThemeContext.Provider>;
}

/**
 * Returns the current theme and a setter.
 * Must be used inside `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      '`useTheme` must be used inside `<ThemeProvider>`. ' +
        'Wrap your component tree with `<ThemeProvider>`.',
    );
  }
  return ctx;
}
