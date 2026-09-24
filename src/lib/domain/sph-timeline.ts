import { schedulePhases } from "@/lib/domain/scheduler-engine";
import type { ProjectPhase, ProjectTask } from "@/lib/types";

export interface SphTimelineRow {
  name: string;
  durationWorkingDays: number;
}

export function defaultSphTimeline(totalWorkingDays: number): SphTimelineRow[] {
  const total = Math.max(totalWorkingDays, 1);
  if (total <= 30) {
    return [{ name: "Pelaksanaan (SPH)", durationWorkingDays: total }];
  }
  const a = Math.round(total * 0.15);
  const b = Math.round(total * 0.55);
  const c = Math.round(total * 0.2);
  const d = total - a - b - c;
  return [
    { name: "Inception & Perencanaan", durationWorkingDays: a },
    { name: "Build & Konfigurasi", durationWorkingDays: b },
    { name: "UAT & Stabilisasi", durationWorkingDays: c },
    { name: "Go Live & Handover", durationWorkingDays: Math.max(d, 1) },
  ];
}

export function parseTimelineRowsFromForm(
  formData: FormData,
  fieldPrefix = "timeline",
): SphTimelineRow[] {
  const rows: SphTimelineRow[] = [];
  for (let i = 0; i < 8; i++) {
    const name = String(formData.get(`${fieldPrefix}Name_${i}`) ?? "").trim();
    const days = Number(formData.get(`${fieldPrefix}Days_${i}`) ?? 0);
    if (name && days > 0) rows.push({ name, durationWorkingDays: days });
  }
  return rows;
}

export function parseSphTimelineFromForm(formData: FormData): SphTimelineRow[] {
  return parseTimelineRowsFromForm(formData, "timeline");
}

export function buildPhasesAndTasksFromTimeline(opts: {
  projectId: string;
  baselineId: string;
  plannedStart: string;
  timeline: SphTimelineRow[];
  holidays: string[];
  newId: (prefix: string) => string;
}): { phases: ProjectPhase[]; tasks: ProjectTask[]; totalWorkingDays: number; plannedEndDate?: string } {
  const totalWorkingDays = opts.timeline.reduce((a, r) => a + r.durationWorkingDays, 0);
  const draftPhases: ProjectPhase[] = opts.timeline.map((row, idx) => ({
    id: opts.newId("ph"),
    baselineId: opts.baselineId,
    projectId: opts.projectId,
    name: row.name,
    weightPct: totalWorkingDays > 0 ? Math.round((row.durationWorkingDays / totalWorkingDays) * 100) : 0,
    durationDays: row.durationWorkingDays,
    sortOrder: idx,
  }));

  const scheduled = schedulePhases(
    opts.plannedStart,
    draftPhases.map((p) => ({
      id: p.id,
      name: p.name,
      durationDays: p.durationDays,
      sortOrder: p.sortOrder,
    })),
    opts.holidays,
  );
  for (const s of scheduled) {
    const ph = draftPhases.find((p) => p.id === s.phaseId);
    if (ph) {
      ph.startDate = s.startDate;
      ph.endDate = s.endDate;
    }
  }

  const tasks: ProjectTask[] = draftPhases.map((ph, idx) => ({
    id: opts.newId("task"),
    projectId: opts.projectId,
    baselineId: opts.baselineId,
    phaseId: ph.id,
    name: `Milestone — ${ph.name}`,
    isMilestone: true,
    estMdBaseline0: 0,
    estMdCurrent: 0,
    actualMd: 0,
    status: "to_do",
    internalTaskId: opts.newId("int"),
    sortOrder: idx,
  }));

  const plannedEndDate = draftPhases[draftPhases.length - 1]?.endDate;
  return { phases: draftPhases, tasks, totalWorkingDays, plannedEndDate };
}

export function rescheduleExistingPhases(
  phases: ProjectPhase[],
  plannedStart: string,
  holidays: string[],
): ProjectPhase[] {
  const sorted = [...phases].sort((a, b) => a.sortOrder - b.sortOrder);
  const scheduled = schedulePhases(
    plannedStart,
    sorted.map((p) => ({
      id: p.id,
      name: p.name,
      durationDays: p.durationDays,
      sortOrder: p.sortOrder,
    })),
    holidays,
  );
  return sorted.map((ph) => {
    const s = scheduled.find((x) => x.phaseId === ph.id);
    return s ? { ...ph, startDate: s.startDate, endDate: s.endDate } : ph;
  });
}
