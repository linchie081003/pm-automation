import type { WizardDraftPayload } from "../../../src/lib/wizard-draft-types.ts";
import type { Project } from "../../../src/lib/types.ts";
import { pgDate, pgTimestamptz } from "../db/pg-values.js";
import { ensureRelationalSchema } from "../db/relational-schema.js";
import { getPool } from "../db/pool.js";

export interface WizardDraftRow {
  draftId: string;
  organizationId: string;
  wizardStep: number;
  payload: WizardDraftPayload;
}

export async function createWizardDraft(
  organizationId: string,
  project: Project,
): Promise<WizardDraftRow> {
  await ensureRelationalSchema();
  const pool = getPool();
  const draftId = `wzd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const payload: WizardDraftPayload = {
    project,
    baselines: [],
    phases: [],
    tasks: [],
    paymentTerms: [],
    clickupLogs: [],
    sphTimeline: [],
    preKickoffBrief: {
      background: "",
      scopeOfWork: "",
      nonScopeOfWork: "",
      orgStructure: "",
      deliverables: "",
      nextActivities: "",
    },
  };
  await pool.query(
    `INSERT INTO pdcc_wizard_drafts (id, organization_id, wizard_step, reserved_project_id, updated_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [draftId, organizationId, project.wizardStep, project.id],
  );
  await saveWizardDraftPayload(draftId, payload);
  return { draftId, organizationId, wizardStep: project.wizardStep, payload };
}

