import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PdccCard } from "@/components/pdcc-card";
import { RagBadge } from "@/components/rag-badge";
import {
  createProjectFormAction,
  deleteProjectFormAction,
  setActiveProjectFormAction,
} from "@/lib/actions/form-actions";
import { ServerActionForm } from "@/components/form/server-action-form";
import { isProjectDeletable } from "@/lib/project-rules";
import { getDb } from "@/lib/data/store";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PortfolioView = "active" | "completed" | "all";

function parseView(raw: string | undefined): PortfolioView {
  if (raw === "completed" || raw === "all") return raw;
  return "active";
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view = parseView(viewParam);

  const db = await getDb();
  const activeProjects = db.projects.filter((p) => p.status !== "completed");
  const completedProjects = db.projects.filter((p) => p.status === "completed");

  const listed =
    view === "completed"
      ? completedProjects
      : view === "all"
        ? db.projects
        : activeProjects;

  const onTrack = activeProjects.filter((p) => p.ragStatus === "on_track").length;
  const atRisk = activeProjects.filter((p) => p.ragStatus === "at_risk").length;
  const offTrack = activeProjects.filter((p) => p.ragStatus === "off_track").length;

  const tabs: { id: PortfolioView; label: string; count: number }[] = [
    { id: "active", label: "Aktif", count: activeProjects.length },
    { id: "completed", label: "Completed", count: completedProjects.length },
    { id: "all", label: "Semua", count: db.projects.length },
  ];

  return (
    <AppShell title="Portfolio Project">
      <PageHeader
        eyebrow="Portfolio"
        title="Portfolio Project"
        subtitle={
          view === "completed"
            ? "Project yang sudah closing / completed"
            : view === "all"
              ? "Seluruh project termasuk completed"
              : "Ringkasan project yang sedang berjalan • per hari ini"
        }
        actions={
          <ServerActionForm action={createProjectFormAction}>
            <Button type="submit">+ Project Baru</Button>
          </ServerActionForm>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "active" ? "/portfolio" : `/portfolio?view=${tab.id}`}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              view === tab.id
                ? "border-[var(--pdcc-indigo)] bg-[var(--pdcc-indigo)] text-white"
                : "border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] text-[var(--pdcc-muted)] hover:border-[var(--pdcc-indigo)]/40",
            )}
          >
            {tab.label}
            <span className="ml-2 tabular-nums opacity-80">({tab.count})</span>
          </Link>
        ))}
      </div>

      {view === "active" ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total Project Aktif", activeProjects.length, "text-[var(--pdcc-title)]"],
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
      ) : null}

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
            {listed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-[var(--pdcc-muted)]">
                  Tidak ada project untuk filter ini.
                </TableCell>
              </TableRow>
            ) : (
              listed.map((p) => {
                const pm = db.members.find((m) => m.id === p.pmMemberId);
                const isCompleted = p.status === "completed";
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
                      {p.spi != null ? Number(p.spi).toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {p.gapDays > 0 ? `+${p.gapDays} hari` : `${p.gapDays} hari`}
                    </TableCell>
                    <TableCell>
                      {isCompleted ? (
                        <span className="rounded-full bg-[var(--pdcc-border-light)] px-2 py-0.5 text-xs font-medium text-[var(--pdcc-muted)]">
                          Completed
                        </span>
                      ) : (
                        <RagBadge status={p.ragStatus} />
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] text-sm text-[var(--pdcc-muted)]">
                      {p.nextMilestone ?? "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      {isProjectDeletable(p) ? (
                        <ServerActionForm action={deleteProjectFormAction}>
                          <input type="hidden" name="projectId" value={p.id} />
                          <Button type="submit" size="sm" variant="destructive">
                            Hapus
                          </Button>
                        </ServerActionForm>
                      ) : null}
                      <ServerActionForm action={setActiveProjectFormAction}>
                        <input type="hidden" name="projectId" value={p.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Buka
                        </Button>
                      </ServerActionForm>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </PdccCard>
    </AppShell>
  );
}
