import { NextResponse } from "next/server";
import {
  loadIntegrations,
  saveIntegrations,
} from "@/backend/repositories/pdcc-repository";
import { getDb } from "@/lib/data/store";

export async function GET() {
  const db = await getDb();
  const config = await loadIntegrations(db.organization.id);
  return NextResponse.json({
    clickupWorkspaceId: config.clickupWorkspaceId ?? "",
    clickupSpaceId: config.clickupSpaceId ?? "",
    hasClickUpToken: Boolean(config.clickupApiToken),
  });
}

export async function PUT(request: Request) {
  const db = await getDb();
  const body = (await request.json()) as {
    clickupApiToken?: string;
    clickupWorkspaceId?: string;
    clickupSpaceId?: string;
  };
  await saveIntegrations({
    organizationId: db.organization.id,
    clickupApiToken: body.clickupApiToken?.trim() || undefined,
    clickupWorkspaceId: body.clickupWorkspaceId?.trim() || undefined,
    clickupSpaceId: body.clickupSpaceId?.trim() || undefined,
  });
  return NextResponse.json({ ok: true });
}
