export const COLOR_TOKENS = [
  { name: '--cfx-color-bg-default', category: 'Background' },
  { name: '--cfx-color-bg-subtle', category: 'Background' },
  { name: '--cfx-color-bg-emphasis', category: 'Background' },
  { name: '--cfx-color-fg-default', category: 'Foreground' },
  { name: '--cfx-color-fg-subtle', category: 'Foreground' },
  { name: '--cfx-color-fg-muted', category: 'Foreground' },
  { name: '--cfx-color-brand-primary', category: 'Brand' },
  { name: '--cfx-color-brand-accent', category: 'Brand' },
  { name: '--cfx-color-feedback-success', category: 'Feedback' },
  { name: '--cfx-color-feedback-warning', category: 'Feedback' },
  { name: '--cfx-color-feedback-danger', category: 'Feedback' },
  { name: '--cfx-color-feedback-info', category: 'Feedback' },
  { name: '--cfx-color-border-default', category: 'Border' },
  { name: '--cfx-color-border-subtle', category: 'Border' },
] as const;

export const SPACE_TOKENS = [
  '--cfx-space-1',
  '--cfx-space-2',
  '--cfx-space-3',
  '--cfx-space-4',
  '--cfx-space-6',
  '--cfx-space-8',
  '--cfx-space-12',
  '--cfx-space-16',
] as const;

export const RADIUS_TOKENS = [
  '--cfx-radius-sm',
  '--cfx-radius-md',
  '--cfx-radius-lg',
  '--cfx-radius-pill',
] as const;
