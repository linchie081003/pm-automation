import {
  loadApplicationState,
  persistApplicationState,
} from "@/backend/repositories/pdcc-repository";
import type { PdccDatabase } from "@/lib/types";

export async function getDb(): Promise<PdccDatabase> {
  const db = await loadApplicationState();
  // #region agent log
  fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "df436c",
    },
    body: JSON.stringify({
      sessionId: "df436c",
      location: "store.ts:getDb",
      message: "load state from postgres",
      data: {
        projectCount: db.projects.length,
        activeProjectId: db.activeProjectId ?? null,
      },
      timestamp: Date.now(),
      hypothesisId: "H-DB",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion
  return db;
}

export async function saveDb(db: PdccDatabase): Promise<void> {
  await persistApplicationState(db);
  // #region agent log
  fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "df436c",
    },
    body: JSON.stringify({
      sessionId: "df436c",
      location: "store.ts:saveDb",
      message: "persist state to postgres",
      data: { activeProjectId: db.activeProjectId ?? null },
      timestamp: Date.now(),
      hypothesisId: "H-DB",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
