import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings-nav";
import { MemberRoleForm } from "@/components/settings/member-role-form";
import {
  deleteMemberAction,
  inviteMemberAction,
  setMemberStatusAction,
} from "@/lib/actions/settings";
import { getDb } from "@/lib/data/store";
import { currentUserCan } from "@/lib/rbac/access";
import { ROLE_LABELS, ROLES_ORDER } from "@/lib/rbac/permissions";
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
import type { MemberRole } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  invited: "Diundang",
  inactive: "Nonaktif",
};

export default async function UsersSettingsPage() {
  const db = await getDb();
  const canManage = await currentUserCan(db, "settings.users");

  return (
    <AppShell title="Pengguna & Hak Akses">
      <PageHeader
        eyebrow="Settings"
        title="User Management"
        subtitle="Kelola anggota organisasi, peran, dan status undangan."
      />
      <SettingsNav active="/settings/users" />

      {canManage ? (
        <Card className="mb-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
          <CardHeader>
            <CardTitle>Undang Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={inviteMemberAction} className="grid max-w-2xl grid-cols-2 gap-4">
              <div>
                <Label>Nama</Label>
                <Input name="fullName" required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div>
                <Label>Peran</Label>
                <select
                  name="role"
                  className="w-full rounded-md border border-[var(--pdcc-border)] bg-white p-2 text-sm"
                  defaultValue="pm"
                >
                  {ROLES_ORDER.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Pihak</Label>
                <select
                  name="party"
                  className="w-full rounded-md border border-[var(--pdcc-border)] bg-white p-2 text-sm"
                >
                  <option value="internal">Internal</option>
                  <option value="customer">Eksternal (pelanggan)</option>
                </select>
              </div>
              <Button type="submit" className="col-span-2 w-fit">
                Undang
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="mb-6 text-sm text-[var(--pdcc-muted)]">
          Anda tidak memiliki permission untuk mengundang atau mengubah pengguna.
        </p>
      )}

      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Pihak</TableHead>
                <TableHead>Status</TableHead>
                {canManage ? <TableHead className="text-right">Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.fullName}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>
                    {canManage ? (
                      <MemberRoleForm memberId={m.id} currentRole={m.role} />
                    ) : (
                      ROLE_LABELS[m.role as MemberRole] ?? m.role
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{m.party}</TableCell>
                  <TableCell>{STATUS_LABELS[m.status] ?? m.status}</TableCell>
                  {canManage ? (
                    <TableCell className="flex justify-end gap-2">
                      {m.status !== "inactive" ? (
                        <form action={setMemberStatusAction}>
                          <input type="hidden" name="memberId" value={m.id} />
                          <input type="hidden" name="status" value="inactive" />
                          <Button type="submit" size="sm" variant="outline">
                            Nonaktifkan
                          </Button>
                        </form>
                      ) : (
                        <form action={setMemberStatusAction}>
                          <input type="hidden" name="memberId" value={m.id} />
                          <input type="hidden" name="status" value="active" />
                          <Button type="submit" size="sm" variant="outline">
                            Aktifkan
                          </Button>
                        </form>
                      )}
                      <form action={deleteMemberAction}>
                        <input type="hidden" name="memberId" value={m.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Hapus
                        </Button>
                      </form>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
