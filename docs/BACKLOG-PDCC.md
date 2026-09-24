# Backlog PDCC — Fase Production (3 Sprint)

Acuan: PRD v1.2, UI Draft (21 layar), implementasi MVP saat ini (JSON store + demo seed).

**Definisi siap sprint:** semua item **Must** lulus acceptance criteria; **Should** minimal 80% atau dicatat defer ke sprint berikutnya.

---

## Sprint 1 — Platform, Auth, Data Nyata

**Tema:** Ganti JSON demo dengan Supabase; auth & RBAC enforce; portfolio/wizard tetap jalan.

| ID | Item | Prioritas | Bab PRD |
|----|------|-----------|---------|
| S1-1 | Repository Supabase untuk semua entitas (`projects`, `baselines`, `tasks`, …) | Must | Model data |
| S1-2 | Supabase Auth (login email) + ganti cookie demo | Must | Settings / RBAC |
| S1-3 | RLS: internal lihat org; `customer` hanya `project_id` assigned | Must | RBAC |
| S1-4 | Seed script → Supabase (project Starlink + template Agile) | Must | — |
| S1-5 | Matriks permission di server actions (block unauthorized) | Must | Halaman 18 |
| S1-6 | Storage bucket: upload SPH PDF, MoM Kick Off (metadata di `project_documents`) | Should | Langkah 1, 4 |
| S1-7 | Migrasi data: one-time import dari `data/pdcc.json` | Could | — |

### Acceptance criteria — Sprint 1

- [ ] **S1-1:** CRUD project + baseline draft lewat Supabase; tidak ada write ke `pdcc.json` saat `NEXT_PUBLIC_SUPABASE_URL` terisi.
- [ ] **S1-2:** User login/logout; session Supabase; middleware validasi session.
- [ ] **S1-3:** Akun pelanggan (Lintasarta) hanya melihat project assigned; API/action return 403 untuk project lain.
- [ ] **S1-4:** `npm run seed` (atau `supabase db seed`) mengisi org LMD, template Custom Application — Agile, 1 project aktif mirror UI Draft.
- [ ] **S1-5:** Finance: read-only (no create project, no approve rebaseline); PM: no org-wide user admin.
- [ ] **S1-6:** File PDF tersimpan di Storage; record dokumen dengan path/URL; max size & MIME PDF enforced.

---

## Sprint 2 — ClickUp & Baseline (sumber kebenaran)

**Tema:** Integrasi ClickUp production; baseline versioning; realisasi MD untuk recap/budget.

| ID | Item | Prioritas | Bab PRD |
|----|------|-----------|---------|
| S2-1 | Generate ClickUp: folder/list/task + simpan `clickup_task_id` per `project_task` | Must | 9, Langkah 5 |
| S2-2 | Sync terjadwal 30 menit: status, time estimate, time tracked | Must | 9.2, 12.3 |
| S2-3 | Antrean sync + retry on rate limit (log failed → retry) | Must | 9.2 |
| S2-4 | Unclassified queue: task baru di CU tanpa `internal_task_id` | Must | 9.2 |
| S2-5 | Aturan: tanggal baseline tidak di-overwrite dari ClickUp | Must | 9.2 |
| S2-6 | Rebaseline workflow: draft → approve internal → approve customer → `active_baseline_id` | Must | Baseline & GAP |
| S2-7 | Diff struktur ke ClickUp saat rebaseline disetujui (delta, bukan full recreate) | Should | 9 |
| S2-8 | Task Recap: data actual MD dari sync (bukan seed statis) | Must | 10.3, 12.1 |
| S2-9 | Budget: realisasi = Σ(time tracked × rate posisi PIC) | Must | 12.3, 8–9 |

### Acceptance criteria — Sprint 2

- [ ] **S2-1:** Setelah Generate, ≥90% task baseline punya `clickup_task_id`; preview app = struktur di workspace test.
- [ ] **S2-2:** Sync manual & cron memperbarui `status`, `actual_md` (dari time tracked) di DB; log sukses/gagal tercatat.
- [ ] **S2-3:** Simulasi 429 ClickUp → job masuk antrean, retry ≤3x, log "rate limit" seperti UI Draft.
- [ ] **S2-4:** Task dibuat manual di CU muncul di halaman ClickUp Sync; "Klasifikasikan" buka Jalur A/B dengan prefill nama.
- [ ] **S2-5:** Ubah due date di ClickUp tidak mengubah `project_phases.start_date/end_date` baseline locked.
- [ ] **S2-6:** Rebaseline 1 draft: baseline berlaku tetap Baseline 0 sampai customer approve; setelah approve, GAP & milestone payment dates recalc.
- [ ] **S2-8:** Export Task Recap xlsx sheet `Task_Detail` berisi subtask/checklist jika ada.
- [ ] **S2-9:** Budget KPI dan tabel per posisi konsisten untuk periode **tertutup** WR; selisih minggu berjalan documented di UI (tooltip).

