import { promises as fs } from "fs";
import path from "path";
import { createSeedDatabase } from "../src/lib/data/seed";

async function main() {
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "pdcc.json");
  await fs.mkdir(dir, { recursive: true });
  const seed = createSeedDatabase();
  await fs.writeFile(file, JSON.stringify(seed, null, 2), "utf-8");
  console.log(`Seed written to ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
