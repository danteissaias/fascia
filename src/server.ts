import rootPath from 'app-root-path';
import bodyParser from 'body-parser';
import express from 'express';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { createServer as createViteServer } from 'vite';

export function getConfigPath() {
  const filePath = path.resolve(process.cwd(), 'dash.config.tsx');
  return pathToFileURL(filePath).href;
}

declare global {
  interface Window {
    configPath: string;
  }
}

export async function loadConfig() {
  const configPath =
    typeof window !== 'undefined' ? window.configPath : getConfigPath();
  return await import(/* @vite-ignore */ configPath).then((mod) => mod.default);
}

export interface ServerOptions {
  isProd?: boolean;
}

async function getPrismaClient() {
  const cwd = process.cwd();
  const prismaPath = path.resolve(cwd, './node_modules/@prisma/client');
  const fileUrl = pathToFileURL(prismaPath).href;
  return await import(/* @vite-ignore */ fileUrl);
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
