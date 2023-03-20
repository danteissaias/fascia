import '@danteissaias/ds/index.css';

import { Toaster } from '@danteissaias/ds';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('No root element found');

async function loadConfig() {
  const { configPath } = window;
  return await import(/* @vite-ignore */ configPath).then((mod) => mod.default);
}

const config = await loadConfig();

createRoot(root).render(
  <React.StrictMode>
    <App config={config} />
    <Toaster />
  </React.StrictMode>
);
