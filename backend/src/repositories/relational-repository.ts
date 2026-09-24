import { createSeedDatabase } from "../../../src/lib/data/seed.ts";
import type {
  BaselineVersion,
  PdccDatabase,
  Project,
  ProjectTask,
  TaskTemplate,
} from "../../../src/lib/types.ts";
import { pgDate, pgTimestamptz } from "../db/pg-values.js";
import { ensureRelationalSchema } from "../db/relational-schema.js";
import { getPool } from "../db/pool.js";

export interface OrganizationIntegrations {
  organizationId: string;
  clickupApiToken?: string;
  clickupWorkspaceId?: string;
  clickupSpaceId?: string;
}

export { isProjectDeletable } from "../../../src/lib/project-rules.ts";

async function migrateLegacyJsonIfNeeded(pool: Awaited<ReturnType<typeof getPool>>): Promise<void> {
  const count = await pool.query(`SELECT COUNT(*)::int AS c FROM pdcc_projects`);
  if ((count.rows[0]?.c ?? 0) > 0) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pdcc_application_state (
      singleton_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  const legacy = await pool.query<{ payload: PdccDatabase }>(
    `SELECT payload FROM pdcc_application_state WHERE singleton_id = 1`,
  );
  if (legacy.rows[0]?.payload) {
    await persistApplicationState(legacy.rows[0].payload);
    await pool.query(`DROP TABLE IF EXISTS pdcc_application_state`);
    return;
  }
  await persistApplicationState(createSeedDatabase());
}

export async function loadApplicationState(): Promise<PdccDatabase> {
  await ensureRelationalSchema();
  const pool = getPool();
  await migrateLegacyJsonIfNeeded(pool);

  const orgRes = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM pdcc_organizations LIMIT 1`,
  );
  if (!orgRes.rows[0]) {
    await persistApplicationState(createSeedDatabase());
    return loadApplicationState();
  }
  const org = orgRes.rows[0];
  const settings = await pool.query<{
    current_user_id: string;
    active_project_id: string | null;
  }>(`SELECT current_user_id, active_project_id FROM pdcc_organization_settings WHERE organization_id = $1`, [
    org.id,
  ]);
  const meta = settings.rows[0];

  const members = (
    await pool.query(
      `SELECT id, organization_id AS "organizationId", email, full_name AS "fullName", role, party, status
       FROM pdcc_members WHERE organization_id = $1`,
      [org.id],
    )
  ).rows;

  const positionRates = (
    await pool.query(
      `SELECT id, organization_id AS "organizationId", position_name AS "positionName",
              rate_per_md AS "ratePerMd", effective_from::text AS "effectiveFrom"
       FROM pdcc_position_rates WHERE organization_id = $1`,
      [org.id],
    )
  ).rows;

  const holidays = (
    await pool.query(
      `SELECT id, organization_id AS "organizationId", holiday_date::text AS "holidayDate",
              label, holiday_type AS "holidayType", project_id AS "projectId"
       FROM pdcc_holidays WHERE organization_id = $1`,
      [org.id],
    )
  ).rows;

  const templateRows = await pool.query(
    `SELECT id, organization_id AS "organizationId", name, project_type AS "projectType", methodology,
            COALESCE(is_active, TRUE) AS "isActive"
     FROM pdcc_task_templates WHERE organization_id = $1`,
    [org.id],
  );
  const templates: TaskTemplate[] = [];
  for (const t of templateRows.rows) {
    const phases = await pool.query(
      `SELECT id, name, weight_pct AS "weightPct", default_duration_days AS "defaultDurationDays",
              sort_order AS "sortOrder", depends_on_phase_id AS "dependsOnPhaseId"
       FROM pdcc_template_phases WHERE template_id = $1 ORDER BY sort_order`,
      [t.id],
    );
    const phasesWithTasks = [];
    for (const ph of phases.rows) {
      const tasks = await pool.query(
        `SELECT id, name, is_milestone AS "isMilestone", default_md AS "defaultMd", sort_order AS "sortOrder"
         FROM pdcc_template_tasks WHERE template_phase_id = $1 ORDER BY sort_order`,
        [ph.id],
      );
      phasesWithTasks.push({ ...ph, tasks: tasks.rows });
    }
    templates.push({ ...t, isActive: Boolean(t.isActive), phases: phasesWithTasks });
  }

  const projects = (
    await pool.query(
      `SELECT id, organization_id AS "organizationId", name, customer_name AS "customerName",
              customer_contact AS "customerContact", pm_member_id AS "pmMemberId", status,
              wizard_step AS "wizardStep", sph_number AS "sphNumber", sph_date::text AS "sphDate",
              sph_duration_days AS "sphDurationDays", sph_total_value AS "sphTotalValue",
              sph_implementation_value AS "sphImplementationValue", sph_training_value AS "sphTrainingValue",
              sph_bucket_md AS "sphBucketMd", po_number AS "poNumber", po_date::text AS "poDate",
              po_due_date::text AS "poDueDate", planned_start_date::text AS "plannedStartDate",
              kickoff_planned_date::text AS "kickoffPlannedDate", kickoff_actual_date::text AS "kickoffActualDate",
              clickup_folder_id AS "clickupFolderId", clickup_folder_name AS "clickupFolderName",
              clickup_api_token AS "clickupApiToken", clickup_workspace_id AS "clickupWorkspaceId",
              clickup_space_id AS "clickupSpaceId",
              active_baseline_id AS "activeBaselineId", progress_actual_pct AS "progressActualPct",
              progress_planned_pct AS "progressPlannedPct", spi, gap_days AS "gapDays", rag_status AS "ragStatus",
              next_milestone AS "nextMilestone", wr_publish_day AS "wrPublishDay", wr_cutoff_time AS "wrCutoffTime",
              wr_export_excel AS "wrExportExcel", wr_export_pptx AS "wrExportPptx", template_id AS "templateId",
              scope_of_work AS "scopeOfWork", non_scope_of_work AS "nonScopeOfWork", delivery_method AS "deliveryMethod",
              pre_kickoff_background AS "preKickoffBackground", pre_kickoff_org_structure AS "preKickoffOrgStructure",
              pre_kickoff_deliverables AS "preKickoffDeliverables", pre_kickoff_next_activities AS "preKickoffNextActivities",
              pre_kickoff_approved_at::text AS "preKickoffApprovedAt"
       FROM pdcc_projects WHERE organization_id = $1`,
      [org.id],
    )
  ).rows.map((row) => ({
    ...row,
    progressActualPct: Number(row.progressActualPct),
    progressPlannedPct: Number(row.progressPlannedPct),
    spi: row.spi != null && row.spi !== "" ? Number(row.spi) : undefined,
    gapDays: Number(row.gapDays),
    wizardStep: Number(row.wizardStep),
  })) as Project[];

  const baselinesRaw = (
    await pool.query(
      `SELECT id, project_id AS "projectId", version_type AS "versionType", version_label AS "versionLabel",
              total_duration_days AS "totalDurationDays", total_md AS "totalMd",
              planned_end_date::text AS "plannedEndDate", gap_vs_sph_days AS "gapVsSphDays",
              approved_internal_at::text AS "approvedInternalAt", approved_customer_at::text AS "approvedCustomerAt",
              locked
       FROM pdcc_baselines`,
    )
  ).rows as BaselineVersion[];

  const baselines: BaselineVersion[] = [];
  for (const bl of baselinesRaw) {
    const gaps = await pool.query<{ reason_key: string; days: number }>(
      `SELECT reason_key, days FROM pdcc_baseline_gap_reasons WHERE baseline_id = $1`,
      [bl.id],
    );
    if (gaps.rowCount) {
      const gapReason: Record<string, number> = {};
      for (const g of gaps.rows) gapReason[g.reason_key] = g.days;
      baselines.push({ ...bl, gapReason });
    } else {
      baselines.push(bl);
    }
  }

  const phases = (
    await pool.query(
      `SELECT id, baseline_id AS "baselineId", project_id AS "projectId", name, weight_pct AS "weightPct",
              duration_days AS "durationDays", start_date::text AS "startDate", end_date::text AS "endDate",
              sort_order AS "sortOrder"
       FROM pdcc_phases`,
    )
  ).rows;

  const taskRows = await pool.query(
    `SELECT id, project_id AS "projectId", baseline_id AS "baselineId", phase_id AS "phaseId", name,
            is_milestone AS "isMilestone", est_md_baseline0 AS "estMdBaseline0", est_md_current AS "estMdCurrent",
            actual_md AS "actualMd", status, pic_member_id AS "picMemberId", clickup_task_id AS "clickupTaskId",
            internal_task_id AS "internalTaskId", parent_task_id AS "parentTaskId", sort_order AS "sortOrder"
     FROM pdcc_project_tasks`,
  );
  const tasks: ProjectTask[] = [];
  for (const row of taskRows.rows) {
    const checklist = await pool.query(
      `SELECT name, done, md FROM pdcc_task_checklist_items WHERE task_id = $1 ORDER BY sort_order`,
      [row.id],
    );
    tasks.push({
      ...row,
      checklist: checklist.rowCount
        ? checklist.rows.map((c) => ({
            name: c.name,
            done: c.done,
            md: c.md ?? undefined,
          }))
        : undefined,
    });
  }

  const documents = (
    await pool.query(
      `SELECT id, project_id AS "projectId", doc_type AS "docType", title, drive_url AS "driveUrl",
              drive_file_id AS "driveFileId", file_size_kb AS "fileSizeKb", doc_date::text AS "docDate",
              status, locked
       FROM pdcc_documents`,
    )
  ).rows;

  const paymentTerms = (
    await pool.query(
      `SELECT id, project_id AS "projectId", milestone_name AS "milestoneName", pct, amount,
              planned_date::text AS "plannedDate", status
       FROM pdcc_payment_terms`,
    )
  ).rows;

  const kickoffTeams = (
    await pool.query(
      `SELECT id, project_id AS "projectId", full_name AS "fullName", role_title AS "roleTitle",
              party, email
       FROM pdcc_kickoff_team`,
    )
  ).rows;

  const picMappings = (
    await pool.query(
      `SELECT id, project_id AS "projectId", member_id AS "memberId", position_name AS "positionName"
       FROM pdcc_pic_mappings`,
    )
  ).rows;

  const taskAdditions = (
    await pool.query(
      `SELECT id, project_id AS "projectId", path, task_name AS "taskName", phase_name AS "phaseName",
              est_md AS "estMd", reason_category AS "reasonCategory", reason_text AS "reasonText",
              submitted_by AS "submittedBy", approved_by AS "approvedBy", status
       FROM pdcc_task_additions`,
    )
  ).rows;

  const clickupLogs = (
    await pool.query(
      `SELECT id, project_id AS "projectId", direction, detail, status, created_at::text AS "createdAt"
       FROM pdcc_clickup_logs`,
    )
  ).rows;

  const unclassifiedTasks = (
    await pool.query(
      `SELECT id, project_id AS "projectId", clickup_task_id AS "clickupTaskId",
              task_name AS "taskName", list_name AS "listName"
       FROM pdcc_unclassified_tasks`,
    )
  ).rows;

  const weeklyReports = (
    await pool.query(
      `SELECT id, project_id AS "projectId", week_number AS "weekNumber",
              period_start::text AS "periodStart", period_end::text AS "periodEnd",
              published_at::text AS "publishedAt", locked, revision,
              snapshot_spi AS "snapshotSpi", snapshot_actual AS "snapshotActual",
              snapshot_planned AS "snapshotPlanned"
       FROM pdcc_weekly_reports`,
    )
  ).rows.map((wr) => ({
    id: wr.id,
    projectId: wr.projectId,
    weekNumber: wr.weekNumber,
    periodStart: wr.periodStart,
    periodEnd: wr.periodEnd,
    publishedAt: wr.publishedAt,
    locked: wr.locked,
    revision: wr.revision,
    snapshot:
      wr.snapshotSpi != null
        ? { spi: Number(wr.snapshotSpi), actual: Number(wr.snapshotActual), planned: Number(wr.snapshotPlanned) }
        : undefined,
  }));

  const notifications = (
    await pool.query(
      `SELECT id, organization_id AS "organizationId", project_id AS "projectId", title, body,
              action_label AS "actionLabel", read, created_at::text AS "createdAt"
       FROM pdcc_notifications WHERE organization_id = $1`,
      [org.id],
    )
  ).rows;

  const activities = (
    await pool.query(
      `SELECT id, project_id AS "projectId", message, created_at::text AS "createdAt"
       FROM pdcc_activities`,
    )
  ).rows;

  const closingChecklist = (
    await pool.query(
      `SELECT id, project_id AS "projectId", item_key AS "itemKey", label, completed
       FROM pdcc_closing_items`,
    )
  ).rows;

  const rolePermissionGrants = (
    await pool.query(
      `SELECT role, permission_key AS "permissionKey", allowed
       FROM pdcc_role_permissions WHERE organization_id = $1`,
      [org.id],
    )
  ).rows;

  return {
    organization: org,
    members,
    positionRates,
    holidays,
    templates,
    projects,
    baselines,
    phases,
    tasks,
    documents,
    paymentTerms,
    kickoffTeams,
    picMappings,
    taskAdditions,
    clickupLogs,
    unclassifiedTasks,
    weeklyReports,
    notifications,
    activities,
    closingChecklist,
    rolePermissionGrants,
    currentUserId: meta?.current_user_id ?? members[0]?.id ?? "",
    activeProjectId: meta?.active_project_id ?? undefined,
  };
}

export async function persistApplicationState(db: PdccDatabase): Promise<void> {
  await ensureRelationalSchema();
  const pool = getPool();
  const client = await pool.connect();
  const orgId = db.organization.id;

  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO pdcc_organizations (id, name) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [db.organization.id, db.organization.name],
    );
    await client.query(
      `INSERT INTO pdcc_organization_settings (organization_id, current_user_id, active_project_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id) DO UPDATE SET
         current_user_id = EXCLUDED.current_user_id,
         active_project_id = EXCLUDED.active_project_id`,
      [orgId, db.currentUserId, db.activeProjectId ?? null],
    );

    const wipe = [
      `DELETE FROM pdcc_task_checklist_items WHERE task_id IN (SELECT id FROM pdcc_project_tasks WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1))`,
      `DELETE FROM pdcc_project_tasks WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_phases WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_baseline_gap_reasons WHERE baseline_id IN (SELECT id FROM pdcc_baselines WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1))`,
      `DELETE FROM pdcc_baselines WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_documents WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_payment_terms WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_kickoff_team WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_pic_mappings WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_task_additions WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_clickup_logs WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_unclassified_tasks WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_weekly_reports WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_activities WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_closing_items WHERE project_id IN (SELECT id FROM pdcc_projects WHERE organization_id = $1)`,
      `DELETE FROM pdcc_projects WHERE organization_id = $1`,
      `DELETE FROM pdcc_template_tasks WHERE template_phase_id IN (SELECT id FROM pdcc_template_phases WHERE template_id IN (SELECT id FROM pdcc_task_templates WHERE organization_id = $1))`,
      `DELETE FROM pdcc_template_phases WHERE template_id IN (SELECT id FROM pdcc_task_templates WHERE organization_id = $1)`,
      `DELETE FROM pdcc_task_templates WHERE organization_id = $1`,
      `DELETE FROM pdcc_holidays WHERE organization_id = $1`,
      `DELETE FROM pdcc_position_rates WHERE organization_id = $1`,
      `DELETE FROM pdcc_members WHERE organization_id = $1`,
      `DELETE FROM pdcc_role_permissions WHERE organization_id = $1`,
      `DELETE FROM pdcc_notifications WHERE organization_id = $1`,
    ];
    for (const sql of wipe) await client.query(sql, [orgId]);

    for (const m of db.members) {
      await client.query(
        `INSERT INTO pdcc_members (id, organization_id, email, full_name, role, party, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [m.id, m.organizationId, m.email, m.fullName, m.role, m.party, m.status],
      );
    }
    for (const g of db.rolePermissionGrants ?? []) {
      await client.query(
        `INSERT INTO pdcc_role_permissions (organization_id, role, permission_key, allowed)
         VALUES ($1,$2,$3,$4)`,
        [orgId, g.role, g.permissionKey, g.allowed],
      );
    }
    for (const r of db.positionRates) {
      await client.query(
        `INSERT INTO pdcc_position_rates (id, organization_id, position_name, rate_per_md, effective_from)
         VALUES ($1,$2,$3,$4,$5)`,
        [r.id, r.organizationId, r.positionName, r.ratePerMd, r.effectiveFrom],
      );
    }
    for (const h of db.holidays) {
      await client.query(
        `INSERT INTO pdcc_holidays (id, organization_id, holiday_date, label, holiday_type, project_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [h.id, h.organizationId, h.holidayDate, h.label, h.holidayType, h.projectId ?? null],
      );
    }
    for (const t of db.templates) {
      await client.query(
        `INSERT INTO pdcc_task_templates (id, organization_id, name, project_type, methodology, is_active)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [t.id, t.organizationId, t.name, t.projectType, t.methodology, t.isActive !== false],
      );
      for (const ph of t.phases) {
        await client.query(
          `INSERT INTO pdcc_template_phases (id, template_id, name, weight_pct, default_duration_days, sort_order, depends_on_phase_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [ph.id, t.id, ph.name, ph.weightPct, ph.defaultDurationDays, ph.sortOrder, ph.dependsOnPhaseId ?? null],
        );
        for (const tt of ph.tasks) {
          await client.query(
            `INSERT INTO pdcc_template_tasks (id, template_phase_id, name, is_milestone, default_md, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [tt.id, ph.id, tt.name, tt.isMilestone, tt.defaultMd, tt.sortOrder],
          );
        }
      }
    }
    for (const p of db.projects) {
      await client.query(
        `INSERT INTO pdcc_projects (
           id, organization_id, name, customer_name, customer_contact, pm_member_id, status, wizard_step,
           sph_number, sph_date, sph_duration_days, sph_total_value, sph_implementation_value, sph_training_value,
           sph_bucket_md, po_number, po_date, po_due_date, planned_start_date, kickoff_planned_date,
           kickoff_actual_date, clickup_folder_id, clickup_folder_name,
           clickup_api_token, clickup_workspace_id, clickup_space_id,
           active_baseline_id,
           progress_actual_pct, progress_planned_pct, spi, gap_days, rag_status, next_milestone,
           wr_publish_day, wr_cutoff_time, wr_export_excel, wr_export_pptx, template_id,
           scope_of_work, non_scope_of_work, delivery_method,
           pre_kickoff_background, pre_kickoff_org_structure, pre_kickoff_deliverables, pre_kickoff_next_activities,
           pre_kickoff_approved_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46)`,
        [
          p.id, p.organizationId, p.name, p.customerName, p.customerContact ?? null, p.pmMemberId ?? null,
          p.status, p.wizardStep, p.sphNumber ?? null, pgDate(p.sphDate), p.sphDurationDays ?? null,
          p.sphTotalValue ?? null, p.sphImplementationValue ?? null, p.sphTrainingValue ?? null,
          p.sphBucketMd ?? null, p.poNumber ?? null, pgDate(p.poDate), pgDate(p.poDueDate),
          pgDate(p.plannedStartDate), pgDate(p.kickoffPlannedDate), pgDate(p.kickoffActualDate),
          p.clickupFolderId ?? null, p.clickupFolderName ?? null,
          p.clickupApiToken ?? null, p.clickupWorkspaceId ?? null, p.clickupSpaceId ?? null,
          p.activeBaselineId ?? null,
          p.progressActualPct, p.progressPlannedPct, p.spi ?? null, p.gapDays, p.ragStatus,
          p.nextMilestone ?? null, p.wrPublishDay, p.wrCutoffTime, p.wrExportExcel, p.wrExportPptx,
          p.templateId ?? null,
          p.scopeOfWork ?? null, p.nonScopeOfWork ?? null, p.deliveryMethod ?? null,
          p.preKickoffBackground ?? null, p.preKickoffOrgStructure ?? null, p.preKickoffDeliverables ?? null,
          p.preKickoffNextActivities ?? null, pgTimestamptz(p.preKickoffApprovedAt),
        ],
      );
    }
    for (const bl of db.baselines) {
      await client.query(
        `INSERT INTO pdcc_baselines (id, project_id, version_type, version_label, total_duration_days, total_md,
          planned_end_date, gap_vs_sph_days, approved_internal_at, approved_customer_at, locked)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          bl.id, bl.projectId, bl.versionType, bl.versionLabel, bl.totalDurationDays ?? null, bl.totalMd ?? null,
          pgDate(bl.plannedEndDate), bl.gapVsSphDays ?? null, pgTimestamptz(bl.approvedInternalAt),
          pgTimestamptz(bl.approvedCustomerAt), bl.locked,
        ],
      );
      if (bl.gapReason) {
        for (const [reason_key, days] of Object.entries(bl.gapReason)) {
          await client.query(
            `INSERT INTO pdcc_baseline_gap_reasons (baseline_id, reason_key, days) VALUES ($1,$2,$3)`,
            [bl.id, reason_key, days],
          );
        }
      }
    }
    for (const ph of db.phases) {
      await client.query(
        `INSERT INTO pdcc_phases (id, baseline_id, project_id, name, weight_pct, duration_days, start_date, end_date, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [ph.id, ph.baselineId, ph.projectId, ph.name, ph.weightPct, ph.durationDays, pgDate(ph.startDate), pgDate(ph.endDate), ph.sortOrder],
      );
    }
    for (const t of db.tasks) {
      await client.query(
        `INSERT INTO pdcc_project_tasks (id, project_id, baseline_id, phase_id, name, is_milestone,
          est_md_baseline0, est_md_current, actual_md, status, pic_member_id, clickup_task_id,
          internal_task_id, parent_task_id, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          t.id, t.projectId, t.baselineId, t.phaseId, t.name, t.isMilestone, t.estMdBaseline0, t.estMdCurrent,
          t.actualMd, t.status, t.picMemberId ?? null, t.clickupTaskId ?? null, t.internalTaskId ?? null,
          t.parentTaskId ?? null, t.sortOrder,
        ],
      );
      if (t.checklist) {
        let i = 0;
        for (const c of t.checklist) {
          await client.query(
            `INSERT INTO pdcc_task_checklist_items (task_id, sort_order, name, done, md) VALUES ($1,$2,$3,$4,$5)`,
            [t.id, i++, c.name, c.done, c.md ?? null],
          );
        }
      }
    }
    for (const d of db.documents) {
      await client.query(
        `INSERT INTO pdcc_documents (id, project_id, doc_type, title, drive_url, drive_file_id, file_size_kb, doc_date, status, locked)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [d.id, d.projectId, d.docType, d.title, d.driveUrl ?? null, d.driveFileId ?? null, d.fileSizeKb ?? null, pgDate(d.docDate), d.status, d.locked],
      );
    }
    for (const pay of db.paymentTerms) {
      await client.query(
        `INSERT INTO pdcc_payment_terms (id, project_id, milestone_name, pct, amount, planned_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [pay.id, pay.projectId, pay.milestoneName, pay.pct, pay.amount, pgDate(pay.plannedDate), pay.status],
      );
    }
    for (const k of db.kickoffTeams) {
      await client.query(
        `INSERT INTO pdcc_kickoff_team (id, project_id, full_name, role_title, party, email)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [k.id, k.projectId, k.fullName, k.roleTitle ?? null, k.party, k.email ?? null],
      );
    }
    for (const pic of db.picMappings) {
      await client.query(
        `INSERT INTO pdcc_pic_mappings (id, project_id, member_id, position_name) VALUES ($1,$2,$3,$4)`,
        [pic.id, pic.projectId, pic.memberId, pic.positionName],
      );
    }
    for (const a of db.taskAdditions) {
      await client.query(
        `INSERT INTO pdcc_task_additions (id, project_id, path, task_name, phase_name, est_md, reason_category, reason_text, submitted_by, approved_by, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [a.id, a.projectId, a.path, a.taskName, a.phaseName ?? null, a.estMd ?? null, a.reasonCategory ?? null, a.reasonText ?? null, a.submittedBy ?? null, a.approvedBy ?? null, a.status],
      );
    }
    for (const log of db.clickupLogs) {
      await client.query(
        `INSERT INTO pdcc_clickup_logs (id, project_id, direction, detail, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [log.id, log.projectId, log.direction, log.detail, log.status, log.createdAt],
      );
    }
    for (const u of db.unclassifiedTasks) {
      await client.query(
        `INSERT INTO pdcc_unclassified_tasks (id, project_id, clickup_task_id, task_name, list_name)
         VALUES ($1,$2,$3,$4,$5)`,
        [u.id, u.projectId, u.clickupTaskId, u.taskName, u.listName ?? null],
      );
    }
    for (const wr of db.weeklyReports) {
      await client.query(
        `INSERT INTO pdcc_weekly_reports (id, project_id, week_number, period_start, period_end, published_at, locked, revision, snapshot_spi, snapshot_actual, snapshot_planned)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          wr.id, wr.projectId, wr.weekNumber, wr.periodStart, wr.periodEnd, wr.publishedAt ?? null, wr.locked,
          wr.revision, wr.snapshot?.spi ?? null, wr.snapshot?.actual ?? null, wr.snapshot?.planned ?? null,
        ],
      );
    }
    for (const n of db.notifications) {
      await client.query(
        `INSERT INTO pdcc_notifications (id, organization_id, project_id, title, body, action_label, read, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [n.id, n.organizationId, n.projectId ?? null, n.title, n.body ?? null, n.actionLabel ?? null, n.read, n.createdAt],
      );
    }
    for (const act of db.activities) {
      await client.query(
        `INSERT INTO pdcc_activities (id, project_id, message, created_at) VALUES ($1,$2,$3,$4)`,
        [act.id, act.projectId, act.message, act.createdAt],
      );
    }
    for (const c of db.closingChecklist) {
      await client.query(
        `INSERT INTO pdcc_closing_items (id, project_id, item_key, label, completed) VALUES ($1,$2,$3,$4,$5)`,
        [c.id, c.projectId, c.itemKey, c.label, c.completed],
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function deleteProjectById(projectId: string): Promise<void> {
  const db = await loadApplicationState();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) {
    throw new Error("Project tidak ditemukan");
  }
  if (!isProjectDeletable(project)) {
    throw new Error(
      "Project tidak dapat dihapus: sudah ada progress atau project sudah dimulai",
    );
  }

  db.projects = db.projects.filter((p) => p.id !== projectId);
  const strip = <T extends { projectId: string }>(rows: T[]) =>
    rows.filter((r) => r.projectId !== projectId);
  db.baselines = strip(db.baselines);
  db.phases = strip(db.phases);
  db.tasks = strip(db.tasks);
  db.documents = strip(db.documents);
  db.paymentTerms = strip(db.paymentTerms);
  db.kickoffTeams = strip(db.kickoffTeams);
  db.picMappings = strip(db.picMappings);
  db.taskAdditions = strip(db.taskAdditions);
  db.clickupLogs = strip(db.clickupLogs);
  db.unclassifiedTasks = strip(db.unclassifiedTasks);
  db.weeklyReports = strip(db.weeklyReports);
  db.activities = strip(db.activities);
  db.closingChecklist = strip(db.closingChecklist);
  db.notifications = db.notifications.filter((n) => n.projectId !== projectId);

  if (db.activeProjectId === projectId) {
    db.activeProjectId = db.projects.find((p) => p.status === "active")?.id ?? db.projects[0]?.id;
  }

  await persistApplicationState(db);
}

export async function loadIntegrations(
  organizationId: string,
): Promise<OrganizationIntegrations> {
  await ensureRelationalSchema();
  const pool = getPool();
  const res = await pool.query<{
    organization_id: string;
    clickup_api_token: string | null;
    clickup_workspace_id: string | null;
    clickup_space_id: string | null;
  }>(
    `SELECT organization_id, clickup_api_token, clickup_workspace_id, clickup_space_id
     FROM organization_integrations WHERE organization_id = $1`,
    [organizationId],
  );
  const row = res.rows[0];
  if (!row) return { organizationId };
  return {
    organizationId: row.organization_id,
    clickupApiToken: row.clickup_api_token ?? undefined,
    clickupWorkspaceId: row.clickup_workspace_id ?? undefined,
    clickupSpaceId: row.clickup_space_id ?? undefined,
  };
}

export async function saveIntegrations(
  config: OrganizationIntegrations,
): Promise<void> {
  await ensureRelationalSchema();
  const pool = getPool();
  await pool.query(
    `INSERT INTO organization_integrations (
       organization_id, clickup_api_token, clickup_workspace_id, clickup_space_id, updated_at
     ) VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (organization_id)
     DO UPDATE SET
       clickup_api_token = EXCLUDED.clickup_api_token,
       clickup_workspace_id = EXCLUDED.clickup_workspace_id,
       clickup_space_id = EXCLUDED.clickup_space_id,
       updated_at = NOW()`,
    [
      config.organizationId,
      config.clickupApiToken ?? null,
      config.clickupWorkspaceId ?? null,
      config.clickupSpaceId ?? null,
    ],
  );
}
