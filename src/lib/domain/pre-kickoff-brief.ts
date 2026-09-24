import type { PreKickoffBrief } from "@/lib/wizard-draft-types";
import type { BaselineVersion, Project, ProjectPhase } from "@/lib/types";

export function buildGeneratedPreKickoffBrief(
  project: Project,
  phases: ProjectPhase[],
  baseline?: BaselineVersion,
): PreKickoffBrief {
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  const timelineLines = sorted.map(
    (ph) =>
      `• ${ph.name}: ${ph.durationDays} hari kerja${ph.startDate && ph.endDate ? ` (${ph.startDate} → ${ph.endDate})` : ""}`,
  );
  const deliverables = sorted.map((ph) => `• ${ph.name} — milestone selesai`).join("\n");
  const nextActivities =
    sorted.length > 0
      ? `1. Kick Off dengan ${project.customerName || "pelanggan"}\n2. ${sorted[0]?.name ?? "Fase awal"}\n3. Sinkronisasi task di ClickUp`
      : "1. Kick Off\n2. Pelaksanaan sesuai baseline draft";

  return {
    background: `Project ${project.name} untuk ${project.customerName || "pelanggan"}. Referensi SPH ${project.sphNumber ?? "—"} (${project.sphDate ?? "—"}). Durasi kontrak SPH: ${project.sphDurationDays ?? "—"} hari kerja.`,
    scopeOfWork: project.scopeOfWork ?? "",
    nonScopeOfWork: project.nonScopeOfWork ?? "",
    orgStructure: `• PM: internal\n• PIC Pelanggan: ${project.customerContact ?? "—"}\n• Tim delivery: sesuai struktur proyek`,
    deliverables: deliverables || "• Deliverable utama sesuai SPH",
    nextActivities,
  };
}

export function briefToProjectFields(brief: PreKickoffBrief): Pick<
  Project,
  | "scopeOfWork"
  | "nonScopeOfWork"
  | "preKickoffBackground"
  | "preKickoffOrgStructure"
  | "preKickoffDeliverables"
  | "preKickoffNextActivities"
> {
  return {
    scopeOfWork: brief.scopeOfWork,
    nonScopeOfWork: brief.nonScopeOfWork,
    preKickoffBackground: brief.background,
    preKickoffOrgStructure: brief.orgStructure,
    preKickoffDeliverables: brief.deliverables,
    preKickoffNextActivities: brief.nextActivities,
  };
}

export function timelineSummaryForBrief(phases: ProjectPhase[], plannedEnd?: string): string {
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  const total = sorted.reduce((a, p) => a + p.durationDays, 0);
  const lines = sorted.map(
    (ph) => `${ph.name} | ${ph.durationDays} hkr | ${ph.startDate ?? "?"} – ${ph.endDate ?? "?"}`,
  );
  return [`Total ${total} hari kerja`, plannedEnd ? `Target selesai: ${plannedEnd}` : "", ...lines]
    .filter(Boolean)
    .join("\n");
}
