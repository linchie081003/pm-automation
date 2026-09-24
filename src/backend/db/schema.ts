import { formatPostgresAuthHint, getPool } from "@/backend/db/pool";

export async function ensureDatabaseSchema(): Promise<void> {
  const pool = getPool();
  const url = process.env.DATABASE_URL ?? "";
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS pdcc_application_state (
      singleton_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS organization_integrations (
      organization_id TEXT PRIMARY KEY,
      clickup_api_token TEXT,
      clickup_workspace_id TEXT,
      clickup_space_id TEXT,
      google_client_id TEXT,
      google_client_secret TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "28P01" && url) {
      // #region agent log
      fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "df436c",
        },
        body: JSON.stringify({
          sessionId: "df436c",
          location: "schema.ts:ensureDatabaseSchema",
          message: "postgres auth failed",
          data: { code: err.code },
          timestamp: Date.now(),
          hypothesisId: "H-AUTH",
          runId: "auth-fix",
        }),
      }).catch(() => {});
      // #endregion
      throw new Error(formatPostgresAuthHint(url), { cause: e });
    }
    throw e;
  }
}
