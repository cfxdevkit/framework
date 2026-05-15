import { useState } from 'react';
import { copy } from '../lib/copy';
import './code-snippet.css';

export interface CodeSnippetProps {
  code: string;
  lang?: string;
  label?: string;
}

export function CodeSnippet({ code, label }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (await copy(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="cfx-code-snippet">
      {label && <div className="cfx-code-snippet-label">{label}</div>}
      <div className="cfx-code-snippet-body">
        <pre className="cfx-code-snippet-pre">
          <code>{code}</code>
        </pre>
        <button
          type="button"
          className="cfx-code-snippet-copy"
          onClick={handleCopy}
          aria-label="Copy to clipboard"
        >
          {copied ? '✓' : 'copy'}
        </button>
      </div>
    </div>
  );
}
