import pg from "pg";

const c = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://pdcc:pdcc@localhost:5432/pdcc",
});
await c.connect();
const r = await c.query(
  `SELECT payload->>'activeProjectId' AS active,
          jsonb_array_length(payload->'projects') AS cnt
   FROM pdcc_application_state`,
);
console.log("state:", r.rows[0]);
const names = await c.query(
  `SELECT p->>'name' AS name, p->>'id' AS id
   FROM pdcc_application_state,
        jsonb_array_elements(payload->'projects') AS p`,
);
console.log("projects:", names.rows);
await c.end();
