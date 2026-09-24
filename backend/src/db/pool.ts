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
      "DATABASE_URL is not set in backend/.env or environment (see backend/.env.example).",
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

export function formatPostgresAuthHint(connectionString: string): string {
  const t = parseDbTarget(connectionString);
  return (
    `PostgreSQL menolak login untuk user "${t.user}" (${t.host}:${t.port}/${t.database}). ` +
    `Jalankan npm run db:setup dari folder backend.`
  );
}
