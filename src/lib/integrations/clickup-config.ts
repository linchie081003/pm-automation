import { loadIntegrations } from "@/backend/repositories/pdcc-repository";
import { getDb } from "@/lib/data/store";

export interface ClickUpRuntimeConfig {
  apiToken?: string;
  workspaceId?: string;
  spaceId?: string;
  source: "database" | "env" | "none";
}

export async function resolveClickUpConfig(): Promise<ClickUpRuntimeConfig> {
  const db = await getDb();
  const fromDb = await loadIntegrations(db.organization.id);
  if (fromDb.clickupApiToken?.trim()) {
    return {
      apiToken: fromDb.clickupApiToken.trim(),
      workspaceId: fromDb.clickupWorkspaceId?.trim(),
      spaceId: fromDb.clickupSpaceId?.trim(),
      source: "database",
    };
  }
  const envToken = process.env.CLICKUP_API_TOKEN?.trim();
  if (envToken) {
    return {
      apiToken: envToken,
      workspaceId: process.env.CLICKUP_WORKSPACE_ID?.trim(),
      spaceId:
        process.env.CLICKUP_SPACE_ID?.trim() ??
        process.env.CLICKUP_WORKSPACE_ID?.trim(),
      source: "env",
    };
  }
  return { source: "none" };
}
