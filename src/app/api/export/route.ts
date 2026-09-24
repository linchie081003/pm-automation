import { NextResponse } from "next/server";
import {
  buildKickoffDeck,
  buildSchedulerWorkbook,
  buildTaskRecapWorkbook,
} from "@/lib/domain/exports";
import { getDb } from "@/lib/data/store";
import { apiGetWizardDraftByProjectId } from "@/lib/wizard-draft-api";
import type { Project } from "@/lib/types";
import type { ProjectPhase, ProjectTask } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const projectId = searchParams.get("projectId");
  if (!type || !projectId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const db = await getDb();
  let project = db.projects.find((p) => p.id === projectId) as Project | undefined;
  let phases: ProjectPhase[] = [];
  let tasks: ProjectTask[] = [];

  if (project) {
    phases = db.phases.filter(
      (p) => p.projectId === projectId && p.baselineId === project!.activeBaselineId,
    );
    tasks = db.tasks.filter(
      (t) => t.projectId === projectId && t.baselineId === project!.activeBaselineId,
    );
  } else {
    const draft = await apiGetWizardDraftByProjectId(projectId);
    if (!draft) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const draftProject = draft.payload.project;
    project = draftProject;
    phases = draft.payload.phases.filter(
      (p) => p.projectId === projectId && p.baselineId === draftProject.activeBaselineId,
    );
    tasks = draft.payload.tasks.filter(
      (t) => t.projectId === projectId && t.baselineId === draftProject.activeBaselineId,
    );
  }

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (type === "scheduler") {
    const buffer = await buildSchedulerWorkbook(project, phases, tasks);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="scheduler-${projectId}.xlsx"`,
      },
    });
  }

  if (type === "kickoff-pptx") {
    const buffer = await buildKickoffDeck(project, phases, project.gapDays);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="kickoff-${projectId}.pptx"`,
      },
    });
  }

  if (type === "task-recap") {
    const phaseNames = Object.fromEntries(phases.map((p) => [p.id, p.name]));
    const buffer = await buildTaskRecapWorkbook(project.name, tasks, phaseNames);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="task-recap-${projectId}.xlsx"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

/** Beberapa klien/navigasi mengirim POST ke URL unduh — layani sama seperti GET. */
export async function POST(request: Request) {
  return GET(request);
}
