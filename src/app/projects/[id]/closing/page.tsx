import { AppShell } from "@/components/layout/app-shell";
import { toggleClosingFormAction } from "@/lib/actions/operations";
import { loadProject } from "@/lib/project-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default async function ClosingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, project } = await loadProject(id);
  const items = db.closingChecklist.filter((c) => c.projectId === id);
  const allDone = items.every((i) => i.completed);

  return (
    <AppShell title="Closing Project">
      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>
            {project.name} — {project.customerName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item) => (
            <form key={item.id} action={toggleClosingFormAction} className="flex items-center gap-3">
              <input type="hidden" name="itemId" value={item.id} />
              <Checkbox checked={item.completed} readOnly />
              <span className={item.completed ? "text-[var(--pdcc-muted-light)] line-through" : ""}>
                {item.label}
              </span>
              <Button type="submit" size="sm" variant="ghost">
                Toggle
              </Button>
            </form>
          ))}
          <p className="text-sm text-[var(--pdcc-muted)]">
            {allDone
              ? "Seluruh checklist terpenuhi — siap ajukan closing."
              : `${items.filter((i) => !i.completed).length} item masih terbuka.`}
          </p>
          <Button disabled={!allDone}>Ajukan Closing</Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}
