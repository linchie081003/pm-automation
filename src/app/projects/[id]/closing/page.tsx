import { AppShell } from "@/components/layout/app-shell";
import { ClosingChecklistItem } from "@/components/closing/closing-checklist";
import { ClosingChecklistRemove } from "@/components/closing/closing-checklist-manage";
import {
  addClosingChecklistItemAction,
  seedClosingChecklistTemplateAction,
  submitProjectClosingFormAction,
} from "@/lib/actions/operations";
import { loadProject } from "@/lib/project-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
export default async function ClosingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);

  const items = db.closingChecklist.filter((c) => c.projectId === id);
  const allDone = items.length > 0 && items.every((i) => i.completed);
  const isCompleted = project.status === "completed";

  return (
    <AppShell title="Closing Project">
      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>
            {project.name} — {project.customerName}
          </CardTitle>
          <p className="text-sm text-[var(--pdcc-muted)]">
            Checklist closing dapat disesuaikan per project — tambah, hapus, atau muat template standar.
          </p>
          {isCompleted ? (
            <p className="text-sm font-medium text-[var(--pdcc-success-fg)]">
              Project completed — closing telah diajukan dan disetujui.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-[var(--pdcc-muted)]">Belum ada item checklist.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <ClosingChecklistItem item={item} projectId={id} readOnly={isCompleted} />
                  </div>
                  {!isCompleted && !item.completed ? (
                    <ClosingChecklistRemove item={item} projectId={id} />
                  ) : null}
                </div>
              ))
            )}
          </div>

          {!isCompleted ? (
            <div className="flex flex-wrap gap-3 border-t border-[var(--pdcc-border)] pt-4">
              <form action={addClosingChecklistItemAction} className="flex flex-1 min-w-[240px] gap-2">
                <input type="hidden" name="projectId" value={id} />
                <Input name="label" placeholder="Item checklist baru" required />
                <Button type="submit" variant="secondary">
                  Tambah
                </Button>
              </form>
              <form action={seedClosingChecklistTemplateAction}>
                <input type="hidden" name="projectId" value={id} />
                <Button type="submit" variant="outline">
                  Muat template standar
                </Button>
              </form>
            </div>
          ) : null}

          <p className="text-sm text-[var(--pdcc-muted)]">
            {isCompleted
              ? "Project tidak lagi muncul di daftar portfolio aktif."
              : items.length === 0
                ? "Tambahkan minimal satu item sebelum mengajukan closing."
                : allDone
                  ? "Seluruh checklist terpenuhi — siap ajukan closing."
                  : `${items.filter((i) => !i.completed).length} item masih terbuka.`}
          </p>
          {!isCompleted ? (
            <form action={submitProjectClosingFormAction}>
              <input type="hidden" name="projectId" value={id} />
              <Button type="submit" disabled={!allDone}>
                Ajukan Closing
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
