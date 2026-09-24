import { AppShell } from "@/components/layout/app-shell";
import {
  approveAdditionFormAction,
  submitTaskAdditionAction,
} from "@/lib/actions/operations";
import { loadProject } from "@/lib/project-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function TaskAddPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);
  const pending = db.taskAdditions.filter(
    (a) => a.projectId === id && a.status === "pending",
  );

  return (
    <AppShell title="Penambahan Task / Milestone">
      <Card className="mb-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Jalur B — Penambahan Internal</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitTaskAdditionAction} className="grid max-w-xl gap-4">
            <input type="hidden" name="projectId" value={id} />
            <input type="hidden" name="path" value="jalur_b" />
            <div>
              <Label>Nama Task</Label>
              <Input name="taskName" required />
            </div>
            <div>
              <Label>Milestone / Phase</Label>
              <Input name="phaseName" defaultValue="Testing (SIT)" />
            </div>
            <div>
              <Label>Estimasi MD</Label>
              <Input name="estMd" type="number" />
            </div>
            <div>
              <Label>Kategori Alasan</Label>
              <Input name="reasonCategory" />
            </div>
            <div>
              <Label>Alasan</Label>
              <Textarea name="reasonText" />
            </div>
            <Button type="submit">Ajukan</Button>
          </form>
        </CardContent>
      </Card>
      {pending.map((add) => (
        <Card key={add.id} className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="font-medium">{add.taskName}</p>
              <p className="text-sm text-[var(--pdcc-muted)]">
                {add.estMd} MD — menunggu persetujuan internal
              </p>
            </div>
            <form action={approveAdditionFormAction}>
              <input type="hidden" name="additionId" value={add.id} />
              <Button type="submit">Setujui & Tambahkan</Button>
            </form>
          </CardContent>
        </Card>
      ))}
      <Card className="mt-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Jalur A</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitTaskAdditionAction} className="grid max-w-xl gap-4">
            <input type="hidden" name="projectId" value={id} />
            <input type="hidden" name="path" value="jalur_a" />
            <div>
              <Label>Nama Task (Rebaseline)</Label>
              <Input name="taskName" placeholder="SAST/DAST" />
            </div>
            <div>
              <Label>Estimasi MD</Label>
              <Input name="estMd" type="number" />
            </div>
            <Textarea name="reasonText" placeholder="Alasan rebaseline..." />
            <Button type="submit" variant="secondary">
              Ajukan Rebaseline (Jalur A)
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
