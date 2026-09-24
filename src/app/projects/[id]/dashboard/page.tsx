import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PdccCard } from "@/components/pdcc-card";
import { loadProject } from "@/lib/project-page";
import { BtnLink } from "@/components/btn-link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);
  const baseline0 = db.baselines.find(
    (b) => b.projectId === id && b.versionType === "baseline_0",
  );
  const rebaseline = db.baselines.find(
    (b) => b.projectId === id && b.versionType === "rebaseline",
  );

  return (
    <AppShell title={project.name}>
      <PageHeader
        eyebrow="Ringkasan Project"
        title={project.name}
        subtitle={`${project.customerName} • per hari ini`}
        ragStatus={project.ragStatus}
        actions={
          <>
        <BtnLink href={`/api/export?type=task-recap&projectId=${id}`} variant="outline" size="sm">
          Unduh Rekap
        </BtnLink>
        <BtnLink href={`/projects/${id}/weekly-report`} variant="outline" size="sm">
          Buat / Lihat Weekly Report
        </BtnLink>
        <BtnLink href={`/projects/${id}/closing`} variant="outline" size="sm">
          Closing Project
        </BtnLink>
        <BtnLink href={`/projects/${id}/tasks/add`} size="sm">
          + Ajukan Penambahan Task
        </BtnLink>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["SPH Duration", `${project.sphDurationDays ?? "—"} hari`],
          ["Baseline (berlaku)", `${baseline0?.totalDurationDays ?? "—"} hari`],
          ["GAP", `+${project.gapDays} hari`],
          ["SPI", `${project.spi ?? "—"}`],
        ].map(([label, val]) => (
          <PdccCard key={label} className="p-5">
            <p className="text-xs font-medium uppercase text-[var(--pdcc-muted)]">{label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--pdcc-title)]">{val}</p>
          </PdccCard>
        ))}
      </div>
      <PdccCard className="mt-6 p-6">
        <h3 className="font-semibold text-[var(--pdcc-title)]">Progress Aktual vs Rencana</h3>
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm">Actual {project.progressActualPct}%</p>
            <Progress value={project.progressActualPct} />
          </div>
          <div>
            <p className="mb-2 text-sm text-[var(--pdcc-muted)]">Planned {project.progressPlannedPct}%</p>
            <Progress value={project.progressPlannedPct} className="opacity-60" />
          </div>
        </div>
      </PdccCard>
      {rebaseline?.gapReason && (
        <PdccCard className="mt-6 p-6">
          <h3 className="font-semibold">GAP Reason — Kumulatif</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {Object.entries(rebaseline.gapReason).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-[var(--pdcc-border)] bg-[var(--pdcc-bg)] p-3">
                <p className="text-xs text-[var(--pdcc-muted)]">{k}</p>
                <p className="text-lg font-semibold">{v}%</p>
              </div>
            ))}
          </div>
        </PdccCard>
      )}
      <PdccCard className="mt-6 p-6">
        <h3 className="font-semibold">Aktivitas Terbaru</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {db.activities
            .filter((a) => a.projectId === id)
            .map((a) => (
              <li key={a.id} className="border-b border-[var(--pdcc-border)] pb-2">
                {a.message}
              </li>
            ))}
        </ul>
        <BtnLink href={`/projects/${id}/baseline`} className="mt-4" variant="link">
          Lihat detail Baseline & GAP
        </BtnLink>
      </PdccCard>
    </AppShell>
  );
}