async function saveWizardDraftPayload(
  draftId: string,
  payload: WizardDraftPayload,
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE pdcc_wizard_drafts SET
       wizard_step = $2,
       project_name = $3,
       customer_name = $4,
       sph_number = $5,
       payload_extras = $6,
       updated_at = NOW()
     WHERE id = $1`,
    [
      draftId,
      payload.project.wizardStep,
      payload.project.name,
      payload.project.customerName,
      payload.project.sphNumber ?? null,
      JSON.stringify({
        sphTimeline: payload.sphTimeline ?? [],
        preKickoffBrief: payload.preKickoffBrief ?? {},
      }),
    ],
  );
  for (const table of [
    "pdcc_wizard_draft_baselines",
    "pdcc_wizard_draft_phases",
    "pdcc_wizard_draft_tasks",
    "pdcc_wizard_draft_payment_terms",
    "pdcc_wizard_draft_clickup_logs",
  ]) {
    await pool.query(`DELETE FROM ${table} WHERE draft_id = $1`, [draftId]);
  }
  await pool.query(`DELETE FROM pdcc_wizard_draft_project WHERE draft_id = $1`, [draftId]);

  const p = payload.project;
  await pool.query(
    `INSERT INTO pdcc_wizard_draft_project (
       draft_id, project_id, organization_id, name, customer_name, customer_contact, status, wizard_step,
       sph_number, sph_date, sph_duration_days, sph_total_value, sph_implementation_value, sph_training_value,
       sph_bucket_md, po_number, po_date, po_due_date, planned_start_date, kickoff_planned_date,
       kickoff_actual_date, clickup_folder_id, clickup_folder_name, active_baseline_id, template_id,
       progress_actual_pct, progress_planned_pct, gap_days, rag_status, wr_publish_day, wr_cutoff_time,
       wr_export_excel, wr_export_pptx,
       scope_of_work, non_scope_of_work, delivery_method,
       pre_kickoff_background, pre_kickoff_org_structure, pre_kickoff_deliverables, pre_kickoff_next_activities,
       pre_kickoff_approved_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,
       $26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41
     )`,
    [
      draftId, p.id, p.organizationId, p.name, p.customerName, p.customerContact ?? null, p.status,
      p.wizardStep, p.sphNumber ?? null, pgDate(p.sphDate), p.sphDurationDays ?? null,
      p.sphTotalValue ?? null, p.sphImplementationValue ?? null, p.sphTrainingValue ?? null,
      p.sphBucketMd ?? null, p.poNumber ?? null, pgDate(p.poDate), pgDate(p.poDueDate),
      pgDate(p.plannedStartDate), pgDate(p.kickoffPlannedDate), pgDate(p.kickoffActualDate),
      p.clickupFolderId ?? null, p.clickupFolderName ?? null, p.activeBaselineId ?? null,
      p.templateId ?? null, p.progressActualPct, p.progressPlannedPct, p.gapDays, p.ragStatus,
      p.wrPublishDay, p.wrCutoffTime, p.wrExportExcel, p.wrExportPptx,
      p.scopeOfWork ?? null, p.nonScopeOfWork ?? null, p.deliveryMethod ?? null,
      p.preKickoffBackground ?? null, p.preKickoffOrgStructure ?? null, p.preKickoffDeliverables ?? null,
      p.preKickoffNextActivities ?? null, pgTimestamptz(p.preKickoffApprovedAt),
    ],
  );

  for (const bl of payload.baselines) {
    await pool.query(
      `INSERT INTO pdcc_wizard_draft_baselines (id, draft_id, project_id, version_type, version_label,
        total_duration_days, total_md, planned_end_date, gap_vs_sph_days, locked,
        approved_internal_at, approved_customer_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        bl.id, draftId, bl.projectId, bl.versionType, bl.versionLabel, bl.totalDurationDays ?? null,
        bl.totalMd ?? null, pgDate(bl.plannedEndDate), bl.gapVsSphDays ?? null, bl.locked,
        pgTimestamptz(bl.approvedInternalAt), pgTimestamptz(bl.approvedCustomerAt),
      ],
    );
  }
  for (const ph of payload.phases) {
    await pool.query(
      `INSERT INTO pdcc_wizard_draft_phases (id, draft_id, baseline_id, project_id, name, weight_pct,
        duration_days, start_date, end_date, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        ph.id, draftId, ph.baselineId, ph.projectId, ph.name, ph.weightPct, ph.durationDays,
        pgDate(ph.startDate), pgDate(ph.endDate), ph.sortOrder,
      ],
    );
  }
  for (const t of payload.tasks) {
    await pool.query(
      `INSERT INTO pdcc_wizard_draft_tasks (id, draft_id, project_id, baseline_id, phase_id, name,
        is_milestone, est_md_baseline0, est_md_current, actual_md, status, internal_task_id, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        t.id, draftId, t.projectId, t.baselineId, t.phaseId, t.name, t.isMilestone,
        t.estMdBaseline0, t.estMdCurrent, t.actualMd, t.status, t.internalTaskId ?? null, t.sortOrder,
      ],
    );
  }
  for (const pay of payload.paymentTerms) {
    await pool.query(
      `INSERT INTO pdcc_wizard_draft_payment_terms (id, draft_id, project_id, milestone_name, pct, amount, planned_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [pay.id, draftId, pay.projectId, pay.milestoneName, pay.pct, pay.amount, pgDate(pay.plannedDate), pay.status],
    );
  }
  for (const log of payload.clickupLogs) {
    await pool.query(
      `INSERT INTO pdcc_wizard_draft_clickup_logs (id, draft_id, project_id, direction, detail, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [log.id, draftId, log.projectId, log.direction, log.detail, log.status, log.createdAt],
    );
  }
}

