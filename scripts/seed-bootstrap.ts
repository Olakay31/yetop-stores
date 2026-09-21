import { Temporal } from "@js-temporal/polyfill";

(globalThis as typeof globalThis & { Temporal: typeof Temporal }).Temporal =
  Temporal;

import("./seed")
  .then(() => {
    console.log("🌿 Seed process completed.");
  })
  .catch((error) => {
    console.error("❌ Seed process failed:");
    console.error(error);
    process.exit(1);
  });