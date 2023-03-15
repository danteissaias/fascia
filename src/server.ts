import rootPath from 'app-root-path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { getConfigPath, loadConfig } from './config';
import { getPrismaClient } from './prisma';
const { PrismaClient } = await getPrismaClient();

export interface ServerOptions {
  isProd?: boolean;
}

export async function createServer({
  isProd = process.env.NODE_ENV === 'production',
}: ServerOptions) {
  const app = express();
  const config = await loadConfig();
  const prisma = new PrismaClient();

  const keys = Object.keys(config.schemas);
  for (const key of keys) {
    if (key in prisma) continue;
    throw new Error(`Model "${key}" not found in Prisma Client`);
  }

  const rootDir = rootPath.resolve(isProd ? 'dist/app' : '');

  const vite = await createViteServer({
    server: { middlewareMode: true },
    logLevel: isProd ? 'error' : 'info',
    root: rootDir,
    mode: isProd ? 'production' : 'development',
    define: { configPath: `"${getConfigPath()}"` },
  });

  app.get('/api', async (req, res) => {
    const data: Record<string, any> = {};

    for (const key of keys) {
      data[key] = await prisma[key].findMany();
    }

    res.json(data);
  });

  app.use(vite.middlewares);

  return app;
}
