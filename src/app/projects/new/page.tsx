import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { WizardShell } from "@/components/wizard/wizard-shell";
import {
  finishWizardAction,
  generateClickUpAction,
  saveBaselineDraftAction,
  saveKickoffAction,
  savePaymentTermsAction,
  savePreKickoffAction,
  saveSphStepAction,
} from "@/lib/actions/projects";
import { addHolidayAction } from "@/lib/actions/settings";
import { computeGapSideA, computeGapSideB } from "@/lib/domain/gap-analysis";
import { buildClickUpPreview } from "@/lib/domain/clickup-mapper";
import { getDb } from "@/lib/data/store";
import { BtnLink } from "@/components/btn-link";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; step?: string; error?: string }>;
}) {
  const params = await searchParams;
  const db = await getDb();
  const projectId = params.projectId ?? db.projects.find((p) => p.wizardStep < 7)?.id;
  const project = db.projects.find((p) => p.id === projectId);
  const step = Number(params.step ?? project?.wizardStep ?? 1);

  if (!project) {
    return (
      <AppShell title="Project Baru">
        <p>Tidak ada project. Buat dari Portfolio.</p>
        <BtnLink href="/portfolio">Ke Portfolio</BtnLink>
      </AppShell>
    );
  }

  const baseline = db.baselines.find((b) => b.id === project.activeBaselineId);
  const phases = db.phases.filter(
    (p) => p.projectId === project.id && p.baselineId === project.activeBaselineId,
  );
  const tasks = db.tasks.filter(
    (t) => t.projectId === project.id && t.baselineId === project.activeBaselineId,
  );
  const preview = buildClickUpPreview(project.name, phases, tasks);
  const gapA =
    baseline?.totalDurationDays && project.sphDurationDays
      ? computeGapSideA(project.sphDurationDays, baseline.totalDurationDays)
      : null;
  const gapB = computeGapSideB(project.poDueDate, baseline?.plannedEndDate);

  return (
    <AppShell title={`Project Baru — ${project.name}`}>
      <WizardShell step={step} projectId={project.id} projectName={project.name}>
      {step === 1 && (
        <div className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Input SPH (Surat Penawaran Harga)</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form action={saveSphStepAction} className="grid max-w-2xl gap-4">
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <Label>Nama Project</Label>
                <Input name="name" defaultValue={project.name} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nomor SPH</Label>
                  <Input name="sphNumber" />
                </div>
                <div>
                  <Label>Tanggal SPH</Label>
                  <Input name="sphDate" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer</Label>
                  <Input name="customerName" />
                </div>
                <div>
                  <Label>Kontak Customer</Label>
                  <Input name="customerContact" />
                </div>
              </div>
              <div>
                <Label>SPH Duration (hari)</Label>
                <Input name="sphDurationDays" type="number" defaultValue={90} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Implementasi (Rp)</Label>
                  <Input name="sphImplementationValue" type="number" />
                </div>
                <div>
                  <Label>Training Onsite (Rp)</Label>
                  <Input name="sphTrainingValue" type="number" />
                </div>
                <div>
                  <Label>Bucket Mandays</Label>
                  <Input name="sphBucketMd" type="number" />
                </div>
              </div>
              <p className="text-sm text-[var(--pdcc-muted)]">
                Upload SPH PDF — MVP: isi SOW manual pada langkah Baseline Draft. Lampiran dapat diunggah ke Storage Supabase nanti.
              </p>
              <Button type="submit">Simpan & Buat Baseline Draft</Button>
            </form>
          </CardContent>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Baseline Draft</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-0 pb-0">
            <form action={saveBaselineDraftAction} className="grid max-w-3xl gap-4">
              <input type="hidden" name="projectId" value={project.id} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nomor PO</Label>
                  <Input name="poNumber" />
                </div>
                <div>
                  <Label>Tanggal PO</Label>
                  <Input name="poDate" type="date" />
                </div>
                <div>
                  <Label>Due Date PO</Label>
                  <Input name="poDueDate" type="date" />
                </div>
                <div>
                  <Label>Rencana Tanggal Mulai (W1)</Label>
                  <Input name="plannedStartDate" type="date" />
                </div>
              </div>
              <div>
                <Label>Task Template</Label>
                <select
                  name="templateId"
                  className="w-full rounded-md border border-[var(--pdcc-border)] bg-white p-2 text-[var(--pdcc-body)]"
                  defaultValue={db.templates[0]?.id}
                >
                  {db.templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.projectType} • {t.methodology})
                    </option>
                  ))}
                </select>
              </div>
              {phases.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PHASE</TableHead>
                      <TableHead>BOBOT</TableHead>
                      <TableHead>DURASI</TableHead>
                      <TableHead>MULAI</TableHead>
                      <TableHead>SELESAI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phases.map((ph) => (
                      <TableRow key={ph.id}>
                        <TableCell>{ph.name}</TableCell>
                        <TableCell>{ph.weightPct}%</TableCell>
                        <TableCell>{ph.durationDays} hari</TableCell>
                        <TableCell>{ph.startDate}</TableCell>
                        <TableCell>{ph.endDate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {gapA && (
                <p className="text-sm">
                  GAP Sisi A (evaluatif): SPH {gapA.sphDurationDays} vs Draft {gapA.baselineDraftDays} ={" "}
                  {gapA.gapDays >= 0 ? "+" : ""}
                  {gapA.gapDays} hari
                </p>
              )}
              {gapB.poDueDate && (
                <p className="text-sm">
                  GAP Sisi B: Due PO vs selesai draft = {gapB.gapDays} hari
                  {gapB.needsEdit ? " — perlu edit baseline" : ""}
                </p>
              )}
              <Button type="submit">Lanjut ke Pre-Kick Off</Button>
            </form>
          </CardContent>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Paket Pre-Kick Off</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            <div className="flex gap-4">
              <BtnLink href={`/api/export?type=scheduler&projectId=${project.id}`} variant="secondary">
                Unduh Excel Scheduler
              </BtnLink>
              <BtnLink href={`/api/export?type=kickoff-pptx&projectId=${project.id}`} variant="secondary">
                Unduh PPTX Kick Off
              </BtnLink>
            </div>
            <form action={savePreKickoffAction} className="grid max-w-md gap-4">
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <Label>Tanggal Kick Off (rencana)</Label>
                <Input name="kickoffPlannedDate" type="date" />
              </div>
              <Button type="submit">Lanjut ke Kick Off</Button>
            </form>
          </CardContent>
        </div>
      )}

      {step === 4 && (
        <div className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Kick Off</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form action={saveKickoffAction} className="grid max-w-md gap-4">
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <Label>Tanggal Kick Off (aktual)</Label>
                <Input name="kickoffActualDate" type="date" />
              </div>
              <div>
                <Label>MoM / Bukti Persetujuan (referensi file)</Label>
                <Input name="mom" placeholder="BA-KickOff.pdf" />
              </div>
              <Button type="submit">Lanjut ke Konfirmasi ClickUp</Button>
            </form>
          </CardContent>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Generate ClickUp — Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0 pb-0">
            {params.error === "clickup_config" && (
              <p className="rounded-lg border border-[var(--pdcc-danger-fg)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--pdcc-danger-fg)]">
                Konfigurasi ClickUp belum lengkap. Isi API token dan Space ID di{" "}
                <Link href="/settings/integrations" className="font-medium underline">
                  Settings → Integrasi
                </Link>
                .
              </p>
            )}
            <p className="text-sm text-[var(--pdcc-muted)]">
              Baseline 0 terkunci — langkah internal, tidak dikirim ke pelanggan.
            </p>
            <div className="rounded-lg border border-[var(--pdcc-border)] bg-[var(--pdcc-border-light)] p-4 font-mono text-sm">
              <p>Folder: {preview.folderName}</p>
              {preview.lists.map((list) => (
                <div key={list.name} className="ml-4 mt-2">
                  <p>
                    List: {list.name} • {list.durationDays} hari • {list.tasks.length} task
                  </p>
                  <ul className="ml-4 list-disc text-[var(--pdcc-muted)]">
                    {list.tasks.map((t) => (
                      <li key={t.name}>{t.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <form action={generateClickUpAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit">Generate ClickUp</Button>
            </form>
          </CardContent>
        </div>
      )}

      {step === 6 && (
        <div className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Termin Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <p className="mb-4 text-sm text-[var(--pdcc-muted)]">
              Diisi otomatis 25% Kick Off, 50% UAT, 25% Go Live dari nilai SPH.
            </p>
            <form action={savePaymentTermsAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit">Lanjut ke Pengaturan Weekly Report</Button>
            </form>
          </CardContent>
        </div>
      )}

      {step === 7 && (
        <div className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Jadwal Weekly Report</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form action={finishWizardAction} className="grid max-w-lg gap-4">
              <input type="hidden" name="projectId" value={project.id} />
              <div>
                <Label>Hari terbit</Label>
                <Input name="wrPublishDay" defaultValue="friday" />
              </div>
              <div>
                <Label>Waktu cut-off</Label>
                <Input name="wrCutoffTime" defaultValue="17:00" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox name="wrExportExcel" defaultChecked id="xlsx" />
                <Label htmlFor="xlsx">Excel (.xlsx)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox name="wrExportPptx" defaultChecked id="pptx" />
                <Label htmlFor="pptx">PowerPoint (.pptx)</Label>
              </div>
              <Button type="submit">Selesai — Buka Dashboard Project</Button>
            </form>
            <div className="mt-6 border-t border-[var(--pdcc-border)] pt-4">
              <Label>Kalender Hari Libur (tambah manual)</Label>
              <form action={addHolidayAction} className="mt-2 grid grid-cols-3 gap-2">
                <Input name="holidayDate" type="date" />
                <Input name="label" placeholder="Keterangan" />
                <Button type="submit" variant="secondary">
                  + Tambah
                </Button>
              </form>
            </div>
          </CardContent>
        </div>
      )}
      </WizardShell>
    </AppShell>
  );
}
