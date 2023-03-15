import * as path from 'path';

export async function getPrismaClient() {
  const dynamicImport = new Function('file', 'return import(file)');
  const prismaPath = path.resolve(process.cwd(), 'node_modules/@prisma/client');
  return await dynamicImport(prismaPath);
}
