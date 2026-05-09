/**
 * `@cfxdevkit/theme/tokens` — design tokens as JS constants.
 *
 * All string values are CSS custom-property references.
 * Numbers (weights, durations) are bare values.
 * Import the `/css` side-effect first so the variables resolve at runtime.
 */

export const colors = {
  bg: {
    default: 'var(--cfx-color-bg-default)',
    subtle: 'var(--cfx-color-bg-subtle)',
    emphasis: 'var(--cfx-color-bg-emphasis)',
  },
  fg: {
    default: 'var(--cfx-color-fg-default)',
    subtle: 'var(--cfx-color-fg-subtle)',
    muted: 'var(--cfx-color-fg-muted)',
    'on-brand': 'var(--cfx-color-fg-on-brand)',
  },
  brand: {
    primary: 'var(--cfx-color-brand-primary)',
    accent: 'var(--cfx-color-brand-accent)',
  },
  feedback: {
    success: 'var(--cfx-color-feedback-success)',
    warning: 'var(--cfx-color-feedback-warning)',
    danger: 'var(--cfx-color-feedback-danger)',
    info: 'var(--cfx-color-feedback-info)',
  },
  border: {
    default: 'var(--cfx-color-border-default)',
    subtle: 'var(--cfx-color-border-subtle)',
  },
} as const;

export const spacing = {
  0: 'var(--cfx-space-0)',
  1: 'var(--cfx-space-1)',
  2: 'var(--cfx-space-2)',
  3: 'var(--cfx-space-3)',
  4: 'var(--cfx-space-4)',
  6: 'var(--cfx-space-6)',
  8: 'var(--cfx-space-8)',
  12: 'var(--cfx-space-12)',
  16: 'var(--cfx-space-16)',
} as const;

export const radius = {
  sm: 'var(--cfx-radius-sm)',
  md: 'var(--cfx-radius-md)',
  lg: 'var(--cfx-radius-lg)',
  pill: 'var(--cfx-radius-pill)',
} as const;

export const typography = {
  sans: 'var(--cfx-font-sans)',
  mono: 'var(--cfx-font-mono)',
  sizes: {
    xs: 'var(--cfx-text-xs)',
    sm: 'var(--cfx-text-sm)',
    base: 'var(--cfx-text-base)',
    lg: 'var(--cfx-text-lg)',
    xl: 'var(--cfx-text-xl)',
    '2xl': 'var(--cfx-text-2xl)',
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const shadow = {
  sm: 'var(--cfx-shadow-sm)',
  md: 'var(--cfx-shadow-md)',
  lg: 'var(--cfx-shadow-lg)',
} as const;

/** Animation timing constants. Use these as ms values in CSS transition properties. */
export const motion = {
  fastMs: 100,
  baseMs: 200,
  slowMs: 350,
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
