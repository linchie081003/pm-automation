import type { ClosingItem } from "@/lib/types";

export const CLOSING_CHECKLIST_TEMPLATE: ReadonlyArray<{
  itemKey: string;
  label: string;
}> = [
  { itemKey: "tasks_done", label: "Seluruh task Baseline selesai (Done di ClickUp)" },
  { itemKey: "uat_signoff", label: "UAT Sign-off diterima pelanggan" },
  { itemKey: "bast", label: "BAST Go Live ditandatangani kedua pihak" },
  { itemKey: "payment", label: "Seluruh milestone pembayaran tertagih dan lunas" },
  { itemKey: "docs", label: "Dokumentasi final diunggah ke Drive" },
];

export function defaultClosingChecklistForProject(
  projectId: string,
  idFactory: (prefix: string) => string = (prefix) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
): ClosingItem[] {
  return CLOSING_CHECKLIST_TEMPLATE.map((t) => ({
    id: idFactory("close"),
    projectId,
    itemKey: t.itemKey,
    label: t.label,
    completed: false,
  }));
}
