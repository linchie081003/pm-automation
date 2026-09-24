import { getPdccApiBaseUrl, pdccFetchInternal } from "@/lib/pdcc-api";

export function getPdccProxyBaseUrl(): string {
  const origin =
    process.env.PDCC_WEB_ORIGIN ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://127.0.0.1:3000";
  return `${origin.replace(/\/$/, "")}/api/pdcc`;
}

export async function readResponseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error(`Respons kosong dari ${res.url} (HTTP ${res.status})`);
  }
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new Error(
      `Backend mengembalikan HTML, bukan JSON (HTTP ${res.status}). ` +
        `Pastikan npm run dev jalan dan PDCC API di ${getPdccApiBaseUrl()} versi terbaru (wizardDrafts).`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`JSON tidak valid dari ${res.url}: ${trimmed.slice(0, 120)}…`);
  }
}

export async function pdccProxyFetch(path: string, init?: RequestInit): Promise<Response> {
  const normalized = path.replace(/^\//, "");
  return pdccFetchInternal(`${getPdccProxyBaseUrl()}/${normalized}`, init);
}
