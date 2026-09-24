"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { schedulePhases } from "@/lib/domain/scheduler-engine";
import { computeGapSideA, computeGapSideB } from "@/lib/domain/gap-analysis";
import { buildClickUpPreview, createClickUpStructure } from "@/lib/domain/clickup-mapper";
import { getDb, newId, saveDb } from "@/lib/data/store";
import type { Project, ProjectPhase, ProjectTask } from "@/lib/types";

export async function createProjectAction() {
  const db = await getDb();
  const id = newId("proj");
  const project: Project = {
    id,
    organizationId: db.organization.id,
    name: "Project Baru",
    customerName: "",
    status: "draft_sph",
    wizardStep: 1,
    progressActualPct: 0,
    progressPlannedPct: 0,
    gapDays: 0,
    ragStatus: "on_track",
    wrPublishDay: "friday",
    wrCutoffTime: "17:00",
    wrExportExcel: true,
    wrExportPptx: true,
  };
  db.projects.push(project);
  db.activeProjectId = id;
  await saveDb(db);
  redirect(`/projects/new?projectId=${id}&step=1`);
}

export async function saveSphStepAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return;
  project.name = String(formData.get("name") ?? project.name);
  project.customerName = String(formData.get("customerName") ?? "");
  project.customerContact = String(formData.get("customerContact") ?? "");
  project.sphNumber = String(formData.get("sphNumber") ?? "");
  project.sphDate = String(formData.get("sphDate") ?? "");
  project.sphDurationDays = Number(formData.get("sphDurationDays") ?? 0);
  project.sphImplementationValue = Number(formData.get("sphImplementationValue") ?? 0);
  project.sphTrainingValue = Number(formData.get("sphTrainingValue") ?? 0);
  project.sphTotalValue =
    (project.sphImplementationValue ?? 0) + (project.sphTrainingValue ?? 0);
  project.sphBucketMd = Number(formData.get("sphBucketMd") ?? 0);
  project.status = "baseline_draft";
  project.wizardStep = 2;
  await saveDb(db);
  revalidatePath(`/projects/new`);
  redirect(`/projects/new?projectId=${projectId}&step=2`);
}

export async function saveBaselineDraftAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const templateId = String(formData.get("templateId"));
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  const template = db.templates.find((t) => t.id === templateId);
  if (!project || !template) return;

  project.poNumber = String(formData.get("poNumber") ?? "");
  project.poDate = String(formData.get("poDate") ?? "");
  project.poDueDate = String(formData.get("poDueDate") ?? "");
  project.plannedStartDate = String(formData.get("plannedStartDate") ?? "");
  project.templateId = templateId;

  const baselineId = newId("bl-draft");
  const holidays = db.holidays.map((h) => h.holidayDate);
  const draftPhases: ProjectPhase[] = template.phases.map((ph) => ({
    id: newId("ph"),
    baselineId,
    projectId,
    name: ph.name,
    weightPct: ph.weightPct,
    durationDays: ph.defaultDurationDays,
    sortOrder: ph.sortOrder,
  }));

  if (project.plannedStartDate) {
    const scheduled = schedulePhases(
      project.plannedStartDate,
      draftPhases.map((p) => ({
        id: p.id,
        name: p.name,
        durationDays: p.durationDays,
        sortOrder: p.sortOrder,
      })),
      holidays,
    );
    for (const s of scheduled) {
      const ph = draftPhases.find((p) => p.id === s.phaseId);
      if (ph) {
        ph.startDate = s.startDate;
        ph.endDate = s.endDate;
      }
    }
  }

  const totalDays = draftPhases.reduce((a, p) => a + p.durationDays, 0);
  const lastEnd = draftPhases[draftPhases.length - 1]?.endDate;
  const totalMd = template.phases.reduce(
    (acc, ph) => acc + ph.tasks.reduce((s, t) => s + t.defaultMd, 0),
    0,
  );

  db.baselines.push({
    id: baselineId,
    projectId,
    versionType: "draft",
    versionLabel: "Baseline Draft",
    totalDurationDays: totalDays,
    totalMd,
    plannedEndDate: lastEnd,
    gapVsSphDays: computeGapSideA(project.sphDurationDays ?? 0, totalDays).gapDays,
    locked: false,
  });

  db.phases = db.phases.filter((p) => p.projectId !== projectId || p.baselineId !== baselineId);
  db.phases.push(...draftPhases);

  const tasks: ProjectTask[] = [];
  for (const ph of template.phases) {
    const phase = draftPhases.find((p) => p.name === ph.name);
    if (!phase) continue;
    for (const tt of ph.tasks) {
      tasks.push({
        id: newId("task"),
        projectId,
        baselineId,
        phaseId: phase.id,
        name: tt.name,
        isMilestone: tt.isMilestone,
        estMdBaseline0: tt.defaultMd,
        estMdCurrent: tt.defaultMd,
        actualMd: 0,
        status: "to_do",
        internalTaskId: newId("int"),
        sortOrder: tt.sortOrder,
      });
    }
  }
  db.tasks = db.tasks.filter((t) => t.baselineId !== baselineId);
  db.tasks.push(...tasks);

  project.activeBaselineId = baselineId;
  project.gapDays = computeGapSideB(project.poDueDate, lastEnd).gapDays;
  project.status = "pre_kickoff";
  project.wizardStep = 3;
  await saveDb(db);
  redirect(`/projects/new?projectId=${projectId}&step=3`);
}

