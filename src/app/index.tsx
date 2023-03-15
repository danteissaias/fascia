import '@danteissaias/ds/index.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

const root = document.getElementById('root');
if (!root) throw new Error('No root element found');

declare global {
  interface Window {
    configPath: string;
  }
}

const dynamicImport = new Function('file', 'return import(file)');
const config = await dynamicImport(window.configPath);
console.log(config.default);

createRoot(root).render(
  <React.StrictMode>
    <div>Check the console to see if the config has loaded...</div>
  </React.StrictMode>
);
