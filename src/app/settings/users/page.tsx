import { AppShell } from "@/components/layout/app-shell";
import { inviteMemberAction } from "@/lib/actions/settings";
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

export default async function UsersSettingsPage() {
  const db = await getDb();

  return (
    <AppShell title="Pengguna & Hak Akses">
      <Card className="mb-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Undang Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={inviteMemberAction} className="grid max-w-lg grid-cols-2 gap-4">
            <div>
              <Label>Nama</Label>
              <Input name="fullName" />
            </div>
            <div>
              <Label>Email</Label>
              <Input name="email" type="email" />
            </div>
            <div>
              <Label>Peran</Label>
              <select name="role" className="w-full rounded-md border border-[var(--pdcc-border)] bg-white p-2">
                <option value="pm">PM</option>
                <option value="team_member">Anggota Tim</option>
                <option value="finance">Finance</option>
                <option value="customer">Pelanggan</option>
              </select>
            </div>
            <div>
              <Label>Pihak</Label>
              <select name="party" className="w-full rounded-md border border-[var(--pdcc-border)] bg-white p-2">
                <option value="internal">Internal</option>
                <option value="customer">Eksternal</option>
              </select>
            </div>
            <Button type="submit" className="col-span-2">
              Undang
            </Button>
          </form>
        </CardContent>
      </Card>
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
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.fullName}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.role}</TableCell>
                  <TableCell>{m.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
