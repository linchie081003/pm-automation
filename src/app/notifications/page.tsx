import { AppShell } from "@/components/layout/app-shell";
import { markReadFormAction } from "@/lib/actions/operations";
import { getDb } from "@/lib/data/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NotificationsPage() {
  const db = await getDb();
  const unread = db.notifications.filter((n) => !n.read);
  const read = db.notifications.filter((n) => n.read);

  return (
    <AppShell title="Notifikasi">
      <Card className="mb-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Belum Dibaca ({unread.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {unread.map((n) => (
            <div key={n.id} className="rounded-lg border border-[var(--pdcc-border)] p-4">
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-[var(--pdcc-muted)]">{n.body}</p>
              <form action={markReadFormAction} className="mt-2">
                <input type="hidden" name="id" value={n.id} />
                <Button type="submit" size="sm" variant="outline">
                  Tandai terbaca
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
      {read.length > 0 && (
        <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
          <CardHeader>
            <CardTitle>Sebelumnya</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--pdcc-muted-light)]">
            {read.map((n) => (
              <p key={n.id}>{n.title}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
