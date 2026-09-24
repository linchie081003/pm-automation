import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { WizardShell } from "@/components/wizard/wizard-shell";
import {
  addHolidayFormAction,
  finishWizardFormAction,
  generateClickUpFormAction,
  saveBaselineDraftFormAction,
  saveKickoffFormAction,
  savePaymentTermsFormAction,
  savePreKickoffFormAction,
  saveSphStepFormAction,
} from "@/lib/actions/form-actions";
import { ServerActionForm } from "@/components/form/server-action-form";
import { computeGapSideA, computeGapSideB } from "@/lib/domain/gap-analysis";
import { buildClickUpPreview } from "@/lib/domain/clickup-mapper";
import { defaultSphTimeline } from "@/lib/domain/sph-timeline";
import { apiGetWizardDraft } from "@/lib/wizard-draft-api";
import { BtnLink } from "@/components/btn-link";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function TimelineRowsEditor({
  prefix,
  rows,
}: {
  prefix: "timeline" | "preko";
  rows: { name: string; durationWorkingDays: number }[];
}) {
  const slots = Array.from({ length: Math.max(rows.length, 4) }, (_, i) => rows[i] ?? { name: "", durationWorkingDays: 0 });
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--pdcc-title)]">Timeline (hari kerja per tahap)</p>
      {slots.map((row, i) => (
        <div key={`${prefix}-${i}`} className="grid grid-cols-[1fr_120px] gap-2">
          <Input name={`${prefix}Name_${i}`} placeholder="Nama tahap" defaultValue={row.name} />
          <Input
            name={`${prefix}Days_${i}`}
            type="number"
            min={1}
            placeholder="Hari"
            defaultValue={row.durationWorkingDays || ""}
          />
        </div>
      ))}
      <p className="text-xs text-[var(--pdcc-muted)]">
        Start/end dihitung otomatis dari estimasi mulai project, hanya hari kerja, dikurangi libur nasional.
      </p>
    </div>
  );
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ draftId?: string; step?: string; error?: string }>;
}) {
  const params = await searchParams;
  const draftId = params.draftId;
  if (!draftId) {
    return (
      <AppShell title="Project Baru">
        <p>Tidak ada draft wizard. Buat project baru dari Portfolio.</p>
        <BtnLink href="/portfolio">Ke Portfolio</BtnLink>
      </AppShell>
    );
  }

  let draft;
  try {
    draft = await apiGetWizardDraft(draftId);
  } catch {
    return (
      <AppShell title="Project Baru">
        <p>Draft wizard tidak ditemukan atau sudah dibatalkan.</p>
        <BtnLink href="/portfolio">Ke Portfolio</BtnLink>
      </AppShell>
    );
  }

  const project = draft.payload.project;
  const step = Number(params.step ?? project.wizardStep ?? 1);
  const sphTimeline =
    draft.payload.sphTimeline?.length > 0
      ? draft.payload.sphTimeline
      : defaultSphTimeline(project.sphDurationDays ?? 90);
  const brief = draft.payload.preKickoffBrief;

  const baseline = draft.payload.baselines.find((b) => b.id === project.activeBaselineId);
  const phases = draft.payload.phases.filter(
    (p) => p.projectId === project.id && p.baselineId === project.activeBaselineId,
  );
  const tasks = draft.payload.tasks.filter(
    (t) => t.projectId === project.id && t.baselineId === project.activeBaselineId,
  );
  const prekoTimeline =
    phases.length > 0
      ? phases
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p) => ({ name: p.name, durationWorkingDays: p.durationDays }))
      : sphTimeline;

  const preview = buildClickUpPreview(project.name, phases, tasks);
  const gapA =
    baseline?.totalDurationDays && project.sphDurationDays
      ? computeGapSideA(project.sphDurationDays, baseline.totalDurationDays)
      : null;
  const gapB = computeGapSideB(project.poDueDate, baseline?.plannedEndDate);

  return (
    <AppShell title={`Project Baru — ${project.name}`}>
      <WizardShell step={step} draftId={draftId} projectName={project.name}>
        {step === 1 && (
          <div className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Input SPH & Timeline Kontrak</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <ServerActionForm action={saveSphStepFormAction} className="grid max-w-2xl gap-4">
                <input type="hidden" name="draftId" value={draftId} />
                <div>
                  <Label>Nama Project</Label>
                  <Input name="name" defaultValue={project.name} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nomor SPH</Label>
                    <Input name="sphNumber" defaultValue={project.sphNumber} />
                  </div>
                  <div>
                    <Label>Tanggal SPH</Label>
                    <Input name="sphDate" type="date" defaultValue={project.sphDate} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer</Label>
                    <Input name="customerName" defaultValue={project.customerName} />
                  </div>
                  <div>
                    <Label>Kontak Customer</Label>
                    <Input name="customerContact" defaultValue={project.customerContact} />
                  </div>
                </div>
                <div>
                  <Label>Durasi SPH (total hari kerja)</Label>
                  <Input
                    name="sphDurationDays"
                    type="number"
                    defaultValue={project.sphDurationDays ?? 90}
                  />
                </div>
                <div>
                  <Label>Scope of Work</Label>
                  <Textarea name="scopeOfWork" rows={3} defaultValue={project.scopeOfWork} />
                </div>
                <div>
                  <Label>Non-Scope</Label>
                  <Textarea name="nonScopeOfWork" rows={2} defaultValue={project.nonScopeOfWork} />
                </div>
                <div>
                  <Label>Metode delivery</Label>
                  <Input name="deliveryMethod" defaultValue={project.deliveryMethod} placeholder="Onsite / Remote / Hybrid" />
                </div>
                <TimelineRowsEditor prefix="timeline" rows={sphTimeline} />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Implementasi (Rp)</Label>
                    <Input name="sphImplementationValue" type="number" defaultValue={project.sphImplementationValue} />
                  </div>
                  <div>
                    <Label>Training Onsite (Rp)</Label>
                    <Input name="sphTrainingValue" type="number" defaultValue={project.sphTrainingValue} />
                  </div>
                  <div>
                    <Label>Bucket Mandays</Label>
                    <Input name="sphBucketMd" type="number" defaultValue={project.sphBucketMd} />
                  </div>
                </div>
                <Button type="submit">Simpan & Baseline Draft (PO)</Button>
              </ServerActionForm>
            </CardContent>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Baseline Draft 0 — dari Timeline SPH</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-0">
              <ServerActionForm action={saveBaselineDraftFormAction} className="grid max-w-3xl gap-4">
                <input type="hidden" name="draftId" value={draftId} />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nomor PO</Label>
                    <Input name="poNumber" defaultValue={project.poNumber} />
                  </div>
                  <div>
                    <Label>Tanggal PO</Label>
                    <Input name="poDate" type="date" defaultValue={project.poDate} />
                  </div>
                  <div>
                    <Label>Due Date PO (target pelanggan)</Label>
                    <Input name="poDueDate" type="date" defaultValue={project.poDueDate} />
                  </div>
                  <div>
                    <Label>Estimasi mulai project (W1)</Label>
                    <Input name="plannedStartDate" type="date" defaultValue={project.plannedStartDate} required />
                  </div>
                </div>
                <TimelineRowsEditor prefix="timeline" rows={sphTimeline} />
                {phases.length > 0 && project.plannedStartDate && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PHASE</TableHead>
                        <TableHead>BOBOT</TableHead>
                        <TableHead>HARI KERJA</TableHead>
                        <TableHead>MULAI</TableHead>
                        <TableHead>SELESAI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {phases.map((ph) => (
                        <TableRow key={ph.id}>
                          <TableCell>{ph.name}</TableCell>
                          <TableCell>{ph.weightPct}%</TableCell>
                          <TableCell>{ph.durationDays}</TableCell>
                          <TableCell>{ph.startDate}</TableCell>
                          <TableCell>{ph.endDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {gapA && (
                  <p className="text-sm">
                    GAP Sisi A: SPH {gapA.sphDurationDays} vs draft {gapA.baselineDraftDays} ={" "}
                    {gapA.gapDays >= 0 ? "+" : ""}
                    {gapA.gapDays} hari kerja
                  </p>
                )}
                {gapB.poDueDate && baseline?.plannedEndDate && (
                  <p className="text-sm">
                    GAP Sisi B: Due PO vs selesai draft = {gapB.gapDays} hari
                    {gapB.needsEdit ? " — negosiasi di Pre-Kick Off" : ""}
                  </p>
                )}
                <Button type="submit">Generate baseline & lanjut Pre-Kick Off</Button>
              </ServerActionForm>
            </CardContent>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Pre-Kick Off — materi & negosiasi timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-0 pb-0">
              <p className="text-sm text-[var(--pdcc-muted)]">
                Konten di bawah di-generate dari SPH dan baseline draft. Anda dapat mengubah teks sebelum
                persetujuan internal. Timeline dapat dipercepat dengan mengedit durasi per tahap.
              </p>
              <div className="flex flex-wrap gap-4">
                <BtnLink href={`/api/export?type=scheduler&projectId=${project.id}`} variant="secondary">
                  Unduh Excel Scheduler
                </BtnLink>
              </div>
              <ServerActionForm action={savePreKickoffFormAction} className="grid max-w-3xl gap-4">
                <input type="hidden" name="draftId" value={draftId} />
                <div>
                  <Label>Latar belakang</Label>
                  <Textarea name="briefBackground" rows={3} defaultValue={brief?.background ?? project.preKickoffBackground} />
                </div>
                <div>
                  <Label>Scope of Work</Label>
                  <Textarea name="briefScope" rows={3} defaultValue={brief?.scopeOfWork ?? project.scopeOfWork} />
                </div>
                <div>
                  <Label>Non-Scope</Label>
                  <Textarea name="briefNonScope" rows={2} defaultValue={brief?.nonScopeOfWork ?? project.nonScopeOfWork} />
                </div>
                <div>
                  <Label>Struktur organisasi proyek</Label>
                  <Textarea name="briefOrg" rows={3} defaultValue={brief?.orgStructure ?? project.preKickoffOrgStructure} />
                </div>
                <div>
                  <Label>Deliverables</Label>
                  <Textarea name="briefDeliverables" rows={3} defaultValue={brief?.deliverables ?? project.preKickoffDeliverables} />
                </div>
                <div>
                  <Label>Aktivitas berikutnya</Label>
                  <Textarea name="briefNext" rows={3} defaultValue={brief?.nextActivities ?? project.preKickoffNextActivities} />
                </div>
                <div>
                  <Label>Estimasi mulai project (dasar penjadwalan ulang)</Label>
                  <Input
                    name="plannedStartDate"
                    type="date"
                    required
                    defaultValue={project.plannedStartDate}
                  />
                </div>
                <TimelineRowsEditor prefix="preko" rows={prekoTimeline} />
                {phases.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tahap</TableHead>
                        <TableHead>Mulai</TableHead>
                        <TableHead>Selesai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {phases.map((ph) => (
                        <TableRow key={ph.id}>
                          <TableCell>{ph.name}</TableCell>
                          <TableCell>{ph.startDate}</TableCell>
                          <TableCell>{ph.endDate}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div>
                  <Label>Tanggal Kick Off (rencana)</Label>
                  <Input name="kickoffPlannedDate" type="date" defaultValue={project.kickoffPlannedDate} />
                </div>
                <label htmlFor="preko-ok" className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name="preKickoffApproved"
                    id="preko-ok"
                    className="size-4 rounded border border-[var(--pdcc-border)] accent-[var(--pdcc-primary)]"
                  />
                  <span className="text-sm">Materi Pre-Kick Off disetujui internal</span>
                </label>
                <Button type="submit">Setujui & lanjut Kick Off</Button>
              </ServerActionForm>
            </CardContent>
          </div>
        )}

        {step === 4 && (
          <div className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Kick Off — dari materi Pre-Kick Off disetujui</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-0 pb-0">
              {!project.preKickoffApprovedAt ? (
                <p className="text-sm text-[var(--pdcc-danger-fg)]">
                  Pre-Kick Off belum disetujui. Kembali ke langkah 3.
                </p>
              ) : (
                <>
                  <div className="rounded-lg border border-[var(--pdcc-border)] bg-[var(--pdcc-border-light)]/40 p-4 text-sm space-y-2">
                    <p className="font-medium">Ringkasan materi (read-only)</p>
                    <p>{project.preKickoffBackground ?? brief?.background}</p>
                    <p className="text-[var(--pdcc-muted)]">
                      Target selesai draft: {baseline?.plannedEndDate ?? "—"} • PO due: {project.poDueDate ?? "—"}
                    </p>
                  </div>
                  <BtnLink href={`/api/export?type=kickoff-pptx&projectId=${project.id}`} variant="secondary">
                    Unduh deck Kick Off
                  </BtnLink>
                </>
              )}
              <ServerActionForm action={saveKickoffFormAction} className="grid max-w-md gap-4">
                <input type="hidden" name="draftId" value={draftId} />
                <div>
                  <Label>Tanggal Kick Off (aktual)</Label>
                  <Input name="kickoffActualDate" type="date" defaultValue={project.kickoffActualDate} />
                </div>
                <div>
                  <Label>MoM / Bukti Persetujuan (referensi file)</Label>
                  <Input name="mom" placeholder="BA-KickOff.pdf" />
                </div>
                <Button type="submit" disabled={!project.preKickoffApprovedAt}>
                  Lanjut ke Konfirmasi ClickUp
                </Button>
              </ServerActionForm>
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
              <ServerActionForm action={generateClickUpFormAction}>
                <input type="hidden" name="draftId" value={draftId} />
                <Button type="submit">Generate ClickUp</Button>
              </ServerActionForm>
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
              <ServerActionForm action={savePaymentTermsFormAction}>
                <input type="hidden" name="draftId" value={draftId} />
                <Button type="submit">Lanjut ke Pengaturan Weekly Report</Button>
              </ServerActionForm>
            </CardContent>
          </div>
        )}

        {step === 7 && (
          <div className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Jadwal Weekly Report</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <ServerActionForm action={finishWizardFormAction} className="grid max-w-lg gap-4">
                <input type="hidden" name="draftId" value={draftId} />
                <div>
                  <Label>Hari terbit</Label>
                  <Input name="wrPublishDay" defaultValue="friday" />
                </div>
                <div>
                  <Label>Waktu cut-off</Label>
                  <Input name="wrCutoffTime" defaultValue="17:00" />
                </div>
                <label htmlFor="xlsx" className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name="wrExportExcel"
                    id="xlsx"
                    defaultChecked
                    className="size-4 rounded border border-[var(--pdcc-border)] accent-[var(--pdcc-primary)]"
                  />
                  <span className="text-sm">Excel (.xlsx)</span>
                </label>
                <label htmlFor="pptx" className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name="wrExportPptx"
                    id="pptx"
                    defaultChecked
                    className="size-4 rounded border border-[var(--pdcc-border)] accent-[var(--pdcc-primary)]"
                  />
                  <span className="text-sm">PowerPoint (.pptx)</span>
                </label>
                <Button type="submit">Selesai — Buka Dashboard Project</Button>
              </ServerActionForm>
              <div className="mt-6 border-t border-[var(--pdcc-border)] pt-4">
                <Label>Kalender Hari Libur (tambah manual)</Label>
                <ServerActionForm action={addHolidayFormAction} className="mt-2 grid grid-cols-3 gap-2">
                  <Input name="holidayDate" type="date" />
                  <Input name="label" placeholder="Keterangan" />
                  <Button type="submit" variant="secondary">
                    + Tambah
                  </Button>
                </ServerActionForm>
              </div>
            </CardContent>
          </div>
        )}
      </WizardShell>
    </AppShell>
  );
}
