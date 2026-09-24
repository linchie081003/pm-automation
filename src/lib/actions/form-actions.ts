"use server";

import { loginAction, logoutAction } from "@/lib/actions/auth";
import {
  saveProjectClickUpIntegrationAction,
  saveClickUpIntegrationAction,
} from "@/lib/actions/integrations";
import {
  addClosingChecklistItemAction,
  approveAdditionFormAction,
  approveRebaselineFormAction,
  linkDocumentDriveAction,
  markReadFormAction,
  removeClosingChecklistItemAction,
  seedClosingChecklistTemplateAction,
  submitProjectClosingFormAction,
  submitTaskAdditionAction,
  syncClickUpFormAction,
} from "@/lib/actions/operations";
import {
  cancelWizardAction,
  createProjectAction,
  deleteProjectAction,
  finishWizardAction,
  generateClickUpAction,
  saveBaselineDraftAction,
  saveKickoffAction,
  savePaymentTermsAction,
  savePreKickoffAction,
  saveSphStepAction,
  setActiveProjectAction,
} from "@/lib/actions/projects";
import {
  addHolidayAction,
  addPositionRateAction,
  addTemplatePhaseAction,
  addTemplateTaskAction,
  copyTemplateAction,
  createTemplateAction,
  deleteMemberAction,
  deleteTemplatePhaseAction,
  deleteTemplateTaskAction,
  inviteMemberAction,
  resetRolePermissionsAction,
  setMemberStatusAction,
  setTemplateActiveAction,
  updateMemberRoleAction,
} from "@/lib/actions/settings";
import { runFormAction, type FormActionState } from "@/lib/actions/form-action-state";

export type { FormActionState };

function bind(fn: (formData: FormData) => Promise<void>) {
  return async (_prev: FormActionState, formData: FormData) => runFormAction(() => fn(formData));
}

function bindVoid(fn: () => Promise<void>) {
  return async (_prev: FormActionState, _formData: FormData) => runFormAction(fn);
}

export const loginFormAction = bind(loginAction);
export const logoutFormAction = bindVoid(logoutAction);

export const saveClickUpIntegrationFormAction = bind(saveClickUpIntegrationAction);
export const saveProjectClickUpIntegrationFormAction = bind(saveProjectClickUpIntegrationAction);
export const syncClickUpFormActionBound = bind(syncClickUpFormAction);

export const addClosingChecklistItemFormAction = bind(addClosingChecklistItemAction);
export const removeClosingChecklistItemFormAction = bind(removeClosingChecklistItemAction);
export const seedClosingChecklistTemplateFormAction = bind(seedClosingChecklistTemplateAction);
export const submitProjectClosingFormActionBound = bind(submitProjectClosingFormAction);
export const submitTaskAdditionFormAction = bind(submitTaskAdditionAction);
export const approveAdditionFormActionBound = bind(approveAdditionFormAction);
export const approveRebaselineFormActionBound = bind(approveRebaselineFormAction);
export const linkDocumentDriveFormAction = bind(linkDocumentDriveAction);
export const markReadFormActionBound = bind(markReadFormAction);

export const cancelWizardFormAction = bind(cancelWizardAction);
export const createProjectFormAction = bindVoid(createProjectAction);
export const deleteProjectFormAction = bind(deleteProjectAction);
export const setActiveProjectFormAction = bind(setActiveProjectAction);
export const saveSphStepFormAction = bind(saveSphStepAction);
export const saveBaselineDraftFormAction = bind(saveBaselineDraftAction);
export const savePreKickoffFormAction = bind(savePreKickoffAction);
export const saveKickoffFormAction = bind(saveKickoffAction);
export const generateClickUpFormAction = bind(generateClickUpAction);
export const savePaymentTermsFormAction = bind(savePaymentTermsAction);
export const finishWizardFormAction = bind(finishWizardAction);

export const addHolidayFormAction = bind(addHolidayAction);
export const inviteMemberFormAction = bind(inviteMemberAction);
export const setMemberStatusFormAction = bind(setMemberStatusAction);
export const deleteMemberFormAction = bind(deleteMemberAction);
export const updateMemberRoleFormAction = bind(updateMemberRoleAction);
export const resetRolePermissionsFormAction = bindVoid(resetRolePermissionsAction);
export const addPositionRateFormAction = bind(addPositionRateAction);
export const createTemplateFormAction = bind(createTemplateAction);
export const copyTemplateFormAction = bind(copyTemplateAction);
export const setTemplateActiveFormAction = bind(setTemplateActiveAction);
export const deleteTemplatePhaseFormAction = bind(deleteTemplatePhaseAction);
export const deleteTemplateTaskFormAction = bind(deleteTemplateTaskAction);
export const addTemplateTaskFormAction = bind(addTemplateTaskAction);
export const addTemplatePhaseFormAction = bind(addTemplatePhaseAction);
