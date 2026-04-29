import { useState } from 'react';
import { copy } from '../lib/copy.js';

interface Props {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'copy' }: Props) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={async () => {
        if (await copy(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        }
      }}
    >
      {done ? '✓' : label}
    </button>
  );
}
