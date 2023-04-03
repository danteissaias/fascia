import { createServer } from "@fascia/server";
import { resolve } from "path";

const schemaPath = resolve("prisma/schema.prisma");
const handler = createServer({ schemaPath });

export default handler;
