import '@danteissaias/ds/index.css';

import { Toaster } from '@danteissaias/ds';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import type { Config } from '../config';

const root = document.getElementById('root');
if (!root) throw new Error('No root element found');

async function getConfig(): Promise<Config> {
  const configPath = './config.js';
  return import(/* @vite-ignore */ configPath).then((mod) => mod.default);
}

const config = await getConfig();

console.log(config);

createRoot(root).render(
  <StrictMode>
    <App config={config} />
    <Toaster />
  </StrictMode>
);
