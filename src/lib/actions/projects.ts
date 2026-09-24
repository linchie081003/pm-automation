"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { computeGapSideA, computeGapSideB } from "@/lib/domain/gap-analysis";
import { parseCalendarDate } from "@/lib/domain/scheduler-engine";
import {
  briefToProjectFields,
  buildGeneratedPreKickoffBrief,
} from "@/lib/domain/pre-kickoff-brief";
import {
  buildPhasesAndTasksFromTimeline,
  defaultSphTimeline,
  parseSphTimelineFromForm,
  parseTimelineRowsFromForm,
  rescheduleExistingPhases,
} from "@/lib/domain/sph-timeline";
import { buildClickUpPreview, createClickUpStructure } from "@/lib/domain/clickup-mapper";
import { resolveClickUpConfig } from "@/lib/integrations/clickup-config";
import { getDb, newId, saveDb } from "@/lib/data/store";
import { apiDeleteProject } from "@/lib/pdcc-api";
import { isProjectDeletable } from "@/lib/project-rules";
import {
  apiCommitWizardDraft,
  apiCreateWizardDraft,
  apiDeleteWizardDraft,
  apiGetWizardDraft,
  apiUpdateWizardDraft,
} from "@/lib/wizard-draft-api";
import type { WizardDraftPayload } from "@/lib/wizard-draft-types";
import type { Project } from "@/lib/types";

async function withWizardDraft(
  draftId: string,
  mutate: (payload: WizardDraftPayload) => void | Promise<void>,
) {
  const draft = await apiGetWizardDraft(draftId);
  await mutate(draft.payload);
  await apiUpdateWizardDraft(draftId, draft.payload);
}

function applySphTimelineToBaselineDraft(
  payload: WizardDraftPayload,
  timeline: { name: string; durationWorkingDays: number }[],
  plannedStartDate: string,
  holidays: string[],
) {
  const project = payload.project;
  const projectId = project.id;
  const startIso = String(plannedStartDate ?? "").trim();
  if (!parseCalendarDate(startIso) || timeline.length === 0) return;

  const baselineId = newId("bl-draft");
  const built = buildPhasesAndTasksFromTimeline({
    projectId,
    baselineId,
    plannedStart: startIso,
    timeline,
    holidays,
    newId,
  });

  payload.baselines = payload.baselines.filter((b) => b.projectId !== projectId);
  payload.baselines.push({
    id: baselineId,
    projectId,
    versionType: "draft",
    versionLabel: "Baseline Draft 0 (SPH Timeline)",
    totalDurationDays: built.totalWorkingDays,
    totalMd: 0,
    plannedEndDate: built.plannedEndDate,
    gapVsSphDays: computeGapSideA(project.sphDurationDays ?? 0, built.totalWorkingDays).gapDays,
    locked: false,
  });

  payload.phases = payload.phases.filter((p) => p.projectId !== projectId);
  payload.phases.push(...built.phases);
  payload.tasks = payload.tasks.filter((t) => t.projectId !== projectId);
  payload.tasks.push(...built.tasks);
  project.activeBaselineId = baselineId;
  project.gapDays = computeGapSideB(project.poDueDate, built.plannedEndDate).gapDays;
}

