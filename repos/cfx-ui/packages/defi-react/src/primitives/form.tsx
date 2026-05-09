/**
 * `@cfxdevkit/defi-react/primitives` — form components.
 *
 * @internal Part of the primitives barrel. Import from
 * \`@cfxdevkit/defi-react/primitives\` rather than this file.
 */

import type { CSSProperties, InputHTMLAttributes } from 'react';
import { useState } from 'react';
import { Button } from './core.js';
// ── Input ────────────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Styled text input with optional label and inline error message.
 */
export function Input({ label, error, id, style, ...rest }: InputProps) {
  const inputStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    fontSize: 'var(--cfx-text-base)',
    background: 'var(--cfx-color-bg-subtle)',
    color: 'var(--cfx-color-fg-default)',
    border: `1px solid ${error ? 'var(--cfx-color-feedback-danger)' : 'var(--cfx-color-border-default)'}`,
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    ...style,
  };
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            marginBottom: 4,
            fontSize: 'var(--cfx-text-sm)',
            color: 'var(--cfx-color-fg-muted)',
          }}
        >
          {label}
        </label>
      )}
      <input id={id} style={inputStyle} {...rest} />
      {error && (
        <span
          style={{
            display: 'block',
            marginTop: 4,
            fontSize: 'var(--cfx-text-sm)',
            color: 'var(--cfx-color-feedback-danger)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

// ── CopyButton ────────────────────────────────────────────────────────────

export interface CopyButtonProps {
  text: string;
  label?: string;
  style?: CSSProperties;
}

/**
 * Icon button that copies `text` to the clipboard on click.
 */
export function CopyButton({ text, label = 'Copy', style }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      title={copied ? 'Copied!' : label}
      style={style}
    >
      {copied ? '✓' : '⧉'}
    </Button>
  );
}

// ── SelectMenu ────────────────────────────────────────────────────────────

export interface SelectMenuOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectMenuProps<T extends string = string> {
  options: SelectMenuOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

/**
 * Accessible native `<select>` dropdown.
 */
export function SelectMenu<T extends string = string>({
  options,
  value,
  onChange,
  label,
  disabled,
  style,
}: SelectMenuProps<T>) {
  const selectStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    fontSize: 'var(--cfx-text-base)',
    background: 'var(--cfx-color-bg-subtle)',
    color: 'var(--cfx-color-fg-default)',
    border: '1px solid var(--cfx-color-border-default)',
    borderRadius: '6px',
    ...style,
  };
  return (
    <div>
      {label ? (
        <label
          style={{
            display: 'block',
            marginBottom: 4,
            fontSize: 'var(--cfx-text-sm)',
            color: 'var(--cfx-color-fg-muted)',
          }}
        >
          <span style={{ display: 'block', marginBottom: 2 }}>{label}</span>
          <select
            value={value}
            disabled={disabled}
            style={selectStyle}
            onChange={(e) => onChange(e.target.value as T)}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <select
          value={value}
          disabled={disabled}
          style={selectStyle}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ── SegmentedControl ──────────────────────────────────────────────────────

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  active: T;
  onChange: (value: T) => void;
  style?: CSSProperties;
}

/**
 * Toggle-group for selecting among N named options (like a compact tab bar).
 */
export function SegmentedControl<T extends string = string>({
  options,
  active,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  return (
    <fieldset
      style={{
        display: 'inline-flex',
        border: '1px solid var(--cfx-color-border-default)',
        borderRadius: '6px',
        overflow: 'hidden',
        padding: 0,
        margin: 0,
        ...style,
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === active;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: '6px 14px',
              fontSize: 'var(--cfx-text-sm)',
              border: 'none',
              borderRight: '1px solid var(--cfx-color-border-default)',
              cursor: 'pointer',
              background: isActive
                ? 'var(--cfx-color-brand-primary)'
                : 'var(--cfx-color-bg-default)',
              color: isActive ? 'var(--cfx-color-fg-on-brand)' : 'var(--cfx-color-fg-default)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </fieldset>
  );
}
