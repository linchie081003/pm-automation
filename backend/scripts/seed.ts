import { persistApplicationState } from "../src/repositories/pdcc-repository.ts";
import { createSeedDatabase } from "../../src/lib/data/seed.ts";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL in backend/.env");
  }
  const seed = createSeedDatabase();
  await persistApplicationState(seed);
  console.log("Seed written to PostgreSQL (tabel relasional pdcc_*)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
