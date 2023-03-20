import rootPath from 'app-root-path';
import bodyParser from 'body-parser';
import express from 'express';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import { transform } from '@swc-node/core';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

function getConfigPath() {
  return path.resolve(process.cwd(), 'dash.config.tsx');
}

const dynamicImport = (mod: string) =>
  import(/* @vite-ignore */ mod).then((mod) => mod.default);

async function loadConfig() {
  const configPath = getConfigPath();
  const rawConfig = fs.readFileSync(configPath, 'utf-8');
  const { code } = await transform(rawConfig, configPath, {
    target: 'es2020',
    module: 'es6',
  });
  const fileBase = `dash.config.timestamp-${Date.now()}`;
  const fileNameTmp = `${fileBase}.mjs`;
  const fileUrl = `${pathToFileURL(fileBase)}.mjs`;
  fs.writeFileSync(fileNameTmp, code);
  try {
    return await dynamicImport(fileUrl);
  } finally {
    try {
      fs.unlinkSync(fileNameTmp);
    } catch {
      // already removed if this function is called twice simultaneously
    }
  }
}

export interface ServerOptions {
  isProd?: boolean;
}

const PRISMA_MODULE = 'node_modules/@prisma/client/index.js';

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

  const rootDir = rootPath.resolve(isProd ? 'app' : '');
  console.log({
    rootDir,
    rootPath: rootPath.toString(),
    importMetaUrl: import.meta.url,
    test: path.resolve(import.meta.url, '../dist/app'),
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    logLevel: 'error',
    root: rootDir,
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
