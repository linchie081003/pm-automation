import { getDb, newId, saveDb } from "@/lib/data/store";
import { computeSpi, ragFromSpi } from "@/lib/domain/spi-rag";

export async function runWeeklyReportCutoff(projectId?: string) {
  const db = await getDb();
  const projects = projectId
    ? db.projects.filter((p) => p.id === projectId)
    : db.projects.filter((p) => p.status === "active");

  for (const project of projects) {
    const lastWeek =
      db.weeklyReports
        .filter((w) => w.projectId === project.id)
        .sort((a, b) => b.weekNumber - a.weekNumber)[0]?.weekNumber ?? 0;

    const weekNumber = lastWeek + 1;
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodEnd.getDate() - 6);

    const spi = computeSpi(project.progressActualPct, project.progressPlannedPct);
    project.spi = spi;
    project.ragStatus = ragFromSpi(spi);

    db.weeklyReports.push({
      id: newId("wr"),
      projectId: project.id,
      weekNumber,
      periodStart: periodStart.toISOString().slice(0, 10),
      periodEnd: periodEnd.toISOString().slice(0, 10),
      publishedAt: new Date().toISOString(),
      locked: true,
      revision: 1,
      snapshot: {
        planned: project.progressPlannedPct,
        actual: project.progressActualPct,
        spi,
      },
    });

    db.documents.push({
      id: newId("doc"),
      projectId: project.id,
      docType: "weekly_report",
      title: `Weekly Report — Minggu ${weekNumber}`,
      docDate: periodEnd.toISOString().slice(0, 10),
      status: "published",
      locked: true,
    });

    db.notifications.unshift({
      id: newId("n"),
      organizationId: db.organization.id,
      projectId: project.id,
      title: `Weekly Report Minggu ${weekNumber} diterbitkan`,
      body: "Dibuat otomatis dari ClickUp & Scheduler",
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  await saveDb(db);
  return { processed: projects.length };
}

export async function runScheduledClickUpSync() {
  const db = await getDb();
  const active = db.projects.filter((p) => p.clickupFolderId);
  for (const p of active) {
    db.clickupLogs.unshift({
      id: newId("log"),
      projectId: p.id,
      direction: "ClickUp → Aplikasi",
      detail: "Sync terjadwal (30 menit)",
      status: "success",
      createdAt: new Date().toISOString(),
    });
  }
  await saveDb(db);
  return { synced: active.length };
}
