import bodyParser from 'body-parser';
import express from 'express';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import jiti from 'jiti';
import { transformSync } from '@swc-node/core';
import { Config } from './config';
import { transformFile } from '@swc/core';
import requireFromString from 'require-from-string';
import react from '@vitejs/plugin-react-swc';

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
  const { code } = await transformFile(configPath, {
    jsc: { target: 'es2020', parser: { syntax: 'typescript', tsx: true } },
    module: { type: 'commonjs' },
  });

  return requireFromString(code).default;
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
    // We need react plugin for config in prod
    plugins: isProd ? [react()] : [],
    server: { middlewareMode: true },
    logLevel: 'error',
    root: rootDir,
    define: { getConfig: '() => import("@/config").then((m) => m.default)' },
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
