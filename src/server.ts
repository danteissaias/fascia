import bodyParser from 'body-parser';
import express from 'express';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import dynamicImport from 'vite-plugin-dynamic-import';
import { Config } from './config';

export interface ServerOptions {
  isProd?: boolean;
  configPath?: string;
}

const PRISMA_MODULE = 'node_modules/@prisma/client/index.js';

async function getPrismaClient() {
  const cwd = process.cwd();
  const prismaPath = path.resolve(cwd, PRISMA_MODULE);
  return await import(/* @vite-ignore */ prismaPath);
}

function getConfigPath() {
  const cwd = process.cwd();
  return path.resolve(cwd, 'dash.config.tsx');
}

async function getConfig(configPath: string): Promise<Config> {
  const config = await require(configPath);
  return config.default;
}

export async function createServer({
  isProd = process.env.NODE_ENV === 'production',
  configPath = getConfigPath(),
}: ServerOptions) {
  const { PrismaClient } = await getPrismaClient();

  const app = express();

  const config = await getConfig(configPath);
  const prisma = new PrismaClient();

  const keys = Object.keys(config.schemas);
  for (const key of keys) {
    if (key in prisma) continue;
    throw new Error(`Model "${key}" not found in Prisma Client`);
  }

  const rootDir = path.resolve(__dirname, isProd ? '../dist/app' : '../');

  const vite = await createViteServer({
    server: { middlewareMode: true },
    logLevel: 'error',
    root: rootDir,
    resolve: { alias: { '@/config': configPath } },
  });

  app.use(bodyParser.json());

  app.post('/rpc', async (req, res) => {
    const { modelName, operation, args = {} } = req.body;
    res.json(await prisma[modelName][operation](args));
  });

  app.use(vite.middlewares);

  return app;
}
