import { apiLoadState, apiSaveState } from "@/lib/pdcc-api";
import type { PdccDatabase } from "@/lib/types";

export async function getDb(): Promise<PdccDatabase> {
  return apiLoadState();
}

export async function saveDb(db: PdccDatabase): Promise<void> {
  await apiSaveState(db);
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
