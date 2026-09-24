import { AppShell } from "@/components/layout/app-shell";
import { loadProject } from "@/lib/project-page";
import { BtnLink } from "@/components/btn-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);
  const budget = project.sphImplementationValue ?? 0;
  const tasks = db.tasks.filter((t) => t.projectId === id);
  const totalMd = tasks.reduce((a, t) => a + t.actualMd, 0);
  const mappings = db.picMappings.filter((m) => m.projectId === id);

  const byPosition = mappings.map((m) => {
    const member = db.members.find((x) => x.id === m.memberId);
    const rate = db.positionRates.find((r) => r.positionName === m.positionName);
    const md = tasks
      .filter((t) => t.picMemberId === m.memberId)
      .reduce((a, t) => a + t.actualMd, 0);
    const rp = md * (rate?.ratePerMd ?? 0);
    return { member, position: m.positionName, rate: rate?.ratePerMd ?? 0, md, rp };
  });

  const realisasi = byPosition.reduce((a, r) => a + r.rp, 0);
  const pct = budget > 0 ? (realisasi / budget) * 100 : 0;

  return (
    <AppShell title="Budget Implementasi">
      <BtnLink href="/settings/resource-rates" variant="outline" className="mb-4">
        Atur Harga Resource per Posisi
      </BtnLink>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--pdcc-muted)]">Budget Implementasi</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            Rp {budget.toLocaleString("id-ID")}
          </CardContent>
        </Card>
        <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--pdcc-muted)]">Realisasi s.d. Ini</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">
            Rp {realisasi.toLocaleString("id-ID")} ({totalMd} MD)
          </CardContent>
        </Card>
        <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[var(--pdcc-muted)]">% Terpakai vs Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold">
              {pct.toFixed(1)}% / {project.progressActualPct}%
            </p>
            <Progress value={pct} className="mt-2" />
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Realisasi per Posisi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posisi / PIC</TableHead>
                <TableHead>Harga/MD</TableHead>
                <TableHead>Realisasi MD</TableHead>
                <TableHead>Realisasi Rp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byPosition.map((row) => (
                <TableRow key={row.member?.id}>
                  <TableCell>
                    {row.position} — {row.member?.fullName}
                  </TableCell>
                  <TableCell>Rp {row.rate.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{row.md} MD</TableCell>
                  <TableCell>Rp {row.rp.toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