export async function createProjectAction() {
  const db = await getDb();
  const projectId = newId("proj");
  const project: Project = {
    id: projectId,
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
  const draft = await apiCreateWizardDraft(db.organization.id, project);
  const dbAfter = await getDb();
  const inPortfolio = dbAfter.projects.some((p) => p.id === projectId);
  // #region agent log
  fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df436c" },
    body: JSON.stringify({
      sessionId: "df436c",
      runId: "verify-wizard",
      hypothesisId: "H1",
      location: "projects.ts:createProjectAction",
      message: "After wizard draft create",
      data: { projectId, draftId: draft.draftId, inPortfolio, portfolioCount: dbAfter.projects.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  redirect(`/projects/new?draftId=${draft.draftId}&step=1`);
}

export async function cancelWizardAction(formData: FormData) {
  const draftId = String(formData.get("draftId"));
  if (draftId) {
    await apiDeleteWizardDraft(draftId);
  }
  redirect("/portfolio");
}

export async function saveSphStepAction(formData: FormData) {
  const draftId = String(formData.get("draftId"));
  await withWizardDraft(draftId, (payload) => {
    const project = payload.project;
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
    project.scopeOfWork = String(formData.get("scopeOfWork") ?? "");
    project.nonScopeOfWork = String(formData.get("nonScopeOfWork") ?? "");
    project.deliveryMethod = String(formData.get("deliveryMethod") ?? "");

    const parsed = parseSphTimelineFromForm(formData);
    payload.sphTimeline =
      parsed.length > 0
        ? parsed
        : defaultSphTimeline(project.sphDurationDays ?? 90);

    project.status = "baseline_draft";
    project.wizardStep = 2;
  });
  redirect(`/projects/new?draftId=${draftId}&step=2`);
}

export async function saveBaselineDraftAction(formData: FormData) {
  const draftId = String(formData.get("draftId"));
  const db = await getDb();
  const holidays = db.holidays.map((h) => h.holidayDate);

  await withWizardDraft(draftId, (payload) => {
    const project = payload.project;
    project.poNumber = String(formData.get("poNumber") ?? "");
    project.poDate = String(formData.get("poDate") ?? "");
    project.poDueDate = String(formData.get("poDueDate") ?? "");
    project.plannedStartDate = String(formData.get("plannedStartDate") ?? "").trim();

    if (!parseCalendarDate(project.plannedStartDate)) {
      throw new Error("Estimasi mulai project wajib diisi (format tanggal valid).");
    }

    const timelineFromForm = parseSphTimelineFromForm(formData);
    if (timelineFromForm.length > 0) {
      payload.sphTimeline = timelineFromForm;
    }
    if (!payload.sphTimeline?.length) {
      payload.sphTimeline = defaultSphTimeline(project.sphDurationDays ?? 90);
    }

    applySphTimelineToBaselineDraft(
      payload,
      payload.sphTimeline,
      project.plannedStartDate ?? "",
      holidays,
    );

    const baseline = payload.baselines.find((b) => b.id === project.activeBaselineId);
    const phases = payload.phases.filter(
      (p) => p.projectId === project.id && p.baselineId === project.activeBaselineId,
    );
    payload.preKickoffBrief = buildGeneratedPreKickoffBrief(project, phases, baseline);
    Object.assign(payload.project, briefToProjectFields(payload.preKickoffBrief));

    project.status = "pre_kickoff";
    project.wizardStep = 3;
  });

  redirect(`/projects/new?draftId=${draftId}&step=3`);
}

export async function savePreKickoffAction(formData: FormData) {
  const draftId = String(formData.get("draftId"));
  const db = await getDb();
  const holidays = db.holidays.map((h) => h.holidayDate);
  const approvedFlag = formData.get("preKickoffApproved");
  const approved =
    approvedFlag === "on" || approvedFlag === "true" || approvedFlag === "1";

  await withWizardDraft(draftId, (payload) => {
    const project = payload.project;
    const brief = payload.preKickoffBrief ?? buildGeneratedPreKickoffBrief(project, [], undefined);
    brief.background = String(formData.get("briefBackground") ?? brief.background);
    brief.scopeOfWork = String(formData.get("briefScope") ?? brief.scopeOfWork);
    brief.nonScopeOfWork = String(formData.get("briefNonScope") ?? brief.nonScopeOfWork);
    brief.orgStructure = String(formData.get("briefOrg") ?? brief.orgStructure);
    brief.deliverables = String(formData.get("briefDeliverables") ?? brief.deliverables);
    brief.nextActivities = String(formData.get("briefNext") ?? brief.nextActivities);
    payload.preKickoffBrief = brief;
    Object.assign(project, briefToProjectFields(brief));

    project.kickoffPlannedDate = String(formData.get("kickoffPlannedDate") ?? "").trim();
    const plannedStartFromForm = String(formData.get("plannedStartDate") ?? "").trim();
    if (plannedStartFromForm) {
      project.plannedStartDate = plannedStartFromForm;
    }

    const negotiated = parseTimelineRowsFromForm(formData, "preko");
    const plannedStart = String(project.plannedStartDate ?? "").trim();
    if (negotiated.length > 0) {
      if (!parseCalendarDate(plannedStart)) {
        throw new Error(
          "Estimasi mulai project belum valid. Isi tanggal mulai di form Pre-Kick Off atau kembali ke langkah Baseline Draft.",
        );
      }
      payload.sphTimeline = negotiated;
      applySphTimelineToBaselineDraft(payload, negotiated, plannedStart, holidays);
    } else if (parseCalendarDate(plannedStart) && payload.phases.length > 0) {
      const baselineId = project.activeBaselineId;
      const phases = payload.phases.filter(
        (p) => p.projectId === project.id && p.baselineId === baselineId,
      );
      const rescheduled = rescheduleExistingPhases(phases, plannedStart, holidays);
      payload.phases = payload.phases.filter(
        (p) => !(p.projectId === project.id && p.baselineId === baselineId),
      );
      payload.phases.push(...rescheduled);
      const bl = payload.baselines.find((b) => b.id === baselineId);
      if (bl) {
        const totalDays = rescheduled.reduce((a, p) => a + p.durationDays, 0);
        bl.totalDurationDays = totalDays;
        bl.plannedEndDate = rescheduled[rescheduled.length - 1]?.endDate;
        bl.gapVsSphDays = computeGapSideA(project.sphDurationDays ?? 0, totalDays).gapDays;
        project.gapDays = computeGapSideB(project.poDueDate, bl.plannedEndDate).gapDays;
      }
    }

    if (!approved) {
      throw new Error("Centang persetujuan materi Pre-Kick Off internal sebelum lanjut.");
    }
    project.preKickoffApprovedAt = new Date().toISOString();
    project.status = "kickoff";
    project.wizardStep = 4;
  });
  redirect(`/projects/new?draftId=${draftId}&step=4`);
}

export async function saveKickoffAction(formData: FormData) {
  const draftId = String(formData.get("draftId"));
  await withWizardDraft(draftId, (payload) => {
    const project = payload.project;
    if (!project.preKickoffApprovedAt) {
      throw new Error("Materi Pre-Kick Off belum disetujui.");
    }
    const projectId = project.id;
    project.kickoffActualDate = String(formData.get("kickoffActualDate") ?? "");
    project.status = "clickup_pending";
    project.wizardStep = 5;

    const draftBaseline = payload.baselines.find(
      (b) => b.projectId === projectId && b.versionType === "draft",
    );
    if (draftBaseline) {
      const bl0Id = newId("bl0");
      payload.baselines.push({
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
  });
  redirect(`/projects/new?draftId=${draftId}&step=5`);
}

export async function generateClickUpAction(formData: FormData) {
  const draftId = String(formData.get("draftId"));
  const draft = await apiGetWizardDraft(draftId);
  const project = draft.payload.project;
  const projectId = project.id;
  const phases = draft.payload.phases.filter(
    (p) => p.projectId === projectId && p.baselineId === project.activeBaselineId,
  );
  const tasks = draft.payload.tasks.filter(
    (t) => t.projectId === projectId && t.baselineId === project.activeBaselineId,
  );
  const preview = buildClickUpPreview(project.name, phases, tasks);
  const clickup = await resolveClickUpConfig(projectId);
  if (!clickup.apiToken || !clickup.spaceId) {
    redirect(`/projects/new?draftId=${draftId}&step=5&error=clickup_config`);
  }
  const { folderId } = await createClickUpStructure(
    clickup.apiToken,
    preview,
    clickup.spaceId,
  );

  await withWizardDraft(draftId, (payload) => {
    payload.project.clickupFolderId = folderId;
    payload.project.clickupFolderName = preview.folderName;
    payload.project.status = "active";
    payload.project.wizardStep = 6;
    payload.clickupLogs.unshift({
      id: newId("log"),
      projectId,
      direction: "Aplikasi → ClickUp",
      detail: `Struktur folder/list/task dibuat (${tasks.length} task)`,
      status: "success",
      createdAt: new Date().toISOString(),
    });
  });

  redirect(`/projects/new?draftId=${draftId}&step=6`);
}

export async function savePaymentTermsAction(formData: FormData) {
  const draftId = String(formData.get("draftId"));
  await withWizardDraft(draftId, (payload) => {
    const project = payload.project;
    const projectId = project.id;
    if (payload.paymentTerms.filter((p) => p.projectId === projectId).length === 0) {
      const total = project.sphTotalValue ?? 0;
      payload.paymentTerms.push(
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
  });
  redirect(`/projects/new?draftId=${draftId}&step=7`);
}

export async function finishWizardAction(formData: FormData) {
  const draftId = String(formData.get("draftId"));
  await withWizardDraft(draftId, (payload) => {
    const project = payload.project;
    project.wrPublishDay = String(formData.get("wrPublishDay") ?? "friday");
    project.wrCutoffTime = String(formData.get("wrCutoffTime") ?? "17:00");
    project.wrExportExcel = formData.get("wrExportExcel") === "on";
    project.wrExportPptx = formData.get("wrExportPptx") === "on";
    project.status = "active";
    project.wizardStep = 7;
  });
  const { projectId } = await apiCommitWizardDraft(draftId);
  const dbAfter = await getDb();
  const inPortfolio = dbAfter.projects.some((p) => p.id === projectId);
  // #region agent log
  fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df436c" },
    body: JSON.stringify({
      sessionId: "df436c",
      runId: "verify-wizard",
      hypothesisId: "H5",
      location: "projects.ts:finishWizardAction",
      message: "After wizard commit",
      data: { draftId, projectId, inPortfolio },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  revalidatePath("/portfolio");
  revalidatePath("/", "layout");
  redirect(`/projects/${projectId}/dashboard`);
}

export async function switchProjectAction(projectId: string) {
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    throw new Error("Project tidak ditemukan");
  }
  db.activeProjectId = projectId;
  await saveDb(db);
  revalidatePath("/", "layout");
  redirect(`/projects/${projectId}/dashboard`);
}

export async function setActiveProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  await switchProjectAction(projectId);
}

export async function deleteProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const db = await getDb();
  const project = db.projects.find((p) => p.id === projectId);
  const deletable = project ? isProjectDeletable(project) : false;
  // #region agent log
  fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df436c" },
    body: JSON.stringify({
      sessionId: "df436c",
      runId: "verify-wizard",
      hypothesisId: "H4",
      location: "projects.ts:deleteProjectAction",
      message: "Delete attempt",
      data: {
        projectId,
        found: Boolean(project),
        deletable,
        progressActualPct: project?.progressActualPct,
        progressPlannedPct: project?.progressPlannedPct,
        status: project?.status,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!project || !deletable) {
    throw new Error("Project ini tidak dapat dihapus (sudah ada progress atau sudah dimulai)");
  }
  await apiDeleteProject(projectId);
  revalidatePath("/portfolio");
  revalidatePath("/", "layout");
  redirect("/portfolio");
}
