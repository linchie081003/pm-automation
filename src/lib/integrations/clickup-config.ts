import { getDb } from "@/lib/data/store";
import { apiLoadIntegrations } from "@/lib/pdcc-api";

export interface ClickUpRuntimeConfig {
  apiToken?: string;
  workspaceId?: string;
  spaceId?: string;
  source: "project" | "database" | "env" | "none";
}

export async function resolveClickUpConfig(projectId?: string): Promise<ClickUpRuntimeConfig> {
  const db = await getDb();

  if (projectId) {
    const project = db.projects.find((p) => p.id === projectId);
    if (project?.clickupApiToken?.trim()) {
      return {
        apiToken: project.clickupApiToken.trim(),
        workspaceId: project.clickupWorkspaceId?.trim(),
        spaceId: project.clickupSpaceId?.trim(),
        source: "project",
      };
    }
  }

  const fromDb = await apiLoadIntegrations(db.organization.id);
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
