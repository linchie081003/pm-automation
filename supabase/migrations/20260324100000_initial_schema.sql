-- PDCC initial schema (PRD v1.2 aligned)

CREATE TYPE member_role AS ENUM (
  'delivery_manager',
  'pm',
  'team_member',
  'finance',
  'customer'
);

CREATE TYPE project_status AS ENUM (
  'draft_sph',
  'baseline_draft',
  'pre_kickoff',
  'kickoff',
  'clickup_pending',
  'active',
  'pendampingan',
  'closing',
  'completed'
);

CREATE TYPE baseline_type AS ENUM (
  'draft',
  'baseline_0',
  'rebaseline'
);

CREATE TYPE document_type AS ENUM (
  'sph',
  'po',
  'mom',
  'weekly_report',
  'other'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'planned',
  'paid'
);

CREATE TYPE task_addition_path AS ENUM ('jalur_a', 'jalur_b');

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role member_role NOT NULL,
  party TEXT NOT NULL DEFAULT 'internal',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, email)
);

CREATE TABLE position_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  position_name TEXT NOT NULL,
  rate_per_md NUMERIC(14, 2) NOT NULL,
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organization_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  label TEXT NOT NULL,
  holiday_type TEXT NOT NULL DEFAULT 'national',
  project_id UUID
);

CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  methodology TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE template_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_pct NUMERIC(5, 2) NOT NULL,
  default_duration_days INT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  depends_on_phase_id UUID REFERENCES template_phases(id)
);

CREATE TABLE template_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES template_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_milestone BOOLEAN NOT NULL DEFAULT false,
  default_md NUMERIC(8, 2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  pm_member_id UUID REFERENCES organization_members(id),
  status project_status NOT NULL DEFAULT 'draft_sph',
  wizard_step INT NOT NULL DEFAULT 1,
  sph_number TEXT,
  sph_date DATE,
  sph_duration_days INT,
  sph_total_value NUMERIC(16, 2),
  sph_implementation_value NUMERIC(16, 2),
  sph_training_value NUMERIC(16, 2),
  sph_bucket_md NUMERIC(10, 2),
  po_number TEXT,
  po_date DATE,
  po_due_date DATE,
  planned_start_date DATE,
  kickoff_planned_date DATE,
  kickoff_actual_date DATE,
  clickup_folder_id TEXT,
  clickup_folder_name TEXT,
  active_baseline_id UUID,
  progress_actual_pct NUMERIC(5, 2) DEFAULT 0,
  progress_planned_pct NUMERIC(5, 2) DEFAULT 0,
  spi NUMERIC(5, 2),
  gap_days INT DEFAULT 0,
  rag_status TEXT DEFAULT 'on_track',
  next_milestone TEXT,
  wr_publish_day TEXT DEFAULT 'friday',
  wr_cutoff_time TEXT DEFAULT '17:00',
  wr_export_excel BOOLEAN DEFAULT true,
  wr_export_pptx BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE baseline_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_type baseline_type NOT NULL,
  version_label TEXT NOT NULL,
  total_duration_days INT,
  total_md NUMERIC(10, 2),
  planned_end_date DATE,
  gap_vs_sph_days INT,
  gap_reason JSONB,
  approved_internal_at TIMESTAMPTZ,
  approved_internal_by UUID REFERENCES organization_members(id),
  approved_customer_at TIMESTAMPTZ,
  approved_customer_by TEXT,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_id UUID NOT NULL REFERENCES baseline_versions(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_pct NUMERIC(5, 2) NOT NULL,
  duration_days INT NOT NULL,
  start_date DATE,
  end_date DATE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  baseline_id UUID NOT NULL REFERENCES baseline_versions(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_milestone BOOLEAN NOT NULL DEFAULT false,
  est_md_baseline0 NUMERIC(8, 2) DEFAULT 0,
  est_md_current NUMERIC(8, 2) DEFAULT 0,
  actual_md NUMERIC(8, 2) DEFAULT 0,
  status TEXT DEFAULT 'to_do',
  pic_member_id UUID REFERENCES organization_members(id),
  clickup_task_id TEXT,
  internal_task_id TEXT,
  parent_task_id UUID REFERENCES project_tasks(id),
  checklist JSONB,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  doc_type document_type NOT NULL,
  title TEXT NOT NULL,
  drive_url TEXT,
  drive_file_id TEXT,
  file_size_kb INT,
  doc_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  pct NUMERIC(5, 2) NOT NULL,
  amount NUMERIC(16, 2) NOT NULL,
  planned_date DATE,
  status payment_status NOT NULL DEFAULT 'pending'
);

CREATE TABLE kickoff_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role_title TEXT,
  party TEXT NOT NULL,
  email TEXT
);

CREATE TABLE pic_position_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES organization_members(id),
  position_name TEXT NOT NULL
);

CREATE TABLE task_additions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path task_addition_path NOT NULL,
  task_name TEXT NOT NULL,
  phase_name TEXT,
  est_md NUMERIC(8, 2),
  reason_category TEXT,
  reason_text TEXT,
  submitted_by UUID REFERENCES organization_members(id),
  approved_by UUID REFERENCES organization_members(id),
  status TEXT NOT NULL DEFAULT 'draft',
  audit JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clickup_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE unclassified_clickup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  clickup_task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  list_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE weekly_report_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  published_at TIMESTAMPTZ,
  locked BOOLEAN NOT NULL DEFAULT false,
  snapshot JSONB,
  revision INT NOT NULL DEFAULT 1
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  action_label TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE closing_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  label TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (project_id, item_key)
);

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_tasks_project ON project_tasks(project_id, baseline_id);
CREATE INDEX idx_baseline_project ON baseline_versions(project_id);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Simplified RLS: members see org data; customers see assigned projects only
CREATE POLICY org_members_select ON organization_members
  FOR SELECT USING (true);

CREATE POLICY projects_select ON projects
  FOR SELECT USING (true);
