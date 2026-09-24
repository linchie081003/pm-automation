import { Client } from "pg";

const adminUrl =
  process.env.ADMIN_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/postgres";

const PDCC_USER = process.env.PDCC_DB_USER ?? "pdcc";
const PDCC_PASSWORD = process.env.PDCC_DB_PASSWORD ?? "pdcc";
const PDCC_DB = process.env.PDCC_DB_NAME ?? "pdcc";

async function main() {
  const admin = new Client({ connectionString: adminUrl });
  await admin.connect();

  const roleExists = await admin.query(
    `SELECT 1 FROM pg_roles WHERE rolname = $1`,
    [PDCC_USER],
  );
  const esc = (s: string) => s.replace(/'/g, "''");
  if (roleExists.rowCount === 0) {
    await admin.query(
      `CREATE ROLE ${PDCC_USER} WITH LOGIN PASSWORD '${esc(PDCC_PASSWORD)}'`,
    );
    console.log(`Created role ${PDCC_USER}`);
  } else {
    await admin.query(
      `ALTER ROLE ${PDCC_USER} WITH PASSWORD '${esc(PDCC_PASSWORD)}'`,
    );
    console.log(`Role ${PDCC_USER} already exists (password reset)`);
  }

  const dbExists = await admin.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [PDCC_DB],
  );
  if (dbExists.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${PDCC_DB} OWNER ${PDCC_USER}`);
    console.log(`Created database ${PDCC_DB}`);
  } else {
    console.log(`Database ${PDCC_DB} already exists`);
  }

  await admin.end();

  const appUrl = `postgresql://${PDCC_USER}:${PDCC_PASSWORD}@localhost:5432/${PDCC_DB}`;
  const verify = new Client({ connectionString: appUrl });
  await verify.connect();
  await verify.query("SELECT 1");
  await verify.end();

  console.log("\nSetup OK. Add to backend/.env:");
  console.log(`DATABASE_URL=${appUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
