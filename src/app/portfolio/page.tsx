import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PdccCard } from "@/components/pdcc-card";
import { RagBadge } from "@/components/rag-badge";
import { createProjectAction, setActiveProjectAction } from "@/lib/actions/projects";
import { getDb } from "@/lib/data/store";
import { BtnLink } from "@/components/btn-link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PortfolioPage() {
  const db = await getDb();
  const active = db.projects.filter((p) => p.status !== "completed");
  const onTrack = active.filter((p) => p.ragStatus === "on_track").length;
  const atRisk = active.filter((p) => p.ragStatus === "at_risk").length;
  const offTrack = active.filter((p) => p.ragStatus === "off_track").length;

  return (
    <AppShell title="Portfolio Project">
      <PageHeader
        eyebrow="Portfolio"
        title="Portfolio Project"
        subtitle="Ringkasan seluruh project yang sedang berjalan • per hari ini"
        actions={
          <form action={createProjectAction}>
            <Button type="submit">+ Project Baru</Button>
          </form>
        }
      />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Project Aktif", active.length, "text-[var(--pdcc-title)]"],
          ["On Track", onTrack, "text-[var(--pdcc-success-fg)]"],
          ["At Risk", atRisk, "text-[var(--pdcc-warning-fg)]"],
          ["Off Track", offTrack, "text-[var(--pdcc-danger-fg)]"],
        ].map(([label, val, color]) => (
          <PdccCard key={String(label)} className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--pdcc-muted)]">
              {label}
            </p>
            <p className={`font-heading mt-2 text-3xl font-bold tabular-nums ${color}`}>
              {val}
            </p>
          </PdccCard>
        ))}
      </div>
      <PdccCard className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[var(--pdcc-border-light)] hover:bg-[var(--pdcc-border-light)]">
              <TableHead className="font-semibold">Project</TableHead>
              <TableHead className="font-semibold">PM</TableHead>
              <TableHead className="font-semibold">Progress</TableHead>
              <TableHead className="font-semibold">SPI</TableHead>
              <TableHead className="font-semibold">GAP</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Milestone Berikutnya</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((p) => {
              const pm = db.members.find((m) => m.id === p.pmMemberId);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-[var(--pdcc-title)]">{p.name}</div>
                    <div className="text-xs text-[var(--pdcc-muted)]">{p.customerName}</div>
                  </TableCell>
                  <TableCell className="text-sm">{pm?.fullName ?? "—"}</TableCell>
                  <TableCell className="text-sm tabular-nums">
                    Actual {p.progressActualPct}% / Rencana {p.progressPlannedPct}%
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {p.spi?.toFixed(2) ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {p.gapDays > 0 ? `+${p.gapDays} hari` : `${p.gapDays} hari`}
                  </TableCell>
                  <TableCell>
                    <RagBadge status={p.ragStatus} />
                  </TableCell>
                  <TableCell className="max-w-[200px] text-sm text-[var(--pdcc-muted)]">
                    {p.nextMilestone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <form action={setActiveProjectAction}>
                      <input type="hidden" name="projectId" value={p.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Buka
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </PdccCard>
    </AppShell>
  );
}
