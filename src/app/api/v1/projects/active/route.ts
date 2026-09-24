import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/data/store";

export async function GET() {
  const db = await getDb();
  return NextResponse.json({
    activeProjectId: db.activeProjectId ?? db.projects[0]?.id ?? null,
    projects: db.projects.map((p) => ({
      id: p.id,
      name: p.name,
      customerName: p.customerName,
      status: p.status,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { projectId?: string };
  if (!body.projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  const db = await getDb();
  const project = db.projects.find((p) => p.id === body.projectId);
  if (!project) {
    return NextResponse.json({ error: "project not found" }, { status: 404 });
  }
  db.activeProjectId = body.projectId;
  await saveDb(db);
  // #region agent log
  fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "df436c",
    },
    body: JSON.stringify({
      sessionId: "df436c",
      location: "api/v1/projects/active:POST",
      message: "active project switched via API",
      data: { projectId: body.projectId },
      timestamp: Date.now(),
      hypothesisId: "H-SWITCH",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion
  return NextResponse.json({ activeProjectId: body.projectId });
}
