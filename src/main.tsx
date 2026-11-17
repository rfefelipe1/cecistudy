import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/dm-serif-display/400-italic.css';
import '@fontsource/jetbrains-mono/400.css';
import './assets/fonts/sf-pro/sf-pro-text.css';
import App from './App.tsx';
import { initTheme } from './lib/themes';
import { mark } from './lib/performance/perfMarks';
import './index.css';

mark('app-entry-start');

initTheme();
mark('theme-ready');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
