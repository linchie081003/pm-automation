import { persistApplicationState } from "../src/backend/repositories/pdcc-repository";
import { createSeedDatabase } from "../src/lib/data/seed";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL in .env.local before running npm run seed");
  }
  const seed = createSeedDatabase();
  await persistApplicationState(seed);
  console.log("Seed written to PostgreSQL (pdcc_application_state)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