export async function loadWizardDraft(draftId: string): Promise<WizardDraftRow | null> {
  await ensureRelationalSchema();
  const pool = getPool();
  const head = await pool.query<{
    id: string;
    organization_id: string;
    wizard_step: number;
    payload_extras: { sphTimeline?: WizardDraftPayload["sphTimeline"]; preKickoffBrief?: WizardDraftPayload["preKickoffBrief"] };
  }>(`SELECT id, organization_id, wizard_step, payload_extras FROM pdcc_wizard_drafts WHERE id = $1`, [draftId]);
  if (!head.rows[0]) return null;

  const pr = await pool.query(`SELECT * FROM pdcc_wizard_draft_project WHERE draft_id = $1`, [draftId]);
  const row = pr.rows[0];
  if (!row) return null;

  const project: Project = {
    id: row.project_id,
    organizationId: row.organization_id,
    name: row.name,
    customerName: row.customer_name ?? "",
    customerContact: row.customer_contact ?? undefined,
    status: row.status,
    wizardStep: Number(row.wizard_step),
    sphNumber: row.sph_number ?? undefined,
    sphDate: row.sph_date ? String(row.sph_date).slice(0, 10) : undefined,
    sphDurationDays: row.sph_duration_days ?? undefined,
    sphTotalValue: row.sph_total_value != null ? Number(row.sph_total_value) : undefined,
    sphImplementationValue: row.sph_implementation_value != null ? Number(row.sph_implementation_value) : undefined,
    sphTrainingValue: row.sph_training_value != null ? Number(row.sph_training_value) : undefined,
    sphBucketMd: row.sph_bucket_md != null ? Number(row.sph_bucket_md) : undefined,
    poNumber: row.po_number ?? undefined,
    poDate: row.po_date ? String(row.po_date).slice(0, 10) : undefined,
    poDueDate: row.po_due_date ? String(row.po_due_date).slice(0, 10) : undefined,
    plannedStartDate: row.planned_start_date ? String(row.planned_start_date).slice(0, 10) : undefined,
    kickoffPlannedDate: row.kickoff_planned_date ? String(row.kickoff_planned_date).slice(0, 10) : undefined,
    kickoffActualDate: row.kickoff_actual_date ? String(row.kickoff_actual_date).slice(0, 10) : undefined,
    clickupFolderId: row.clickup_folder_id ?? undefined,
    clickupFolderName: row.clickup_folder_name ?? undefined,
    activeBaselineId: row.active_baseline_id ?? undefined,
    templateId: row.template_id ?? undefined,
    progressActualPct: Number(row.progress_actual_pct),
    progressPlannedPct: Number(row.progress_planned_pct),
    gapDays: Number(row.gap_days),
    ragStatus: row.rag_status,
    wrPublishDay: row.wr_publish_day,
    wrCutoffTime: row.wr_cutoff_time,
    wrExportExcel: row.wr_export_excel,
    wrExportPptx: row.wr_export_pptx,
    scopeOfWork: row.scope_of_work ?? undefined,
    nonScopeOfWork: row.non_scope_of_work ?? undefined,
    deliveryMethod: row.delivery_method ?? undefined,
    preKickoffBackground: row.pre_kickoff_background ?? undefined,
    preKickoffOrgStructure: row.pre_kickoff_org_structure ?? undefined,
    preKickoffDeliverables: row.pre_kickoff_deliverables ?? undefined,
    preKickoffNextActivities: row.pre_kickoff_next_activities ?? undefined,
    preKickoffApprovedAt: row.pre_kickoff_approved_at
      ? String(row.pre_kickoff_approved_at)
      : undefined,
  };

  const extras = head.rows[0].payload_extras ?? {};
  const sphTimeline = extras.sphTimeline ?? [];
  const preKickoffBrief = extras.preKickoffBrief ?? {
    background: project.preKickoffBackground ?? "",
    scopeOfWork: project.scopeOfWork ?? "",
    nonScopeOfWork: project.nonScopeOfWork ?? "",
    orgStructure: project.preKickoffOrgStructure ?? "",
    deliverables: project.preKickoffDeliverables ?? "",
    nextActivities: project.preKickoffNextActivities ?? "",
  };

  const baselines = (await pool.query(`SELECT * FROM pdcc_wizard_draft_baselines WHERE draft_id = $1`, [draftId])).rows.map(
    (b) => ({
      id: b.id,
      projectId: b.project_id,
      versionType: b.version_type,
      versionLabel: b.version_label,
      totalDurationDays: b.total_duration_days ?? undefined,
      totalMd: b.total_md != null ? Number(b.total_md) : undefined,
      plannedEndDate: b.planned_end_date ? String(b.planned_end_date).slice(0, 10) : undefined,
      gapVsSphDays: b.gap_vs_sph_days ?? undefined,
      approvedInternalAt: b.approved_internal_at ? String(b.approved_internal_at) : undefined,
      approvedCustomerAt: b.approved_customer_at ? String(b.approved_customer_at) : undefined,
      locked: b.locked,
    }),
  );

  const phases = (await pool.query(`SELECT * FROM pdcc_wizard_draft_phases WHERE draft_id = $1`, [draftId])).rows.map(
    (ph) => ({
      id: ph.id,
      baselineId: ph.baseline_id,
      projectId: ph.project_id,
      name: ph.name,
      weightPct: Number(ph.weight_pct),
      durationDays: Number(ph.duration_days),
      startDate: ph.start_date ? String(ph.start_date).slice(0, 10) : undefined,
      endDate: ph.end_date ? String(ph.end_date).slice(0, 10) : undefined,
      sortOrder: Number(ph.sort_order),
    }),
  );

  const tasks = (await pool.query(`SELECT * FROM pdcc_wizard_draft_tasks WHERE draft_id = $1`, [draftId])).rows.map(
    (t) => ({
      id: t.id,
      projectId: t.project_id,
      baselineId: t.baseline_id,
      phaseId: t.phase_id,
      name: t.name,
      isMilestone: t.is_milestone,
      estMdBaseline0: Number(t.est_md_baseline0),
      estMdCurrent: Number(t.est_md_current),
      actualMd: Number(t.actual_md),
      status: t.status,
      internalTaskId: t.internal_task_id ?? undefined,
      sortOrder: Number(t.sort_order),
    }),
  );

  const paymentTerms = (await pool.query(`SELECT * FROM pdcc_wizard_draft_payment_terms WHERE draft_id = $1`, [draftId])).rows.map(
    (pay) => ({
      id: pay.id,
      projectId: pay.project_id,
      milestoneName: pay.milestone_name,
      pct: Number(pay.pct),
      amount: Number(pay.amount),
      plannedDate: pay.planned_date ? String(pay.planned_date).slice(0, 10) : undefined,
      status: pay.status,
    }),
  );

  const clickupLogs = (await pool.query(`SELECT * FROM pdcc_wizard_draft_clickup_logs WHERE draft_id = $1`, [draftId])).rows.map(
    (log) => ({
      id: log.id,
      projectId: log.project_id,
      direction: log.direction,
      detail: log.detail,
      status: log.status,
      createdAt: String(log.created_at),
    }),
  );

  return {
    draftId,
    organizationId: head.rows[0].organization_id,
    wizardStep: head.rows[0].wizard_step,
    payload: { project, baselines, phases, tasks, paymentTerms, clickupLogs, sphTimeline, preKickoffBrief },
  };
}

