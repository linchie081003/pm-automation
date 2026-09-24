import { AppShell } from "@/components/layout/app-shell";
import { approveRebaselineFormAction } from "@/lib/actions/operations";
import { loadProject } from "@/lib/project-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BaselinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);
  const versions = db.baselines.filter((b) => b.projectId === id);
  const rebaseline = versions.find((b) => b.versionType === "rebaseline");

  return (
    <AppShell title="Baseline & GAP Analysis">
      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>
            {project.name} — {project.customerName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parameter</TableHead>
                <TableHead>SPH</TableHead>
                <TableHead>Baseline 0</TableHead>
                <TableHead>Rebaseline 1 (Draft)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Durasi</TableCell>
                <TableCell>{project.sphDurationDays} hari</TableCell>
                <TableCell>
                  {versions.find((b) => b.versionType === "baseline_0")?.totalDurationDays} hari
                </TableCell>
                <TableCell>{rebaseline?.totalDurationDays ?? "—"} hari</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Total MD</TableCell>
                <TableCell>—</TableCell>
                <TableCell>
                  {versions.find((b) => b.versionType === "baseline_0")?.totalMd} MD
                </TableCell>
                <TableCell>{rebaseline?.totalMd ?? "—"} MD</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>GAP vs SPH</TableCell>
                <TableCell>—</TableCell>
                <TableCell>+5 hari</TableCell>
                <TableCell>+28 hari (31.1%)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {rebaseline && (
        <Card className="mt-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
          <CardHeader>
            <CardTitle>Persetujuan Rebaseline 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Internal — {rebaseline.approvedInternalAt ? "disetujui" : "menunggu"}
            </p>
            <p>Pelanggan — {rebaseline.approvedCustomerAt ? "disetujui" : "menunggu persetujuan"}</p>
            {!rebaseline.approvedInternalAt && (
              <form action={approveRebaselineFormAction}>
                <input type="hidden" name="projectId" value={id} />
                <Button type="submit">Setujui Internal</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
