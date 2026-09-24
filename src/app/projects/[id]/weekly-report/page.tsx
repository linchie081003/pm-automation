import { AppShell } from "@/components/layout/app-shell";
import { RagBadge } from "@/components/rag-badge";
import { loadProject } from "@/lib/project-page";
import { BtnLink } from "@/components/btn-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WeeklyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);
  const latest = db.weeklyReports
    .filter((w) => w.projectId === id)
    .sort((a, b) => b.weekNumber - a.weekNumber)[0];

  return (
    <AppShell title={`Weekly Report — Minggu ke-${latest?.weekNumber ?? "—"}`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <BtnLink href={`/api/export?type=scheduler&projectId=${id}`} variant="secondary" size="sm">
          Unduh Excel
        </BtnLink>
        <Button variant="outline" size="sm" disabled>
          Unduh PDF
        </Button>
        <Button variant="outline" size="sm" disabled>
          Unduh PPTX
        </Button>
      </div>
      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{project.name}</CardTitle>
          <RagBadge status={project.ragStatus} />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-[var(--pdcc-muted)]">Planned</p>
            <p className="text-2xl font-bold">
              {(latest?.snapshot?.planned as number | undefined) ?? project.progressPlannedPct}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--pdcc-muted)]">Actual</p>
            <p className="text-2xl font-bold">
              {(latest?.snapshot?.actual as number | undefined) ?? project.progressActualPct}%
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--pdcc-muted)]">SPI</p>
            <p className="text-2xl font-bold">{project.spi ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--pdcc-muted)]">Periode</p>
            <p className="text-sm">
              {latest?.periodStart} — {latest?.periodEnd}
            </p>
            {latest?.locked && (
              <p className="text-xs text-amber-400">Terbit — terkunci</p>
            )}
          </div>
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-[var(--pdcc-muted-light)]">
        Laporan diterbitkan otomatis pada cut-off ({project.wrCutoffTime}, {project.wrPublishDay}).
        Versi pelanggan tidak menampilkan data MD.
      </p>
    </AppShell>
  );
}
