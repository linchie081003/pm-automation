import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings-nav";
import { addPositionRateAction } from "@/lib/actions/settings";
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

export default async function ResourceRatesPage() {
  const db = await getDb();

  return (
    <AppShell title="Harga Resource per Posisi">
      <PageHeader
        eyebrow="Settings"
        title="Harga resource per posisi"
        subtitle="Tarif MD per posisi — berlaku ke depan untuk periode baru."
      />
      <SettingsNav active="/settings/resource-rates" />
      <p className="mb-4 text-sm text-[var(--pdcc-muted)]">
        Pengaturan organisasi — perubahan harga berlaku ke depan (append-only untuk periode tertutup).
      </p>
      <Card className="mb-6 border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Posisi & Harga / MD</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posisi</TableHead>
                <TableHead>Harga / MD</TableHead>
                <TableHead>Berlaku sejak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.positionRates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.positionName}</TableCell>
                  <TableCell>Rp {r.ratePerMd.toLocaleString("id-ID")}</TableCell>
                  <TableCell>{r.effectiveFrom}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        <CardHeader>
          <CardTitle>+ Tambah Posisi</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addPositionRateAction} className="grid max-w-md grid-cols-3 gap-4">
            <div>
              <Label>Posisi</Label>
              <Input name="positionName" />
            </div>
            <div>
              <Label>Harga/MD</Label>
              <Input name="ratePerMd" type="number" />
            </div>
            <div>
              <Label>Berlaku sejak</Label>
              <Input name="effectiveFrom" type="date" />
            </div>
            <Button type="submit" className="col-span-3">
              Simpan
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
