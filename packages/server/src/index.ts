import type { NextApiHandler } from "next";

export interface ServerOptions {
  prismaPath?: string;
}

function getPrismaClient(prismaPath = require.resolve("@prisma/client")) {
  try {
    console.debug("Importing Prisma Client from", prismaPath);
    return require(prismaPath);
  } catch (error) {
    throw new Error("Unable to import Prisma Client. Did you forget to run 'prisma generate'?");
  }
}

export const createServer = (options: ServerOptions = {}): NextApiHandler => {
  const { prismaPath } = options;
  const { PrismaClient } = getPrismaClient(prismaPath);
  const prisma = new PrismaClient();

  return async (req, res) => {
    const query = req.body;

    if (!query.modelName) throw new Error("Invalid Prisma Clinet query");
    const prismaClientModel = query.modelName.charAt(0).toLowerCase() + query.modelName.slice(1);
    if (!(prismaClientModel in prisma)) throw new Error(`No model in schema with name \`${query.modelName}\``);

    const response = await prisma[prismaClientModel][query.operation].call(null, query.args);
    res.status(200).json(response);
  };
};
