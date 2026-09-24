import { AppShell } from "@/components/layout/app-shell";
import { linkDocumentDriveAction } from "@/lib/actions/operations";
import { loadProject } from "@/lib/project-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);
  const docs = db.documents.filter((d) => d.projectId === id);

  return (
    <AppShell title="Dokumen">
      <p className="mb-4 text-sm text-[var(--pdcc-muted)]">
        Terhubung ke Google Drive — dokumen menyimpan tautan Drive, bukan salinan file di aplikasi.
      </p>
      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>
            SPH, PO/Kontrak, Weekly Report — {project.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dokumen</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Drive</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{d.docType}</TableCell>
                  <TableCell>{d.docDate}</TableCell>
                  <TableCell>
                    {d.driveUrl ? (
                      <a href={d.driveUrl} className="text-blue-400 underline" target="_blank" rel="noreferrer">
                        Tertaut
                      </a>
                    ) : (
                      "Belum tertaut"
                    )}
                  </TableCell>
                  <TableCell>{d.status}</TableCell>
                  <TableCell>
                    {!d.driveUrl && !d.locked && (
                      <form action={linkDocumentDriveAction} className="flex gap-2">
                        <input type="hidden" name="docId" value={d.id} />
                        <input type="hidden" name="projectId" value={id} />
                        <Input
                          name="driveUrl"
                          placeholder="https://drive.google.com/..."
                          className="h-8 w-48 text-xs"
                        />
                        <Button type="submit" size="sm" variant="outline">
                          Tautkan
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
