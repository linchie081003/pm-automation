import { AppShell } from "@/components/layout/app-shell";
import { syncClickUpFormAction } from "@/lib/actions/operations";
import { loadProject } from "@/lib/project-page";
import { BtnLink } from "@/components/btn-link";
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

export default async function ClickUpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);
  const logs = db.clickupLogs.filter((l) => l.projectId === id);
  const unclassified = db.unclassifiedTasks.filter((t) => t.projectId === id);

  return (
    <AppShell title="ClickUp Sync">
      <Card className="mb-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div>
            <p className="text-sm text-[var(--pdcc-muted)]">Status Koneksi</p>
            <p className="font-medium">
              {project.clickupFolderId ? "Terhubung" : "Belum digenerate"} — Folder{" "}
              {project.clickupFolderName ?? "—"}
            </p>
            <p className="text-xs text-[var(--pdcc-muted-light)]">Jadwal otomatis: tiap 30 menit (cron)</p>
          </div>
          <form action={syncClickUpFormAction}>
            <input type="hidden" name="projectId" value={id} />
            <Button type="submit">Sync Sekarang</Button>
          </form>
        </CardContent>
      </Card>
      {unclassified.length > 0 && (
        <Card className="mb-6 border-[var(--pdcc-warning-fg)]/20 bg-[var(--pdcc-warning-bg)]">
          <CardHeader>
            <CardTitle>Task Belum Diklasifikasikan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unclassified.map((t) => (
              <div key={t.id} className="flex justify-between text-sm">
                <span>
                  {t.taskName} — List: {t.listName}
                </span>
                <BtnLink href={`/projects/${id}/tasks/add`} size="sm" variant="outline">
                  Klasifikasikan
                </BtnLink>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Log Sinkronisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Arah</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{new Date(l.createdAt).toLocaleString("id-ID")}</TableCell>
                  <TableCell>{l.direction}</TableCell>
                  <TableCell>{l.detail}</TableCell>
                  <TableCell>{l.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