export async function updateWizardDraft(
  draftId: string,
  payload: WizardDraftPayload,
): Promise<void> {
  await saveWizardDraftPayload(draftId, payload);
}

export async function deleteWizardDraft(draftId: string): Promise<void> {
  await ensureRelationalSchema();
  const pool = getPool();
  await pool.query(`DELETE FROM pdcc_wizard_drafts WHERE id = $1`, [draftId]);
}

export async function findWizardDraftByProjectId(
  projectId: string,
): Promise<WizardDraftRow | null> {
  await ensureRelationalSchema();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `SELECT draft_id AS id FROM pdcc_wizard_draft_project WHERE project_id = $1 LIMIT 1`,
    [projectId],
  );
  if (!res.rows[0]) return null;
  return loadWizardDraft(res.rows[0].id);
}

export async function commitWizardDraft(draftId: string): Promise<string> {
  const draft = await loadWizardDraft(draftId);
  if (!draft) throw new Error("Draft wizard tidak ditemukan");

  const { loadApplicationState, persistApplicationState } = await import(
    "./relational-repository.js"
  );
  const db = await loadApplicationState();
  const { payload } = draft;
  const projectId = payload.project.id;

  const alreadyInPortfolio = db.projects.some((p) => p.id === projectId);
  // #region agent log
  fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df436c" },
    body: JSON.stringify({
      sessionId: "df436c",
      runId: "verify-wizard",
      hypothesisId: "H3",
      location: "wizard-draft-repository.ts:commitWizardDraft",
      message: "Commit wizard to portfolio",
      data: { draftId, projectId, alreadyInPortfolio, portfolioCountBefore: db.projects.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (alreadyInPortfolio) {
    throw new Error("Project sudah ada di portfolio");
  }

  db.projects.push(payload.project);
  db.baselines.push(...payload.baselines);
  db.phases.push(...payload.phases);
  db.tasks.push(...payload.tasks);
  db.paymentTerms.push(...payload.paymentTerms);
  db.clickupLogs.unshift(...payload.clickupLogs);
  db.activeProjectId = projectId;

  await persistApplicationState(db);
  await deleteWizardDraft(draftId);
  return projectId;
}
