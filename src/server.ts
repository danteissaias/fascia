import rootPath from 'app-root-path';
import bodyParser from 'body-parser';
import express from 'express';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import { getConfigPath, loadConfig } from './config';

export interface ServerOptions {
  isProd?: boolean;
}

const PRISMA_MODULE = 'node_modules/prisma/prisma-client/index.js';

async function getPrismaClient() {
  const cwd = process.cwd();
  const prismaPath = path.resolve(cwd, PRISMA_MODULE);
  return await import(/* @vite-ignore */ prismaPath);
}

export async function createServer({
  isProd = process.env.NODE_ENV === 'production',
}: ServerOptions) {
  const { PrismaClient } = await getPrismaClient();

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

  app.use(bodyParser.json());

  app.post('/rpc', async (req, res) => {
    const { modelName, operation, args = {} } = req.body;
    res.json(await prisma[modelName][operation](args));
  });

  app.use(vite.middlewares);

  return app;
}
