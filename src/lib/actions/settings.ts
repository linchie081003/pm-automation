"use server";

import { revalidatePath } from "next/cache";
import { getDb, newId, saveDb } from "@/lib/data/store";
import { currentUserCan } from "@/lib/rbac/access";
import {
  buildDefaultGrants,
  type PermissionKey,
  ROLES_ORDER,
} from "@/lib/rbac/permissions";
import type { MemberRole, TaskTemplate } from "@/lib/types";

function ensureGrantRows(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db.rolePermissionGrants?.length) {
    db.rolePermissionGrants = buildDefaultGrants().map((g) => ({
      role: g.role,
      permissionKey: g.permissionKey,
      allowed: g.allowed,
    }));
  }
}

export async function inviteMemberAction(formData: FormData) {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.users"))) {
    throw new Error("Tidak punya akses kelola pengguna");
  }
  db.members.push({
    id: newId("mem"),
    organizationId: db.organization.id,
    email: String(formData.get("email")),
    fullName: String(formData.get("fullName")),
    role: formData.get("role") as MemberRole,
    party: (formData.get("party") as "internal") ?? "internal",
    status: "invited",
  });
  await saveDb(db);
  revalidatePath("/settings/users");
}

export async function setMemberStatusAction(formData: FormData) {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.users"))) {
    throw new Error("Tidak punya akses kelola pengguna");
  }
  const memberId = String(formData.get("memberId"));
  const status = String(formData.get("status")) as "active" | "inactive";
  const member = db.members.find((m) => m.id === memberId);
  if (!member) return;
  if (member.id === db.currentUserId && status === "inactive") {
    throw new Error("Tidak dapat menonaktifkan akun yang sedang dipakai");
  }
  member.status = status;
  await saveDb(db);
  revalidatePath("/settings/users");
}

export async function deleteMemberAction(formData: FormData) {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.users"))) {
    throw new Error("Tidak punya akses kelola pengguna");
  }
  const memberId = String(formData.get("memberId"));
  if (memberId === db.currentUserId) {
    throw new Error("Tidak dapat menghapus akun sendiri");
  }
  const member = db.members.find((m) => m.id === memberId);
  if (!member) return;
  const assigned = db.projects.some((p) => p.pmMemberId === memberId);
  if (assigned) {
    throw new Error("User masih ditugaskan sebagai PM pada project — ubah PM terlebih dahulu");
  }
  db.members = db.members.filter((m) => m.id !== memberId);
  await saveDb(db);
  revalidatePath("/settings/users");
}

export async function updateMemberRoleAction(formData: FormData) {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.users"))) {
    throw new Error("Tidak punya akses kelola pengguna");
  }
  const memberId = String(formData.get("memberId"));
  const role = formData.get("role") as MemberRole;
  const member = db.members.find((m) => m.id === memberId);
  if (member && ROLES_ORDER.includes(role)) {
    member.role = role;
    await saveDb(db);
  }
  revalidatePath("/settings/users");
}

export async function setRolePermissionAction(
  role: MemberRole,
  permissionKey: PermissionKey,
  allowed: boolean,
) {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.roles"))) {
    throw new Error("Tidak punya akses kelola role");
  }
  if (role === "delivery_manager") return;

  ensureGrantRows(db);
  const grants = db.rolePermissionGrants!;
  const existing = grants.find((g) => g.role === role && g.permissionKey === permissionKey);
  if (existing) {
    existing.allowed = allowed;
  } else {
    grants.push({ role, permissionKey, allowed });
  }
  await saveDb(db);
  revalidatePath("/settings/roles");
}

export async function resetRolePermissionsAction() {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.roles"))) {
    throw new Error("Tidak punya akses kelola role");
  }
  db.rolePermissionGrants = buildDefaultGrants().map((g) => ({
    role: g.role,
    permissionKey: g.permissionKey,
    allowed: g.allowed,
  }));
  await saveDb(db);
  revalidatePath("/settings/roles");
}

export async function addPositionRateAction(formData: FormData) {
  const db = await getDb();
  db.positionRates.push({
    id: newId("rate"),
    organizationId: db.organization.id,
    positionName: String(formData.get("positionName")),
    ratePerMd: Number(formData.get("ratePerMd")),
    effectiveFrom: String(formData.get("effectiveFrom")),
  });
  await saveDb(db);
  revalidatePath("/settings/resource-rates");
}

