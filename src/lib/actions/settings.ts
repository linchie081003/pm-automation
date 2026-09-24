"use server";

import { revalidatePath } from "next/cache";
import { getDb, newId, saveDb } from "@/lib/data/store";
import type { MemberRole } from "@/lib/types";

export async function inviteMemberAction(formData: FormData) {
  const db = await getDb();
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
