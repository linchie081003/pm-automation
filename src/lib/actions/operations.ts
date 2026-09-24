"use server";

import { revalidatePath } from "next/cache";
import { getDb, newId, saveDb } from "@/lib/data/store";

export async function approveRebaselineFormAction(formData: FormData) {
  await approveRebaselineInternalAction(String(formData.get("projectId")));
}

export async function approveRebaselineInternalAction(projectId: string) {
  const db = await getDb();
  const draft = db.baselines.find(
    (b) => b.projectId === projectId && b.versionType === "rebaseline" && !b.approvedCustomerAt,
  );
  if (draft) {
    draft.approvedInternalAt = new Date().toISOString();
  }
  await saveDb(db);
  revalidatePath(`/projects/${projectId}/baseline`);
}

export async function linkDocumentDriveAction(formData: FormData) {
  const docId = String(formData.get("docId"));
  const db = await getDb();
  const doc = db.documents.find((d) => d.id === docId);
  if (doc) {
    doc.driveUrl = String(formData.get("driveUrl"));
    doc.driveFileId = String(formData.get("driveFileId") ?? "linked");
  }
  await saveDb(db);
  revalidatePath(`/projects/${String(formData.get("projectId"))}/documents`);
}

export async function submitTaskAdditionAction(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const path = formData.get("path") as "jalur_a" | "jalur_b";
  const db = await getDb();
  db.taskAdditions.push({
    id: newId("add"),
    projectId,
    path,
    taskName: String(formData.get("taskName")),
    phaseName: String(formData.get("phaseName")),
    estMd: Number(formData.get("estMd")),
    reasonCategory: String(formData.get("reasonCategory")),
    reasonText: String(formData.get("reasonText")),
    submittedBy: db.currentUserId,
    status: "pending",
  });
  await saveDb(db);
  revalidatePath(`/projects/${projectId}/tasks/add`);
}

export async function approveAdditionFormAction(formData: FormData) {
  await approveTaskAdditionAction(String(formData.get("additionId")));
}

export async function approveTaskAdditionAction(additionId: string) {
  const db = await getDb();
  const add = db.taskAdditions.find((a) => a.id === additionId);
  if (!add) return;
  add.status = "approved";
  add.approvedBy = db.currentUserId;
  const project = db.projects.find((p) => p.id === add.projectId);
  if (project?.activeBaselineId && add.path === "jalur_b") {
    const phase = db.phases.find(
      (p) => p.projectId === add.projectId && p.name === add.phaseName,
    );
    db.tasks.push({
      id: newId("task"),
      projectId: add.projectId,
      baselineId: project.activeBaselineId,
      phaseId: phase?.id ?? db.phases[0]?.id ?? "",
      name: add.taskName,
      isMilestone: false,
      estMdBaseline0: add.estMd ?? 0,
      estMdCurrent: add.estMd ?? 0,
      actualMd: 0,
      status: "to_do",
      internalTaskId: newId("int"),
      sortOrder: 99,
    });
  }
  await saveDb(db);
  revalidatePath(`/projects/${add.projectId}/task-recap`);
}

export async function toggleClosingFormAction(formData: FormData) {
  await toggleClosingItemAction(String(formData.get("itemId")));
}

export async function toggleClosingItemAction(itemId: string) {
  const db = await getDb();
  const item = db.closingChecklist.find((c) => c.id === itemId);
  if (item) item.completed = !item.completed;
  await saveDb(db);
  revalidatePath(`/projects/${item?.projectId}/closing`);
}

export async function markReadFormAction(formData: FormData) {
  await markNotificationReadAction(String(formData.get("id")));
}

export async function markNotificationReadAction(id: string) {
  const db = await getDb();
  const n = db.notifications.find((x) => x.id === id);
  if (n) n.read = true;
  await saveDb(db);
  revalidatePath("/notifications");
}

export async function syncClickUpFormAction(formData: FormData) {
  await runClickUpSyncAction(String(formData.get("projectId")));
}

export async function runClickUpSyncAction(projectId: string) {
  const db = await getDb();
  db.clickupLogs.unshift({
    id: newId("log"),
    projectId,
    direction: "ClickUp → Aplikasi",
    detail: "Status, Time Tracked, komentar (sync manual)",
    status: "success",
    createdAt: new Date().toISOString(),
  });
  await saveDb(db);
  revalidatePath(`/projects/${projectId}/clickup`);
}

export async function classifyUnclassifiedAction(taskId: string) {
  const db = await getDb();
  db.unclassifiedTasks = db.unclassifiedTasks.filter((t) => t.id !== taskId);
  await saveDb(db);
  revalidatePath("/projects");
}
