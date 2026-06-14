import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs';
import type React from 'react';
import { Mermaid } from './components/Mermaid';

export function useMDXComponents(
  components?: Record<string, React.ComponentType<unknown>>,
): Record<string, unknown> {
  const themeComponents = getThemeComponents();
  return {
    ...themeComponents,
    Mermaid,
    ...components,
  };
}
