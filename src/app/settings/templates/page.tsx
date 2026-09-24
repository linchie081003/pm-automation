import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings-nav";
import {
  addTemplatePhaseAction,
  addTemplateTaskAction,
  copyTemplateAction,
  createTemplateAction,
  deleteTemplatePhaseAction,
  deleteTemplateTaskAction,
  setTemplateActiveAction,
} from "@/lib/actions/settings";
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
import { cn } from "@/lib/utils";

export default async function TemplatesSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>;
}) {
  const db = await getDb();
  const { templateId: selectedId } = await searchParams;
  const template =
    db.templates.find((t) => t.id === selectedId) ??
    db.templates.find((t) => t.isActive !== false) ??
    db.templates[0];

  return (
    <AppShell title="Task Template Library">
      <PageHeader
        eyebrow="Settings"
        title="Task Template Library"
        subtitle="Buat, salin, nonaktifkan, dan edit phase/task default wizard."
      />
      <SettingsNav active="/settings/templates" />

      <div className="mb-6 flex flex-wrap gap-2">
        {db.templates.map((t) => (
          <Link
            key={t.id}
            href={`/settings/templates?templateId=${t.id}`}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm",
              template?.id === t.id
                ? "border-[var(--pdcc-indigo)] bg-[var(--pdcc-indigo)]/10 font-medium"
                : "border-[var(--pdcc-border)] hover:border-[var(--pdcc-indigo)]/40",
              t.isActive === false && "opacity-60",
            )}
          >
            {t.name}
            {t.isActive === false ? " (nonaktif)" : ""}
          </Link>
        ))}
      </div>

      <Card className="mb-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Template Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTemplateAction} className="grid max-w-2xl grid-cols-3 gap-4">
            <div className="col-span-3 sm:col-span-1">
              <Label>Nama</Label>
              <Input name="name" required placeholder="Mis. ERP Rollout" />
            </div>
            <div>
              <Label>Tipe project</Label>
              <Input name="projectType" defaultValue="Custom Application" />
            </div>
            <div>
              <Label>Metodologi</Label>
              <Input name="methodology" defaultValue="Agile" />
            </div>
            <Button type="submit" className="col-span-3 w-fit">
              + Buat Template
            </Button>
          </form>
        </CardContent>
      </Card>

      {template ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--pdcc-muted)]">
              {template.name} — {template.projectType} • {template.methodology}
            </p>
            <form action={copyTemplateAction}>
              <input type="hidden" name="templateId" value={template.id} />
              <Button type="submit" size="sm" variant="outline">
                Salin template
              </Button>
            </form>
            <form action={setTemplateActiveAction}>
              <input type="hidden" name="templateId" value={template.id} />
              <input
                type="hidden"
                name="active"
                value={template.isActive === false ? "true" : "false"}
              />
              <Button type="submit" size="sm" variant="outline">
                {template.isActive === false ? "Aktifkan" : "Nonaktifkan"}
              </Button>
            </form>
          </div>

          {template.phases.map((ph) => (
            <Card
              key={ph.id}
              className="mb-4 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">
                  {ph.name} — bobot {ph.weightPct}% • {ph.defaultDurationDays} hari
                </CardTitle>
                <form action={deleteTemplatePhaseAction}>
                  <input type="hidden" name="templateId" value={template.id} />
                  <input type="hidden" name="phaseId" value={ph.id} />
                  <Button type="submit" size="sm" variant="destructive">
                    Hapus phase
                  </Button>
                </form>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Milestone</TableHead>
                      <TableHead>MD default</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ph.tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>{task.name}</TableCell>
                        <TableCell>{task.isMilestone ? "Ya" : "—"}</TableCell>
                        <TableCell>{task.defaultMd}</TableCell>
                        <TableCell>
                          <form action={deleteTemplateTaskAction}>
                            <input type="hidden" name="templateId" value={template.id} />
                            <input type="hidden" name="phaseId" value={ph.id} />
                            <input type="hidden" name="taskId" value={task.id} />
                            <Button type="submit" size="sm" variant="ghost">
                              Hapus
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <form action={addTemplateTaskAction} className="grid grid-cols-4 gap-3">
                  <input type="hidden" name="templateId" value={template.id} />
                  <input type="hidden" name="phaseId" value={ph.id} />
                  <div className="col-span-2">
                    <Label>Nama task</Label>
                    <Input name="name" required />
                  </div>
                  <div>
                    <Label>MD</Label>
                    <Input name="defaultMd" type="number" step="0.5" defaultValue="1" />
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="isMilestone" className="size-4" />
                      Milestone
                    </label>
                    <Button type="submit" size="sm">
                      + Task
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}

          <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
            <CardHeader>
              <CardTitle>Tambah Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={addTemplatePhaseAction} className="grid max-w-md grid-cols-3 gap-4">
                <input type="hidden" name="templateId" value={template.id} />
                <div>
                  <Label>Nama</Label>
                  <Input name="name" required />
                </div>
                <div>
                  <Label>Bobot %</Label>
                  <Input name="weightPct" type="number" required />
                </div>
                <div>
                  <Label>Durasi (hari)</Label>
                  <Input name="durationDays" type="number" required />
                </div>
                <Button type="submit" className="col-span-3">
                  + Tambah Phase
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-[var(--pdcc-muted)]">Belum ada template — buat template baru di atas.</p>
      )}
    </AppShell>
  );
}
