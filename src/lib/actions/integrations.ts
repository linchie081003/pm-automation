"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/data/store";
import { apiLoadIntegrations, apiSaveIntegrations } from "@/lib/pdcc-api";

export async function saveClickUpIntegrationAction(formData: FormData) {
  const db = await getDb();
  const existing = await apiLoadIntegrations(db.organization.id);
  const tokenRaw = String(formData.get("clickupApiToken") ?? "").trim();
  const workspaceId = String(formData.get("clickupWorkspaceId") ?? "").trim();
  const spaceId = String(formData.get("clickupSpaceId") ?? "").trim();

  await apiSaveIntegrations({
    organizationId: db.organization.id,
    clickupApiToken: tokenRaw || existing.clickupApiToken,
    clickupWorkspaceId: workspaceId || undefined,
    clickupSpaceId: spaceId || undefined,
  });

  revalidatePath("/settings/integrations");
}

export async function saveProjectClickUpIntegrationAction(formData: FormData) {
  const db = await getDb();
  const projectId = String(formData.get("projectId"));
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    throw new Error("Project tidak ditemukan");
  }
  const tokenRaw = String(formData.get("clickupApiToken") ?? "").trim();
  project.clickupWorkspaceId = String(formData.get("clickupWorkspaceId") ?? "").trim() || undefined;
  project.clickupSpaceId = String(formData.get("clickupSpaceId") ?? "").trim() || undefined;
  if (tokenRaw) {
    project.clickupApiToken = tokenRaw;
  } else if (formData.get("clearToken") === "on") {
    project.clickupApiToken = undefined;
  }
  const { saveDb } = await import("@/lib/data/store");
  await saveDb(db);
  revalidatePath(`/projects/${projectId}/clickup`);
}
