import { getPool } from "../src/db/pool.ts";
import { ensureRelationalSchema } from "../src/db/relational-schema.ts";
import { persistApplicationState } from "../src/repositories/relational-repository.ts";
import { createSeedDatabase } from "../../src/lib/data/seed.ts";

const withSeed = process.argv.includes("--seed");

const RELATIONAL_TABLES = [
  "pdcc_task_checklist_items",
  "pdcc_project_tasks",
  "pdcc_phases",
  "pdcc_baseline_gap_reasons",
  "pdcc_baselines",
  "pdcc_documents",
  "pdcc_payment_terms",
  "pdcc_kickoff_team",
  "pdcc_pic_mappings",
  "pdcc_task_additions",
  "pdcc_clickup_logs",
  "pdcc_unclassified_tasks",
  "pdcc_weekly_reports",
  "pdcc_activities",
  "pdcc_closing_items",
  "pdcc_projects",
  "pdcc_template_tasks",
  "pdcc_template_phases",
  "pdcc_task_templates",
  "pdcc_holidays",
  "pdcc_position_rates",
  "pdcc_notifications",
  "pdcc_members",
  "pdcc_role_permissions",
  "pdcc_organization_settings",
  "pdcc_organizations",
  "organization_integrations",
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Set DATABASE_URL in backend/.env");
  }

  await ensureRelationalSchema();
  const pool = getPool();

  await pool.query(`DROP TABLE IF EXISTS pdcc_application_state`);
  for (const table of RELATIONAL_TABLES) {
    await pool.query(`DELETE FROM ${table}`);
  }

  console.log("Semua tabel relasional PDCC dikosongkan.");

  if (withSeed) {
    const seed = createSeedDatabase();
    await persistApplicationState(seed);
    console.log(`Seed demo (${seed.projects.length} project).`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
