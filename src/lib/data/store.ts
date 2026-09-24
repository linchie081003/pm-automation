import { promises as fs } from "fs";
import path from "path";
import type { PdccDatabase } from "@/lib/types";
import { createSeedDatabase } from "@/lib/data/seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "pdcc.json");

let memoryStore: PdccDatabase | null = null;

async function ensureDataFile(): Promise<PdccDatabase> {
  if (memoryStore) return memoryStore;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    memoryStore = JSON.parse(raw) as PdccDatabase;
    return memoryStore;
  } catch {
    const seed = createSeedDatabase();
    memoryStore = seed;
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
}

export async function getDb(): Promise<PdccDatabase> {
  if (process.env.PDCC_DEMO_MODE === "false") {
    // still json until supabase repo wired for all entities
  }
  return ensureDataFile();
}

export async function saveDb(db: PdccDatabase): Promise<void> {
  memoryStore = db;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