---

## Sprint 3 — Weekly Report, Jalur B, Drive, Closing

**Tema:** WR otomatis terkunci; aturan penambahan task; dokumen Drive; closing.

| ID | Item | Prioritas | Bab PRD |
|----|------|-----------|---------|
| S3-1 | Cut-off WR: freeze snapshot JSON, `locked=true`, tidak editable | Must | 11 |
| S3-2 | Generate WR Excel dari template (S-curve, SPI, task update) | Must | 11, 15 |
| S3-3 | Generate WR PDF & PPTX (versi internal vs pelanggan tanpa MD) | Should | 11, 15 |
| S3-4 | Revisi WR (Rev. 2): chain revision, Rev. 1 tetap tersimpan | Should | 11 |
| S3-5 | Jalur B: pemeriksaan slack milestone + ambang kumulatif MD (10%) | Must | 16 / PRD |
| S3-6 | Jalur A: wajib rebaseline + approval dua pihak | Must | 16 |
| S3-7 | Google Drive OAuth: tautkan SPH/PO; simpan `drive_file_id` | Should | 14 |
| S3-8 | Termin bayar: tanggal milestone ikut baseline berlaku + rebaseline | Must | Langkah 6 |
| S3-9 | Closing: semua checklist → ajukan closing + arsip rekap final xlsx | Must | 17 |
| S3-10 | Notifikasi email (undangan, pengingat rebaseline, cut-off WR) | Could | 21 |

### Acceptance criteria — Sprint 3

- [ ] **S3-1:** Setelah `published_at`, edit task WR snapshot ditolak; cron `POST /api/cron?job=weekly` idempotent per project/week.
- [ ] **S3-2:** Excel WR dapat dibuka; sheet utama match field UI (Overall Progress, Schedule SPH/Baseline/Forecast, Task Update).
- [ ] **S3-3:** Unduh PDF/PPTX WR aktif (tombol tidak disabled); export pelanggan tidak memuat kolom MD.
- [ ] **S3-5:** Submit Jalur B 6 MD pada Testing dengan slack 4 hari → klasifikasi "masih tertampung"; di atas ambang 15 MD → flag review manajemen.
- [ ] **S3-6:** Jalur A menambah phase/milestone (contoh SAST/DAST) hanya masuk baseline berlaku setelah customer approve.
- [ ] **S3-7:** "Tautkan" buka picker Drive (atau paste fallback); status Superseded untuk SPH REV lama.
- [ ] **S3-8:** UAT 50% planned date bergeser saat Rebaseline 1 approved.
- [ ] **S3-9:** Ajukan Closing disabled sampai checklist 100%; generate "Rekap Task Final" xlsx.

---

## Mapping bab PRD → sprint

| Bab / area PRD | Sprint utama |
|----------------|--------------|
| 6 — SOW, template, scheduler | S1 (data), S2 (recalc rebaseline) |
| 6.2 — Task Template Library | S1 (seed + CRUD sudah ada, harden) |
| 9 — ClickUp generate & sync | S2 |
| 9.2 — Rate limit, unclassified, SoT | S2 |
| 10.3 — Task recap subtask % | S2 |
| 11 — Weekly report freeze, cut-off | S3 |
| 12.1 — Export task detail | S2–S3 |
| 12.3 — Budget dari time tracked | S2 |
| 14 — Dokumen Drive | S3 |
| 15 — SPI / RAG thresholds | S2 (hitung), S3 (WR) |
| RBAC / Settings | S1 |

---

## Peningkatan PRD (dokumen) — paralel Sprint 1

Disarankan revisi PRD v1.3 (1–2 halaman tambahan):

1. Matriks sinkronisasi ClickUp (field-level).
2. Schema snapshot JSON Weekly Report (field wajib).
3. Formula budget KPI vs tabel per posisi (minggu berjalan).
4. Zona waktu cut-off (Asia/Jakarta).

---

## Smoke test end-to-end (setelah Sprint 3)

1. Login DM → Portfolio → Project Baru 7 langkah → Dashboard.
2. Generate ClickUp → sync → Task Recap & Budget terupdate.
3. Ajukan Rebaseline 1 (Jalur A) → approve internal + customer → termin & WR forecast berubah.
4. Jalur B approve → task di baseline berlaku + CU.
5. Cron weekly → WR Minggu N terkunci → export xlsx/pdf.
6. Login pelanggan → Task Recap tanpa MD; WR tanpa MD.
7. Closing setelah checklist + BAST.

---

## Di luar scope 3 sprint (backlog lanjutan)

- SPH PDF parsing / LLM Ruang Lingkup (Bab 6 — fase 2 PRD).
- S-curve & milestone timeline interaktif (visual parity UI Draft halaman 11).
- OAuth ClickUp multi-workspace.
- Lampiran rekap task otomatis ke invoice finance.
- Pendampingan pasca Go Live (status project `pendampingan`).
