import { Buffer } from 'buffer';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import './styles.css';

if (typeof (globalThis as { Buffer?: typeof Buffer }).Buffer === 'undefined') {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
