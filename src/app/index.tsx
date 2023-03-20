import '@danteissaias/ds/index.css';

import { Toaster } from '@danteissaias/ds';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import type { Config } from '../config';

const root = document.getElementById('root');
if (!root) throw new Error('No root element found');

declare global {
  interface Window {
    getConfig: () => Promise<Config>;
  }
}

const config = await window.getConfig();

createRoot(root).render(
  <React.StrictMode>
    <App config={config} />
    <Toaster />
  </React.StrictMode>
);
