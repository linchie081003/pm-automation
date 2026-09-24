import { Pool } from "pg";

let pool: Pool | null = null;

function parseDbTarget(connectionString: string): {
  host: string;
  port: string;
  user: string;
  database: string;
} {
  try {
    const u = new URL(connectionString);
    return {
      host: u.hostname,
      port: u.port || "5432",
      user: decodeURIComponent(u.username),
      database: u.pathname.replace(/^\//, "") || "(default)",
    };
  } catch {
    return { host: "?", port: "?", user: "?", database: "?" };
  }
}

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Use npm run db:setup (local Postgres) or npm run db:up (Docker on port 5433).",
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
    pool.on("error", (err) => {
      const target = parseDbTarget(url);
      // #region agent log
      fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "df436c",
        },
        body: JSON.stringify({
          sessionId: "df436c",
          location: "pool.ts:on(error)",
          message: "postgres pool error",
          data: {
            code: (err as NodeJS.ErrnoException & { code?: string }).code,
            target,
          },
          timestamp: Date.now(),
          hypothesisId: "H-AUTH",
          runId: "auth-fix",
        }),
      }).catch(() => {});
      // #endregion
    });
  }
  return pool;
}

export function formatPostgresAuthHint(connectionString: string): string {
  const t = parseDbTarget(connectionString);
  return (
    `PostgreSQL menolak login untuk user "${t.user}" (${t.host}:${t.port}/${t.database}). ` +
    `Jika port 5432 sudah dipakai PostgreSQL lokal (bukan Docker), jalankan: npm run db:setup — ` +
    `atau ubah DATABASE_URL ke kredensial Postgres Anda. Docker PDCC memakai port 5433 (lihat .env.example).`
  );
}
