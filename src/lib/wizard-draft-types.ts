import type { SphTimelineRow } from "@/lib/domain/sph-timeline";
import type {
  BaselineVersion,
  ClickUpSyncLog,
  PaymentTerm,
  Project,
  ProjectPhase,
  ProjectTask,
} from "@/lib/types";

export interface PreKickoffBrief {
  background: string;
  scopeOfWork: string;
  nonScopeOfWork: string;
  orgStructure: string;
  deliverables: string;
  nextActivities: string;
}

/** Data sementara wizard — belum masuk portfolio sampai commit langkah 7. */
export interface WizardDraftPayload {
  project: Project;
  baselines: BaselineVersion[];
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  paymentTerms: PaymentTerm[];
  clickupLogs: ClickUpSyncLog[];
  /** Timeline dari SPH (hari kerja per tahap) — sumber baseline draft. */
  sphTimeline: SphTimelineRow[];
  preKickoffBrief: PreKickoffBrief;
}

export interface WizardDraftRecord {
  draftId: string;
  organizationId: string;
  wizardStep: number;
  payload: WizardDraftPayload;
}