export async function savePreKickoffAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return;
  project.kickoffPlannedDate = String(formData.get("kickoffPlannedDate") ?? "");
  project.status = "kickoff";
  project.wizardStep = 4;
  await saveDb(db);
  redirect(`/projects/new?projectId=${projectId}&step=4`);
}

export async function saveKickoffAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return;
  project.kickoffActualDate = String(formData.get("kickoffActualDate") ?? "");
  project.status = "clickup_pending";
  project.wizardStep = 5;

  const draftBaseline = db.baselines.find(
    (b) => b.projectId === projectId && b.versionType === "draft",
  );
  if (draftBaseline) {
    const bl0Id = newId("bl0");
    db.baselines.push({
      ...draftBaseline,
      id: bl0Id,
      versionType: "baseline_0",
      versionLabel: "Baseline 0",
      approvedInternalAt: new Date().toISOString(),
      approvedCustomerAt: new Date().toISOString(),
      locked: true,
    });
    project.activeBaselineId = bl0Id;
  }
  await saveDb(db);
  redirect(`/projects/new?projectId=${projectId}&step=5`);
}

export async function generateClickUpAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return;
  const phases = db.phases.filter(
    (p) => p.projectId === projectId && p.baselineId === project.activeBaselineId,
  );
  const tasks = db.tasks.filter(
    (t) => t.projectId === projectId && t.baselineId === project.activeBaselineId,
  );
  const preview = buildClickUpPreview(project.name, phases, tasks);
  const token = process.env.CLICKUP_API_TOKEN;
  const { folderId } = await createClickUpStructure(
    token,
    preview,
    process.env.CLICKUP_SPACE_ID,
  );
  project.clickupFolderId = folderId;
  project.clickupFolderName = preview.folderName;
  project.status = "active";
  project.wizardStep = 6;
  db.clickupLogs.unshift({
    id: newId("log"),
    projectId,
    direction: "Aplikasi → ClickUp",
    detail: `Struktur folder/list/task dibuat (${tasks.length} task)`,
    status: "success",
    createdAt: new Date().toISOString(),
  });
  await saveDb(db);
  redirect(`/projects/new?projectId=${projectId}&step=6`);
}

export async function savePaymentTermsAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return;
  if (db.paymentTerms.filter((p) => p.projectId === projectId).length === 0) {
    const total = project.sphTotalValue ?? 0;
    db.paymentTerms.push(
      {
        id: newId("pay"),
        projectId,
        milestoneName: "PO & Kick Off",
        pct: 25,
        amount: total * 0.25,
        plannedDate: project.kickoffActualDate,
        status: "planned",
      },
      {
        id: newId("pay"),
        projectId,
        milestoneName: "UAT",
        pct: 50,
        amount: total * 0.5,
        status: "pending",
      },
      {
        id: newId("pay"),
        projectId,
        milestoneName: "BAST Go Live",
        pct: 25,
        amount: total * 0.25,
        status: "pending",
      },
    );
  }
  project.wizardStep = 7;
  await saveDb(db);
  redirect(`/projects/new?projectId=${projectId}&step=7`);
}

export async function finishWizardAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return;
  project.wrPublishDay = String(formData.get("wrPublishDay") ?? "friday");
  project.wrCutoffTime = String(formData.get("wrCutoffTime") ?? "17:00");
  project.wrExportExcel = formData.get("wrExportExcel") === "on";
  project.wrExportPptx = formData.get("wrExportPptx") === "on";
  project.status = "active";
  project.wizardStep = 7;
  db.activeProjectId = projectId;
  await saveDb(db);
  redirect(`/projects/${projectId}/dashboard`);
}

export async function setActiveProjectAction(projectId: string) {
  const db = await getDb();
  db.activeProjectId = projectId;
  await saveDb(db);
  revalidatePath("/");
}
