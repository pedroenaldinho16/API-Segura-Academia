import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client.ts";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Configure DATABASE_URL no arquivo .env");

const adapter = new PrismaBetterSqlite3({ url });
export const prisma = new PrismaClient({ adapter });
