import type { Project } from "@/lib/types";

/** Hanya project draft tanpa progress yang boleh dihapus dari portfolio. */
export function isProjectDeletable(project: Project): boolean {
  const actual = Number(project.progressActualPct);
  const planned = Number(project.progressPlannedPct);
  if (actual > 0 || planned > 0) return false;
  if (project.status !== "draft_sph") return false;
  if (project.wizardStep > 1) return false;
  if (project.activeBaselineId) return false;
  if (project.kickoffActualDate) return false;
  return true;
}
