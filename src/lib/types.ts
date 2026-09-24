export type MemberRole =
  | "delivery_manager"
  | "pm"
  | "team_member"
  | "finance"
  | "customer";

export type ProjectStatus =
  | "draft_sph"
  | "baseline_draft"
  | "pre_kickoff"
  | "kickoff"
  | "clickup_pending"
  | "active"
  | "pendampingan"
  | "closing"
  | "completed";

export type BaselineType = "draft" | "baseline_0" | "rebaseline";

export interface Organization {
  id: string;
  name: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: MemberRole;
  party: "internal" | "customer";
  status: "active" | "invited";
}

export interface PositionRate {
  id: string;
  organizationId: string;
  positionName: string;
  ratePerMd: number;
  effectiveFrom: string;
}

export interface Holiday {
  id: string;
  organizationId: string;
  holidayDate: string;
  label: string;
  holidayType: string;
  projectId?: string;
}

export interface TemplatePhase {
  id: string;
  name: string;
  weightPct: number;
  defaultDurationDays: number;
  sortOrder: number;
  dependsOnPhaseId?: string;
  tasks: TemplateTask[];
}

export interface TemplateTask {
  id: string;
  name: string;
  isMilestone: boolean;
  defaultMd: number;
  sortOrder: number;
}

export interface TaskTemplate {
  id: string;
  organizationId: string;
  name: string;
  projectType: string;
  methodology: string;
  phases: TemplatePhase[];
}

export interface BaselineVersion {
  id: string;
  projectId: string;
  versionType: BaselineType;
  versionLabel: string;
  totalDurationDays?: number;
  totalMd?: number;
  plannedEndDate?: string;
  gapVsSphDays?: number;
  gapReason?: Record<string, number>;
  approvedInternalAt?: string;
  approvedCustomerAt?: string;
  locked: boolean;
}

export interface ProjectPhase {
  id: string;
  baselineId: string;
  projectId: string;
  name: string;
  weightPct: number;
  durationDays: number;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  baselineId: string;
  phaseId: string;
  name: string;
  isMilestone: boolean;
  estMdBaseline0: number;
  estMdCurrent: number;
  actualMd: number;
  status: string;
  picMemberId?: string;
  clickupTaskId?: string;
  internalTaskId?: string;
  parentTaskId?: string;
  checklist?: { name: string; done: boolean; md?: number }[];
  sortOrder: number;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  customerName: string;
  customerContact?: string;
  pmMemberId?: string;
  status: ProjectStatus;
  wizardStep: number;
  sphNumber?: string;
  sphDate?: string;
  sphDurationDays?: number;
  sphTotalValue?: number;
  sphImplementationValue?: number;
  sphTrainingValue?: number;
  sphBucketMd?: number;
  poNumber?: string;
  poDate?: string;
  poDueDate?: string;
  plannedStartDate?: string;
  kickoffPlannedDate?: string;
  kickoffActualDate?: string;
  clickupFolderId?: string;
  clickupFolderName?: string;
  activeBaselineId?: string;
  progressActualPct: number;
  progressPlannedPct: number;
  spi?: number;
  gapDays: number;
  ragStatus: string;
  nextMilestone?: string;
  wrPublishDay: string;
  wrCutoffTime: string;
  wrExportExcel: boolean;
  wrExportPptx: boolean;
  templateId?: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  docType: "sph" | "po" | "mom" | "weekly_report" | "other";
  title: string;
  driveUrl?: string;
  driveFileId?: string;
  fileSizeKb?: number;
  docDate?: string;
  status: string;
  locked: boolean;
}

export interface PaymentTerm {
  id: string;
  projectId: string;
  milestoneName: string;
  pct: number;
  amount: number;
  plannedDate?: string;
  status: "pending" | "planned" | "paid";
}

export interface KickoffTeamMember {
  id: string;
  projectId: string;
  fullName: string;
  roleTitle?: string;
  party: "internal" | "customer";
  email?: string;
}

export interface PicMapping {
  id: string;
  projectId: string;
  memberId: string;
  positionName: string;
}

export interface TaskAddition {
  id: string;
  projectId: string;
  path: "jalur_a" | "jalur_b";
  taskName: string;
  phaseName?: string;
  estMd?: number;
  reasonCategory?: string;
  reasonText?: string;
  submittedBy?: string;
  approvedBy?: string;
  status: string;
}

export interface ClickUpSyncLog {
  id: string;
  projectId: string;
  direction: string;
  detail: string;
  status: string;
  createdAt: string;
}

export interface UnclassifiedClickUpTask {
  id: string;
  projectId: string;
  clickupTaskId: string;
  taskName: string;
  listName?: string;
}

export interface WeeklyReportPeriod {
  id: string;
  projectId: string;
  weekNumber: number;
  periodStart: string;
  periodEnd: string;
  publishedAt?: string;
  locked: boolean;
  snapshot?: Record<string, unknown>;
  revision: number;
}

export interface Notification {
  id: string;
  organizationId: string;
  projectId?: string;
  title: string;
  body?: string;
  actionLabel?: string;
  read: boolean;
  createdAt: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  message: string;
  createdAt: string;
}

export interface ClosingItem {
  id: string;
  projectId: string;
  itemKey: string;
  label: string;
  completed: boolean;
}

export interface PdccDatabase {
  organization: Organization;
  members: OrganizationMember[];
  positionRates: PositionRate[];
  holidays: Holiday[];
  templates: TaskTemplate[];
  projects: Project[];
  baselines: BaselineVersion[];
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  documents: ProjectDocument[];
  paymentTerms: PaymentTerm[];
  kickoffTeams: KickoffTeamMember[];
  picMappings: PicMapping[];
  taskAdditions: TaskAddition[];
  clickupLogs: ClickUpSyncLog[];
  unclassifiedTasks: UnclassifiedClickUpTask[];
  weeklyReports: WeeklyReportPeriod[];
  notifications: Notification[];
  activities: ProjectActivity[];
  closingChecklist: ClosingItem[];
  currentUserId: string;
  activeProjectId?: string;
}
