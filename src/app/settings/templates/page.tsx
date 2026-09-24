import { AppShell } from "@/components/layout/app-shell";
import { addTemplatePhaseAction } from "@/lib/actions/settings";
import { getDb } from "@/lib/data/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TemplatesSettingsPage() {
  const db = await getDb();
  const template = db.templates[0];

  return (
    <AppShell title="Task Template Library">
      {template && (
        <>
          <p className="mb-4 text-[var(--pdcc-muted)]">
            {template.name} — {template.projectType} • {template.methodology}
          </p>
          <Card className="mb-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
            <CardHeader>
              <CardTitle>Phase & Task Default</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phase</TableHead>
                    <TableHead>Bobot</TableHead>
                    <TableHead>Durasi default</TableHead>
                    <TableHead>Task</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {template.phases.map((ph) => (
                    <TableRow key={ph.id}>
                      <TableCell>{ph.name}</TableCell>
                      <TableCell>{ph.weightPct}%</TableCell>
                      <TableCell>{ph.defaultDurationDays} hari</TableCell>
                      <TableCell className="text-sm text-[var(--pdcc-muted)]">
                        {ph.tasks.map((t) => t.name).join(" • ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
            <CardHeader>
              <CardTitle>Tambah Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addTemplatePhaseAction} className="grid max-w-md grid-cols-3 gap-4">
                <input type="hidden" name="templateId" value={template.id} />
                <div>
                  <Label>Nama</Label>
                  <Input name="name" />
                </div>
                <div>
                  <Label>Bobot %</Label>
                  <Input name="weightPct" type="number" />
                </div>
                <div>
                  <Label>Durasi (hari)</Label>
                  <Input name="durationDays" type="number" />
                </div>
                <Button type="submit" className="col-span-3">
                  + Tambah Phase
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
