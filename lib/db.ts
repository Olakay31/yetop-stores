import { Temporal } from "@js-temporal/polyfill";

(globalThis as typeof globalThis & {
  Temporal: typeof Temporal;
}).Temporal = Temporal;

import postgres from "@prisma/orm-postgres/runtime";
import contractJson from "../prisma/contract.json" with { type: "json" };

export const db = postgres({
  contractJson,
  url: process.env.DATABASE_URL,
});