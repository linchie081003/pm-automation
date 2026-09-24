import type { PdccDatabase } from "@/lib/types";

export function getPdccApiBaseUrl(): string {
  const url =
    process.env.PDCC_API_URL ??
    process.env.NEXT_PUBLIC_PDCC_API_URL ??
    "http://127.0.0.1:4000";
  return url.replace(/\/$/, "");
}

function apiUnavailableMessage(): string {
  return (
    `Backend PDCC tidak reachable di ${getPdccApiBaseUrl()} (ECONNREFUSED). ` +
    `Jalankan dari root: npm run dev (bukan hanya next dev) — atau di terminal terpisah: npm run dev:api.`
  );
}

export async function pdccFetchInternal(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (e) {
    const code =
      e instanceof Error && "cause" in e
        ? (e.cause as { code?: string })?.code
        : undefined;
    if (code === "ECONNREFUSED" || (e instanceof TypeError && e.message === "fetch failed")) {
      throw new Error(apiUnavailableMessage(), { cause: e });
    }
    throw e;
  }
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function apiLoadState(): Promise<PdccDatabase> {
  const res = await pdccFetchInternal(`${getPdccApiBaseUrl()}/api/v1/state`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `PDCC API GET /state gagal (${res.status}): ${await readError(res)}. Pastikan backend berjalan (npm run dev:api).`,
    );
  }
  return res.json() as Promise<PdccDatabase>;
}

export async function apiSaveState(db: PdccDatabase): Promise<void> {
  const res = await pdccFetchInternal(`${getPdccApiBaseUrl()}/api/v1/state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(db),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `PDCC API PUT /state gagal (${res.status}): ${await readError(res)}`,
    );
  }
}

export interface ApiIntegrations {
  organizationId: string;
  clickupWorkspaceId: string;
  clickupSpaceId: string;
  hasClickUpToken: boolean;
  clickupApiToken?: string;
}

export async function apiLoadIntegrations(
  organizationId: string,
): Promise<ApiIntegrations> {
  const q = new URLSearchParams({ organizationId });
  const res = await pdccFetchInternal(
    `${getPdccApiBaseUrl()}/api/v1/settings/integrations?${q}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`PDCC API integrations GET gagal: ${await readError(res)}`);
  }
  return res.json() as Promise<ApiIntegrations>;
}

export async function apiDeleteProject(projectId: string): Promise<void> {
  const base = getPdccApiBaseUrl();
  let res = await pdccFetchInternal(`${base}/api/v1/projects/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  });
  if (res.status === 404) {
    res = await pdccFetchInternal(`${base}/api/v1/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
    });
  }
  if (!res.ok) {
    throw new Error(`Hapus project gagal: ${await readError(res)}`);
  }
}

export async function apiSaveIntegrations(body: {
  organizationId: string;
  clickupApiToken?: string;
  clickupWorkspaceId?: string;
  clickupSpaceId?: string;
}): Promise<void> {
  const res = await pdccFetchInternal(`${getPdccApiBaseUrl()}/api/v1/settings/integrations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`PDCC API integrations PUT gagal: ${await readError(res)}`);
  }
}
