"use server";

import { revalidatePath } from "next/cache";
import {
  loadIntegrations,
  saveIntegrations,
} from "@/backend/repositories/pdcc-repository";
import { getDb } from "@/lib/data/store";

export async function saveClickUpIntegrationAction(formData: FormData) {
  const db = await getDb();
  const existing = await loadIntegrations(db.organization.id);
  const tokenRaw = String(formData.get("clickupApiToken") ?? "").trim();
  const workspaceId = String(formData.get("clickupWorkspaceId") ?? "").trim();
  const spaceId = String(formData.get("clickupSpaceId") ?? "").trim();

  await saveIntegrations({
    organizationId: db.organization.id,
    clickupApiToken: tokenRaw || existing.clickupApiToken,
    clickupWorkspaceId: workspaceId || undefined,
    clickupSpaceId: spaceId || undefined,
  });

  revalidatePath("/settings/integrations");
}
