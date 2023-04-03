import { readFileSync } from "fs";
import { loadEnvironment, PCW } from "@prisma/studio-pcw";
import type { NextApiHandler } from "next";

export interface ServerOptions {
  schemaPath: string;
}

export const createServer = ({ schemaPath }: ServerOptions): NextApiHandler => {
  const schema = readFileSync(schemaPath, "utf-8");
  loadEnvironment(schemaPath);
  const pcw = new PCW(schema, schemaPath);

  return async (req, res) => {
    const response = await pcw.request(req.body);
    res.status(200).json(response);
  };
};
