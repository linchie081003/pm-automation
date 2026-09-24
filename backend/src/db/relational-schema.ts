import { formatPostgresAuthHint, getPool } from "./pool.js";

export async function ensureRelationalSchema(): Promise<void> {
  const pool = getPool();
  const url = process.env.DATABASE_URL ?? "";
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS pdcc_organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_organization_settings (
      organization_id TEXT PRIMARY KEY REFERENCES pdcc_organizations(id),
      current_user_id TEXT NOT NULL,
      active_project_id TEXT
    );

    CREATE TABLE IF NOT EXISTS pdcc_members (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      party TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_position_rates (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      position_name TEXT NOT NULL,
      rate_per_md NUMERIC NOT NULL,
      effective_from DATE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_holidays (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      holiday_date DATE NOT NULL,
      label TEXT NOT NULL,
      holiday_type TEXT NOT NULL,
      project_id TEXT
    );

    CREATE TABLE IF NOT EXISTS pdcc_task_templates (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      project_type TEXT NOT NULL,
      methodology TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_template_phases (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      weight_pct NUMERIC NOT NULL,
      default_duration_days INT NOT NULL,
      sort_order INT NOT NULL,
      depends_on_phase_id TEXT
    );

    CREATE TABLE IF NOT EXISTS pdcc_template_tasks (
      id TEXT PRIMARY KEY,
      template_phase_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
      default_md NUMERIC NOT NULL,
      sort_order INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_projects (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      customer_name TEXT NOT NULL DEFAULT '',
      customer_contact TEXT,
      pm_member_id TEXT,
      status TEXT NOT NULL,
      wizard_step INT NOT NULL DEFAULT 1,
      sph_number TEXT,
      sph_date DATE,
      sph_duration_days INT,
      sph_total_value NUMERIC,
      sph_implementation_value NUMERIC,
      sph_training_value NUMERIC,
      sph_bucket_md NUMERIC,
      po_number TEXT,
      po_date DATE,
      po_due_date DATE,
      planned_start_date DATE,
      kickoff_planned_date DATE,
      kickoff_actual_date DATE,
      clickup_folder_id TEXT,
      clickup_folder_name TEXT,
      active_baseline_id TEXT,
      progress_actual_pct NUMERIC NOT NULL DEFAULT 0,
      progress_planned_pct NUMERIC NOT NULL DEFAULT 0,
      spi NUMERIC,
      gap_days INT NOT NULL DEFAULT 0,
      rag_status TEXT NOT NULL DEFAULT 'on_track',
      next_milestone TEXT,
      wr_publish_day TEXT NOT NULL DEFAULT 'friday',
      wr_cutoff_time TEXT NOT NULL DEFAULT '17:00',
      wr_export_excel BOOLEAN NOT NULL DEFAULT TRUE,
      wr_export_pptx BOOLEAN NOT NULL DEFAULT TRUE,
      template_id TEXT
    );

    CREATE TABLE IF NOT EXISTS pdcc_baselines (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      version_type TEXT NOT NULL,
      version_label TEXT NOT NULL,
      total_duration_days INT,
      total_md NUMERIC,
      planned_end_date DATE,
      gap_vs_sph_days INT,
      approved_internal_at TIMESTAMPTZ,
      approved_customer_at TIMESTAMPTZ,
      locked BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS pdcc_baseline_gap_reasons (
      baseline_id TEXT NOT NULL,
      reason_key TEXT NOT NULL,
      days INT NOT NULL,
      PRIMARY KEY (baseline_id, reason_key)
    );

    CREATE TABLE IF NOT EXISTS pdcc_phases (
      id TEXT PRIMARY KEY,
      baseline_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      weight_pct NUMERIC NOT NULL,
      duration_days INT NOT NULL,
      start_date DATE,
      end_date DATE,
      sort_order INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_project_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      baseline_id TEXT NOT NULL,
      phase_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
      est_md_baseline0 NUMERIC NOT NULL DEFAULT 0,
      est_md_current NUMERIC NOT NULL DEFAULT 0,
      actual_md NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'to_do',
      pic_member_id TEXT,
      clickup_task_id TEXT,
      internal_task_id TEXT,
      parent_task_id TEXT,
      sort_order INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pdcc_task_checklist_items (
      task_id TEXT NOT NULL,
      sort_order INT NOT NULL,
      name TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE,
      md NUMERIC,
      PRIMARY KEY (task_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS pdcc_documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      title TEXT NOT NULL,
      drive_url TEXT,
      drive_file_id TEXT,
      file_size_kb INT,
      doc_date DATE,
      status TEXT NOT NULL,
      locked BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS pdcc_payment_terms (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      milestone_name TEXT NOT NULL,
      pct NUMERIC NOT NULL,
      amount NUMERIC NOT NULL,
      planned_date DATE,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_kickoff_team (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role_title TEXT,
      party TEXT NOT NULL,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS pdcc_pic_mappings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      position_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_task_additions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      path TEXT NOT NULL,
      task_name TEXT NOT NULL,
      phase_name TEXT,
      est_md NUMERIC,
      reason_category TEXT,
      reason_text TEXT,
      submitted_by TEXT,
      approved_by TEXT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_clickup_logs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      detail TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_unclassified_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      clickup_task_id TEXT NOT NULL,
      task_name TEXT NOT NULL,
      list_name TEXT
    );

    CREATE TABLE IF NOT EXISTS pdcc_weekly_reports (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      week_number INT NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      published_at TIMESTAMPTZ,
      locked BOOLEAN NOT NULL DEFAULT FALSE,
      revision INT NOT NULL DEFAULT 1,
      snapshot_spi NUMERIC,
      snapshot_actual NUMERIC,
      snapshot_planned NUMERIC
    );

    CREATE TABLE IF NOT EXISTS pdcc_notifications (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      project_id TEXT,
      title TEXT NOT NULL,
      body TEXT,
      action_label TEXT,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_activities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_closing_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      item_key TEXT NOT NULL,
      label TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS pdcc_role_permissions (
      organization_id TEXT NOT NULL REFERENCES pdcc_organizations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      permission_key TEXT NOT NULL,
      allowed BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (organization_id, role, permission_key)
    );

    CREATE TABLE IF NOT EXISTS pdcc_wizard_drafts (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      wizard_step INT NOT NULL DEFAULT 1,
      reserved_project_id TEXT NOT NULL,
      project_name TEXT NOT NULL DEFAULT 'Project Baru',
      customer_name TEXT NOT NULL DEFAULT '',
      sph_number TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pdcc_wizard_draft_project (
      draft_id TEXT PRIMARY KEY REFERENCES pdcc_wizard_drafts(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      customer_name TEXT NOT NULL DEFAULT '',
      customer_contact TEXT,
      status TEXT NOT NULL,
      wizard_step INT NOT NULL,
      sph_number TEXT,
      sph_date DATE,
      sph_duration_days INT,
      sph_total_value NUMERIC,
      sph_implementation_value NUMERIC,
      sph_training_value NUMERIC,
      sph_bucket_md NUMERIC,
      po_number TEXT,
      po_date DATE,
      po_due_date DATE,
      planned_start_date DATE,
      kickoff_planned_date DATE,
      kickoff_actual_date DATE,
      clickup_folder_id TEXT,
      clickup_folder_name TEXT,
      active_baseline_id TEXT,
      template_id TEXT,
      progress_actual_pct NUMERIC NOT NULL DEFAULT 0,
      progress_planned_pct NUMERIC NOT NULL DEFAULT 0,
      gap_days INT NOT NULL DEFAULT 0,
      rag_status TEXT NOT NULL DEFAULT 'on_track',
      wr_publish_day TEXT NOT NULL DEFAULT 'friday',
      wr_cutoff_time TEXT NOT NULL DEFAULT '17:00',
      wr_export_excel BOOLEAN NOT NULL DEFAULT TRUE,
      wr_export_pptx BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS pdcc_wizard_draft_baselines (
      id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL REFERENCES pdcc_wizard_drafts(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL,
      version_type TEXT NOT NULL,
      version_label TEXT NOT NULL,
      total_duration_days INT,
      total_md NUMERIC,
      planned_end_date DATE,
      gap_vs_sph_days INT,
      locked BOOLEAN NOT NULL DEFAULT FALSE,
      approved_internal_at TIMESTAMPTZ,
      approved_customer_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS pdcc_wizard_draft_phases (
      id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL REFERENCES pdcc_wizard_drafts(id) ON DELETE CASCADE,
      baseline_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      weight_pct NUMERIC NOT NULL,
      duration_days INT NOT NULL,
      start_date DATE,
      end_date DATE,
      sort_order INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_wizard_draft_tasks (
      id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL REFERENCES pdcc_wizard_drafts(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL,
      baseline_id TEXT NOT NULL,
      phase_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
      est_md_baseline0 NUMERIC NOT NULL DEFAULT 0,
      est_md_current NUMERIC NOT NULL DEFAULT 0,
      actual_md NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'to_do',
      internal_task_id TEXT,
      sort_order INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pdcc_wizard_draft_payment_terms (
      id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL REFERENCES pdcc_wizard_drafts(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL,
      milestone_name TEXT NOT NULL,
      pct NUMERIC NOT NULL,
      amount NUMERIC NOT NULL,
      planned_date DATE,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pdcc_wizard_draft_clickup_logs (
      id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL REFERENCES pdcc_wizard_drafts(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      detail TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization_integrations (
      organization_id TEXT PRIMARY KEY,
      clickup_api_token TEXT,
      clickup_workspace_id TEXT,
      clickup_space_id TEXT,
      google_client_id TEXT,
      google_client_secret TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE pdcc_task_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS clickup_api_token TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS clickup_workspace_id TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS clickup_space_id TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS scope_of_work TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS non_scope_of_work TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS delivery_method TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS pre_kickoff_background TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS pre_kickoff_org_structure TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS pre_kickoff_deliverables TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS pre_kickoff_next_activities TEXT;
    ALTER TABLE pdcc_projects ADD COLUMN IF NOT EXISTS pre_kickoff_approved_at TIMESTAMPTZ;
    ALTER TABLE pdcc_wizard_drafts ADD COLUMN IF NOT EXISTS payload_extras JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE pdcc_wizard_draft_project ADD COLUMN IF NOT EXISTS scope_of_work TEXT;
    ALTER TABLE pdcc_wizard_draft_project ADD COLUMN IF NOT EXISTS non_scope_of_work TEXT;
    ALTER TABLE pdcc_wizard_draft_project ADD COLUMN IF NOT EXISTS delivery_method TEXT;
    ALTER TABLE pdcc_wizard_draft_project ADD COLUMN IF NOT EXISTS pre_kickoff_background TEXT;
    ALTER TABLE pdcc_wizard_draft_project ADD COLUMN IF NOT EXISTS pre_kickoff_org_structure TEXT;
    ALTER TABLE pdcc_wizard_draft_project ADD COLUMN IF NOT EXISTS pre_kickoff_deliverables TEXT;
    ALTER TABLE pdcc_wizard_draft_project ADD COLUMN IF NOT EXISTS pre_kickoff_next_activities TEXT;
    ALTER TABLE pdcc_wizard_draft_project ADD COLUMN IF NOT EXISTS pre_kickoff_approved_at TIMESTAMPTZ;
  `);
  } catch (e) {
    const err = e as { code?: string };
    if (err.code === "28P01" && url) {
      throw new Error(formatPostgresAuthHint(url), { cause: e });
    }
    throw e;
  }
}
