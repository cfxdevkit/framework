import { Buffer } from 'buffer';

// Buffer polyfill for SIWE (siwe uses Buffer internally in the browser)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).Buffer = Buffer;
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

const root = document.getElementById('root');
if (!root) throw new Error('No #root element found');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
