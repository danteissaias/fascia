import { transformFile } from '@swc/core';
import bodyParser from 'body-parser';
import compression from 'compression';
import { build } from 'esbuild';
import express, { Router } from 'express';
import * as path from 'path';
import requireFromString from 'require-from-string';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Config } from './config';

export interface ServerOptions {
  isProd?: boolean;
  configPath?: string;
  basePath?: string;
}

const PRISMA_MODULE = 'node_modules/@prisma/client/index.js';

async function getPrismaClient() {
  try {
    const cwd = process.cwd();
    const prismaPath = path.resolve(cwd, PRISMA_MODULE);
    return await import(/* @vite-ignore */ prismaPath);
  } catch (error) {
    throw new Error(
      "Unable to import Prisma Client. Did you forget to run 'prisma generate'?"
    );
  }
}

function getConfigPath() {
  const cwd = process.cwd();
  return path.resolve(cwd, 'dash.config.tsx');
}

async function getConfig(configPath: string) {
  const { code: configCode } = await transformFile(configPath, {
    jsc: { target: 'es2020', parser: { syntax: 'typescript', tsx: true } },
    module: { type: 'commonjs' },
  });

  const config: Config = requireFromString(configCode).default;
  return config;
}

export async function createServer({
  isProd = process.env.NODE_ENV === 'production',
  configPath = getConfigPath(),
  basePath = '/',
}: ServerOptions): Promise<ReturnType<typeof express>> {
  const { PrismaClient } = await getPrismaClient();

  const app = express();
  const router = Router();

  const config = await getConfig(configPath);
  const prisma = new PrismaClient();
  const dirname = fileURLToPath(import.meta.url);

  const keys = Object.keys(config.schemas);
  for (const key of keys) {
    if (key in prisma) continue;
    throw new Error(`Model "${key}" not found in Prisma Client`);
  }

  router.use(bodyParser.json());

  router.post('/rpc', async (req, res) => {
    const { modelName, operation, args = {} } = req.body;
    res.json(await prisma[modelName][operation](args));
  });

  if (isProd) {
    const root = path.resolve(dirname, '../../dist/app');

    await build({
      bundle: true,
      entryPoints: [configPath],
      outfile: path.join(root, 'config.js'),
      jsx: 'automatic',
      jsxImportSource: 'react',
      format: 'esm',
      target: ['es2020', 'chrome90', 'firefox88', 'safari14', 'edge91'],
    });

    router.use(compression());
    router.use(express.static(root));
  } else {
    const root = path.resolve(dirname, '../../');

    const vite = await createViteServer({
      root,
      server: { middlewareMode: true },
      resolve: { alias: { '/config.js': configPath } },
    });

    router.use(vite.middlewares);
  }

  app.use(basePath, router);

  return app;
}
