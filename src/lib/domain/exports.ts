import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";
import type { Project, ProjectPhase, ProjectTask } from "@/lib/types";

export async function buildSchedulerWorkbook(
  project: Project,
  phases: ProjectPhase[],
  tasks: ProjectTask[],
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const summary = wb.addWorksheet("Project_Summary");
  summary.addRow(["Project", project.name]);
  summary.addRow(["Customer", project.customerName]);
  summary.addRow(["Planned Start", project.plannedStartDate ?? ""]);
  summary.addRow(["SPH Duration (days)", project.sphDurationDays ?? ""]);

  const scheduler = wb.addWorksheet("Scheduler");
  scheduler.addRow(["Phase", "Weight %", "Duration", "Start", "End", "Task", "MD"]);
  for (const phase of phases.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const phaseTasks = tasks.filter((t) => t.phaseId === phase.id);
    if (phaseTasks.length === 0) {
      scheduler.addRow([
        phase.name,
        phase.weightPct,
        phase.durationDays,
        phase.startDate,
        phase.endDate,
        "",
        "",
      ]);
    } else {
      phaseTasks.forEach((t, idx) => {
        scheduler.addRow([
          idx === 0 ? phase.name : "",
          idx === 0 ? phase.weightPct : "",
          idx === 0 ? phase.durationDays : "",
          idx === 0 ? phase.startDate : "",
          idx === 0 ? phase.endDate : "",
          t.name,
          t.estMdCurrent,
        ]);
      });
    }
  }

  const scurve = wb.addWorksheet("S-Curve");
  scurve.addRow(["Week", "Planned %", "Actual %"]);
  for (let w = 1; w <= 12; w++) {
    scurve.addRow([w, Math.min(100, w * 8), Math.min(100, w * 7)]);
  }

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export async function buildKickoffDeck(
  project: Project,
  phases: ProjectPhase[],
  gapDays: number,
): Promise<ArrayBuffer> {
  const pptx = new PptxGenJS();
  const slide1 = pptx.addSlide();
  slide1.addText(project.name, { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 28 });
  slide1.addText(`Customer: ${project.customerName}`, { x: 0.5, y: 1.5, fontSize: 14 });

  const slide2 = pptx.addSlide();
  slide2.addText("Timeline & GAP vs SPH", { x: 0.5, y: 0.3, fontSize: 22 });
  let y = 1;
  for (const p of phases.sort((a, b) => a.sortOrder - b.sortOrder)) {
    slide2.addText(
      `${p.name}: ${p.startDate ?? "?"} → ${p.endDate ?? "?"} (${p.durationDays} hari)`,
      { x: 0.5, y, fontSize: 12 },
    );
    y += 0.4;
  }
  slide2.addText(`GAP vs SPH: ${gapDays >= 0 ? "+" : ""}${gapDays} hari`, {
    x: 0.5,
    y: y + 0.3,
    fontSize: 14,
    bold: true,
  });

  const slide3 = pptx.addSlide();
  slide3.addText("Agenda Kick Off", { x: 0.5, y: 0.5, fontSize: 22 });
  slide3.addText(
    "1. Ringkasan SOW\n2. Timeline baseline\n3. RACI & komunikasi\n4. Next steps",
    { x: 0.5, y: 1.2, fontSize: 14 },
  );

  const out = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
  return out;
}

export async function buildTaskRecapWorkbook(
  projectName: string,
  tasks: ProjectTask[],
  phaseNames: Record<string, string>,
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Task_Recap");
  sheet.addRow([
    "Phase",
    "Task",
    "Status",
    "Est BL0",
    "Est Berlaku",
    "Realisasi",
    "Selisih",
  ]);
  for (const t of tasks) {
    const selisih = t.actualMd - t.estMdCurrent;
    sheet.addRow([
      phaseNames[t.phaseId] ?? "",
      t.name,
      t.status,
      t.estMdBaseline0,
      t.estMdCurrent,
      t.actualMd,
      selisih,
    ]);
  }
  const detail = wb.addWorksheet("Task_Detail");
  detail.addRow(["Task", "Subtask/Checklist", "MD"]);
  for (const t of tasks) {
    if (t.checklist?.length) {
      for (const c of t.checklist) {
        detail.addRow([t.name, c.name, c.md ?? ""]);
      }
    }
  }
  sheet.getRow(1).font = { bold: true };
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