export async function addHolidayAction(formData: FormData) {
  const db = await getDb();
  db.holidays.push({
    id: newId("h"),
    organizationId: db.organization.id,
    holidayDate: String(formData.get("holidayDate")),
    label: String(formData.get("label")),
    holidayType: String(formData.get("holidayType") ?? "national"),
    projectId: String(formData.get("projectId") ?? "") || undefined,
  });
  await saveDb(db);
  revalidatePath("/projects/new");
}

export async function addTemplatePhaseAction(formData: FormData) {
  const templateId = String(formData.get("templateId"));
  const db = await getDb();
  const template = db.templates.find((t) => t.id === templateId);
  if (!template) return;
  template.phases.push({
    id: newId("tp"),
    name: String(formData.get("name")),
    weightPct: Number(formData.get("weightPct")),
    defaultDurationDays: Number(formData.get("durationDays")),
    sortOrder: template.phases.length,
    tasks: [],
  });
  await saveDb(db);
  revalidatePath("/settings/templates");
}

function cloneTemplate(source: TaskTemplate, organizationId: string): TaskTemplate {
  const newTemplateId = newId("tpl");
  return {
    id: newTemplateId,
    organizationId,
    name: `${source.name} (salinan)`,
    projectType: source.projectType,
    methodology: source.methodology,
    isActive: true,
    phases: source.phases.map((ph) => {
      const phaseId = newId("tp");
      return {
        ...ph,
        id: phaseId,
        tasks: ph.tasks.map((t) => ({
          ...t,
          id: newId("tt"),
        })),
      };
    }),
  };
}

export async function createTemplateAction(formData: FormData) {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.templates"))) {
    throw new Error("Tidak punya akses template");
  }
  db.templates.push({
    id: newId("tpl"),
    organizationId: db.organization.id,
    name: String(formData.get("name") ?? "Template Baru"),
    projectType: String(formData.get("projectType") ?? "Custom Application"),
    methodology: String(formData.get("methodology") ?? "Agile"),
    isActive: true,
    phases: [],
  });
  await saveDb(db);
  revalidatePath("/settings/templates");
}

export async function copyTemplateAction(formData: FormData) {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.templates"))) {
    throw new Error("Tidak punya akses template");
  }
  const templateId = String(formData.get("templateId"));
  const source = db.templates.find((t) => t.id === templateId);
  if (!source) return;
  db.templates.push(cloneTemplate(source, db.organization.id));
  await saveDb(db);
  revalidatePath("/settings/templates");
}

export async function setTemplateActiveAction(formData: FormData) {
  const db = await getDb();
  if (!(await currentUserCan(db, "settings.templates"))) {
    throw new Error("Tidak punya akses template");
  }
  const templateId = String(formData.get("templateId"));
  const active = formData.get("active") === "true";
  const template = db.templates.find((t) => t.id === templateId);
  if (template) {
    template.isActive = active;
    await saveDb(db);
  }
  revalidatePath("/settings/templates");
}

export async function deleteTemplatePhaseAction(formData: FormData) {
  const db = await getDb();
  const templateId = String(formData.get("templateId"));
  const phaseId = String(formData.get("phaseId"));
  const template = db.templates.find((t) => t.id === templateId);
  if (!template) return;
  template.phases = template.phases.filter((p) => p.id !== phaseId);
  await saveDb(db);
  revalidatePath("/settings/templates");
}

export async function addTemplateTaskAction(formData: FormData) {
  const db = await getDb();
  const templateId = String(formData.get("templateId"));
  const phaseId = String(formData.get("phaseId"));
  const template = db.templates.find((t) => t.id === templateId);
  const phase = template?.phases.find((p) => p.id === phaseId);
  if (!phase) return;
  phase.tasks.push({
    id: newId("tt"),
    name: String(formData.get("name") ?? "Task baru"),
    isMilestone: formData.get("isMilestone") === "on",
    defaultMd: Number(formData.get("defaultMd") ?? 0),
    sortOrder: phase.tasks.length,
  });
  await saveDb(db);
  revalidatePath("/settings/templates");
}

export async function deleteTemplateTaskAction(formData: FormData) {
  const db = await getDb();
  const templateId = String(formData.get("templateId"));
  const phaseId = String(formData.get("phaseId"));
  const taskId = String(formData.get("taskId"));
  const template = db.templates.find((t) => t.id === templateId);
  const phase = template?.phases.find((p) => p.id === phaseId);
  if (!phase) return;
  phase.tasks = phase.tasks.filter((t) => t.id !== taskId);
  await saveDb(db);
  revalidatePath("/settings/templates");
}
