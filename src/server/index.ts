import { DMMF } from '@prisma/generator-helper';
import prismaInternals from '@prisma/internals';
import rootPath from 'app-root-path';
import bodyParser from 'body-parser';
import express from 'express';
import * as path from 'path';
import { createServer as createViteServer } from 'vite';
import { getConfigPath, loadConfig } from '../config';

export interface ServerOptions {
  isProd?: boolean;
}

async function getPrismaClient() {
  const cwd = process.cwd();
  const prismaPath = path.resolve(cwd, './node_modules/@prisma/client');
  return await import(prismaPath);
}

const { PrismaClient, Prisma } = await getPrismaClient();

interface UniqueId {
  name: string;
  fields: DMMF.Field[];
}

// TODO: Support compound keys
function getUniqueId(model: DMMF.Model) {
  const idField = model.fields.find((f) => f.isId);
  if (!idField) throw new Error(`No unique id found for model "${model.name}"`);
  return { name: idField.name, fields: [idField] };
}

function whereId(uniqueId: UniqueId, document: Record<string, any>) {
  const s = uniqueId.name;
  const i = uniqueId.fields.reduce<Record<string, any>>(
    (t, s) => ((t[s.name] = document[s.name]), t),
    {}
  );
  return 1 === uniqueId.fields.length ? i : { [s]: i };
}

export async function createServer({
  isProd = process.env.NODE_ENV === 'production',
}: ServerOptions) {
  const app = express();
  const config = await loadConfig();
  const prisma = new PrismaClient();
  const datamodelPath = path.resolve(process.cwd(), './prisma/schema.prisma');
  const dmmf = await prismaInternals.getDMMF({ datamodelPath });

  const User = dmmf.datamodel.models[0];
  const users = await prisma.user.findMany();
  const where = whereId(getUniqueId(User), users[0]);

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

  app.get('/api', async (req, res) => {
    const data: Record<string, any> = {};

    for (const key of keys) {
      data[key] = await prisma[key].findMany();
    }

    res.json({ data });
  });

  app.post('/rpc', async (req, res) => {
    const { modelName, operation, args = {} } = req.body;
    res.json(await prisma[modelName][operation](args));
  });

  app.use(vite.middlewares);

  return app;
}
