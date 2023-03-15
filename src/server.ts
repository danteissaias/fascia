import rootPath from 'app-root-path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { getConfigPath } from './config';

export interface ServerOptions {
  isProd?: boolean;
}

export async function createServer({
  isProd = process.env.NODE_ENV === 'production',
}: ServerOptions) {
  const app = express();

  const rootDir = rootPath.resolve(isProd ? 'dist/app' : '');

  const vite = await createViteServer({
    server: { middlewareMode: true },
    logLevel: isProd ? 'error' : 'info',
    root: rootDir,
    mode: isProd ? 'production' : 'development',
    define: { configPath: `"${getConfigPath()}"` },
  });

  app.get('/api', (req, res) => {
    res.send('Hello from API');
  });

  app.use(vite.middlewares);

  return app;
}
