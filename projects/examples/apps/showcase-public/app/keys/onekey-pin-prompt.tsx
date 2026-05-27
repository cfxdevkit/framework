'use client';

import { StatusBadge } from '@cfxdevkit/example-showcase-ui';
import { BUTTON_STYLE, MUTED_STYLE } from './panel-styles';

export interface PinPromptState {
  requestType: string | null;
  digits: string;
  invalid: boolean;
}

interface OneKeyPinPromptProps {
  pinPrompt: PinPromptState;
  activePinKey: string | null;
  appendPinDigit: (digit: string) => void;
  clearLastPinDigit: () => void;
  submitPinPrompt: () => void;
  cancelPinPrompt: () => void;
}

export function OneKeyPinPrompt({
  pinPrompt,
  activePinKey,
  appendPinDigit,
  clearLastPinDigit,
  submitPinPrompt,
  cancelPinPrompt,
}: OneKeyPinPromptProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--cfx-space-2)',
        padding: 'var(--cfx-space-3)',
        background: 'var(--cfx-color-bg-emphasis)',
        borderRadius: 'var(--cfx-radius-md)',
        border: '1px solid var(--cfx-color-border-default)',
      }}
    >
      <p style={{ ...MUTED_STYLE, color: 'var(--cfx-color-fg-default)', fontWeight: 600 }}>
        Device is locked. Enter PIN by keypad position shown on OneKey.
      </p>
      <p style={{ ...MUTED_STYLE }}>
        {pinPrompt.requestType ? `Request: ${pinPrompt.requestType}` : 'PIN matrix request'}
      </p>
      <p style={{ ...MUTED_STYLE }}>Tap flash confirms each captured position.</p>
      {pinPrompt.invalid && (
        <StatusBadge status="error" label="Incorrect PIN position sequence. Please try again." />
      )}
      <p style={{ ...MUTED_STYLE }}>
        Entered positions:{' '}
        {pinPrompt.digits.length > 0 ? '•'.repeat(pinPrompt.digits.length) : 'none'}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 'var(--cfx-space-2)',
          maxWidth: 280,
        }}
      >
        {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((digit, index) => {
          const isActive = activePinKey === digit;
          return (
            <button
              key={digit}
              type="button"
              onClick={() => appendPinDigit(digit)}
              aria-label={`PIN position ${index + 1}`}
              title="PIN position"
              style={{
                ...BUTTON_STYLE,
                cursor: 'pointer',
                fontSize: '1.1rem',
                transform: isActive ? 'scale(0.97)' : 'scale(1)',
                background: isActive ? 'var(--cfx-color-bg-subtle)' : BUTTON_STYLE.background,
                boxShadow: isActive ? 'inset 0 0 0 2px var(--cfx-color-brand-primary)' : undefined,
                transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease',
              }}
            >
              ●
            </button>
          );
        })}
        {(() => {
          const isActive = activePinKey === '0';
          return (
            <button
              type="button"
              onClick={() => appendPinDigit('0')}
              aria-label="PIN position 10"
              title="PIN position"
              style={{
                ...BUTTON_STYLE,
                cursor: 'pointer',
                fontSize: '1.1rem',
                gridColumn: '1 / 4',
                transform: isActive ? 'scale(0.985)' : 'scale(1)',
                background: isActive ? 'var(--cfx-color-bg-subtle)' : BUTTON_STYLE.background,
                boxShadow: isActive ? 'inset 0 0 0 2px var(--cfx-color-brand-primary)' : undefined,
                transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease',
              }}
            >
              ●
            </button>
          );
        })()}
      </div>
      <div style={{ display: 'flex', gap: 'var(--cfx-space-2)', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={clearLastPinDigit}
          disabled={pinPrompt.digits.length === 0}
          style={{
            ...BUTTON_STYLE,
            cursor: pinPrompt.digits.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Backspace
        </button>
        <button
          type="button"
          onClick={submitPinPrompt}
          disabled={pinPrompt.digits.length === 0}
          style={{
            ...BUTTON_STYLE,
            cursor: pinPrompt.digits.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Submit PIN positions
        </button>
        <button
          type="button"
          onClick={cancelPinPrompt}
          style={{ ...BUTTON_STYLE, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
