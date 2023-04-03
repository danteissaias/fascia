import { Config } from "./config";

export interface RpcServerOptions {
  config: Config;
  prisma: any;
}

export interface RpcMessage {
  modelName: string;
  operation: string;
  args?: any;
}

export async function createRpcServer({ config, prisma }: RpcServerOptions) {
  const keys = Object.keys(config.schemas);
  for (const key of keys) {
    if (key in prisma) continue;
    throw new Error(`Model "${key}" not found in Prisma Client`);
  }

  return async ({ modelName, operation, args = {} }: RpcMessage) => await prisma[modelName][operation](args);
}
