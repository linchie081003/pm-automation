import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { loadProject } from "@/lib/project-page";
import { BtnLink } from "@/components/btn-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TaskRecapPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { db, project } = await loadProject(id);
  const jar = await cookies();
  const role = jar.get("pdcc_role")?.value ?? "delivery_manager";
  const customerView = sp.view === "customer" || role === "customer";
  const phases = Object.fromEntries(
    db.phases.filter((p) => p.projectId === id).map((p) => [p.id, p.name]),
  );
  const tasks = db.tasks.filter(
    (t) => t.projectId === id && t.baselineId === project.activeBaselineId,
  );
  const totalEst = tasks.reduce((a, t) => a + t.estMdCurrent, 0);
  const totalAct = tasks.reduce((a, t) => a + t.actualMd, 0);

  return (
    <AppShell title="Rekap Task">
      <div className="mb-4 flex gap-2">
        <BtnLink href={`/projects/${id}/task-recap?view=internal`} variant={customerView ? "outline" : "default"} size="sm">
          Internal
        </BtnLink>
        <BtnLink href={`/projects/${id}/task-recap?view=customer`} variant={customerView ? "default" : "outline"} size="sm">
          Pelanggan
        </BtnLink>
        <BtnLink href={`/api/export?type=task-recap&projectId=${id}`} variant="secondary" size="sm">
          Unduh (.xlsx)
        </BtnLink>
      </div>
      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Estimasi vs realisasi mandays — ClickUp</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phase / Task</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Status</TableHead>
                {!customerView && <TableHead>Est. (BL0)</TableHead>}
                {!customerView && <TableHead>Est. (Berlaku)</TableHead>}
                {!customerView && <TableHead>Realisasi</TableHead>}
                {!customerView && <TableHead>Selisih</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => {
                const pic = db.members.find((m) => m.id === t.picMemberId);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div>{phases[t.phaseId]}</div>
                      <div className="font-medium">{t.name}</div>
                    </TableCell>
                    <TableCell>{pic?.fullName ?? "—"}</TableCell>
                    <TableCell>{t.status}</TableCell>
                    {!customerView && (
                      <>
                        <TableCell>{t.estMdBaseline0}</TableCell>
                        <TableCell>{t.estMdCurrent}</TableCell>
                        <TableCell>{t.actualMd}</TableCell>
                        <TableCell>{t.actualMd - t.estMdCurrent}</TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {!customerView && (
            <p className="mt-4 text-sm text-[var(--pdcc-muted)]">
              Total: {totalEst} MD estimasi berlaku / {totalAct} MD realisasi
            </p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
