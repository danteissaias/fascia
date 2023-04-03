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
  const { PrismaClient, Prisma } = getPrismaClient(prismaPath);
  const prisma = new PrismaClient();

  return async (req, res) => {
    const { action, payload } = req.body;

    switch (action) {
      case "clientRequest":
        const { modelName, operation, args } = payload;
        if (!modelName || !operation) throw new Error("Invalid Prisma Client query");

        const model = payload.modelName.charAt(0).toLowerCase() + modelName.slice(1);
        if (model in prisma) {
          const data = await prisma[model][operation].call(null, args);
          return res.status(200).json(data);
        } else throw new Error(`No model in schema with name \`${modelName}\``);

      case "getDMMF":
        const dmmf = Prisma.dmmf;
        return res.status(200).json(dmmf);

      default:
        throw new Error(`Invalid action: ${action}`);
    }
  };
};
