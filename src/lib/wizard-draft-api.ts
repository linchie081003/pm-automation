import { pdccProxyFetch, readResponseJson } from "@/lib/pdcc-http";
import type { Project } from "@/lib/types";
import type { WizardDraftPayload, WizardDraftRecord } from "@/lib/wizard-draft-types";

async function readError(res: Response): Promise<string> {
  try {
    const body = await readResponseJson<{ error?: string }>(res.clone());
    return body.error ?? res.statusText;
  } catch (e) {
    return e instanceof Error ? e.message : res.statusText;
  }
}

async function wizardFetch(path: string, init?: RequestInit): Promise<Response> {
  return pdccProxyFetch(`v1/${path.replace(/^\//, "")}`, init);
}

export async function apiCreateWizardDraft(
  organizationId: string,
  project: Project,
): Promise<WizardDraftRecord> {
  const url = "wizard-drafts";
  const res = await wizardFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId, project }),
  });
  if (!res.ok) {
    const detail = await readError(res);
    // #region agent log
    fetch("http://127.0.0.1:7879/ingest/af1f273b-afa0-4ebf-a265-d1a5fdd00f6f", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "df436c" },
      body: JSON.stringify({
        sessionId: "df436c",
        runId: "wizard-html",
        hypothesisId: "W4",
        location: "wizard-draft-api.ts:apiCreateWizardDraft",
        message: "Create wizard draft failed",
        data: { status: res.status, detail },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    throw new Error(`Buat draft wizard gagal: ${detail}`);
  }
  return readResponseJson<WizardDraftRecord>(res);
}

export async function apiGetWizardDraftByProjectId(
  projectId: string,
): Promise<WizardDraftRecord | null> {
  const res = await wizardFetch(`wizard-drafts/by-project/${encodeURIComponent(projectId)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Draft wizard by project gagal: ${await readError(res)}`);
  }
  return readResponseJson<WizardDraftRecord>(res);
}

export async function apiGetWizardDraft(draftId: string): Promise<WizardDraftRecord> {
  const res = await wizardFetch(`wizard-drafts/${encodeURIComponent(draftId)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Draft wizard tidak ditemukan: ${await readError(res)}`);
  }
  return readResponseJson<WizardDraftRecord>(res);
}

export async function apiUpdateWizardDraft(
  draftId: string,
  payload: WizardDraftPayload,
): Promise<void> {
  const res = await wizardFetch(`wizard-drafts/${encodeURIComponent(draftId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) {
    throw new Error(`Simpan draft wizard gagal: ${await readError(res)}`);
  }
}

export async function apiDeleteWizardDraft(draftId: string): Promise<void> {
  const res = await wizardFetch(`wizard-drafts/${encodeURIComponent(draftId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Hapus draft wizard gagal: ${await readError(res)}`);
  }
}

export async function apiCommitWizardDraft(draftId: string): Promise<{ projectId: string }> {
  const res = await wizardFetch(`wizard-drafts/${encodeURIComponent(draftId)}/commit`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Selesaikan wizard gagal: ${await readError(res)}`);
  }
  return readResponseJson<{ projectId: string }>(res);
}
