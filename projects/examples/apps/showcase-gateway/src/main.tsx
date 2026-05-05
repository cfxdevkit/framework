import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import '@cfxdevkit/example-showcase-ui/theme.css';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
