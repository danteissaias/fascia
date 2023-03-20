import '@danteissaias/ds/index.css';

import { Toaster } from '@danteissaias/ds';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('No root element found');

declare global {
  interface Window {
    configPath: string;
  }
}

const dynamicImport = (mod: string) =>
  import(/* @vite-ignore */ mod).then((mod) => mod.default);
const config = await dynamicImport(window.configPath);

createRoot(root).render(
  <React.StrictMode>
    <App config={config} />
    <Toaster />
  </React.StrictMode>
);
