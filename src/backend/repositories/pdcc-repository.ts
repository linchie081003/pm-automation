import { getPool } from "@/backend/db/pool";
import { ensureDatabaseSchema } from "@/backend/db/schema";
import { createSeedDatabase } from "@/lib/data/seed";
import type { PdccDatabase } from "@/lib/types";

export interface OrganizationIntegrations {
  organizationId: string;
  clickupApiToken?: string;
  clickupWorkspaceId?: string;
  clickupSpaceId?: string;
}

export async function loadApplicationState(): Promise<PdccDatabase> {
  await ensureDatabaseSchema();
  const pool = getPool();
  const res = await pool.query<{ payload: PdccDatabase }>(
    `SELECT payload FROM pdcc_application_state WHERE singleton_id = 1`,
  );
  if (res.rows[0]?.payload) {
    return res.rows[0].payload;
  }
  const seed = createSeedDatabase();
  await persistApplicationState(seed);
  return seed;
}

export async function persistApplicationState(db: PdccDatabase): Promise<void> {
  await ensureDatabaseSchema();
  const pool = getPool();
  await pool.query(
    `INSERT INTO pdcc_application_state (singleton_id, payload, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (singleton_id)
     DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
    [JSON.stringify(db)],
  );
}

export async function loadIntegrations(
  organizationId: string,
): Promise<OrganizationIntegrations> {
  await ensureDatabaseSchema();
  const pool = getPool();
  const res = await pool.query<{
    organization_id: string;
    clickup_api_token: string | null;
    clickup_workspace_id: string | null;
    clickup_space_id: string | null;
  }>(
    `SELECT organization_id, clickup_api_token, clickup_workspace_id, clickup_space_id
     FROM organization_integrations WHERE organization_id = $1`,
    [organizationId],
  );
  const row = res.rows[0];
  if (!row) {
    return { organizationId };
  }
  return {
    organizationId: row.organization_id,
    clickupApiToken: row.clickup_api_token ?? undefined,
    clickupWorkspaceId: row.clickup_workspace_id ?? undefined,
    clickupSpaceId: row.clickup_space_id ?? undefined,
  };
}

export async function saveIntegrations(
  config: OrganizationIntegrations,
): Promise<void> {
  await ensureDatabaseSchema();
  const pool = getPool();
  await pool.query(
    `INSERT INTO organization_integrations (
       organization_id, clickup_api_token, clickup_workspace_id, clickup_space_id, updated_at
     ) VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (organization_id)
     DO UPDATE SET
       clickup_api_token = EXCLUDED.clickup_api_token,
       clickup_workspace_id = EXCLUDED.clickup_workspace_id,
       clickup_space_id = EXCLUDED.clickup_space_id,
       updated_at = NOW()`,
    [
      config.organizationId,
      config.clickupApiToken ?? null,
      config.clickupWorkspaceId ?? null,
      config.clickupSpaceId ?? null,
    ],
  );
}
