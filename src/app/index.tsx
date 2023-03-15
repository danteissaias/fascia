import '@danteissaias/ds/index.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { loadConfig } from '../config';

const root = document.getElementById('root');
if (!root) throw new Error('No root element found');

const config = await loadConfig();
console.log({ config });

createRoot(root).render(
  <React.StrictMode>
    <div>Check the console to see if the config has loaded...</div>
  </React.StrictMode>
);
