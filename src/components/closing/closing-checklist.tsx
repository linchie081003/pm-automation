"use client";

import { useTransition } from "react";
import { markClosingItemCompleteAction } from "@/lib/actions/operations";
import { Checkbox } from "@/components/ui/checkbox";
import type { ClosingItem } from "@/lib/types";

export function ClosingChecklistItem({
  item,
  projectId,
  readOnly,
}: {
  item: ClosingItem;
  projectId: string;
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (item.completed) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-[var(--pdcc-border)] bg-[var(--pdcc-border-light)]/40 px-3 py-2.5">
        <Checkbox checked disabled className="mt-0.5" />
        <span className="text-sm text-[var(--pdcc-muted-light)] line-through">{item.label}</span>
      </div>
    );
  }

  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-md border border-[var(--pdcc-border)] px-3 py-2.5 transition-colors hover:bg-[var(--pdcc-border-light)]/50 ${readOnly || pending ? "pointer-events-none opacity-60" : ""}`}
    >
      <Checkbox
        checked={false}
        disabled={readOnly || pending}
        className="mt-0.5"
        onCheckedChange={(checked) => {
          if (checked !== true || readOnly) return;
          startTransition(() => markClosingItemCompleteAction(item.id, projectId));
        }}
      />
      <span className="text-sm text-[var(--pdcc-title)]">{item.label}</span>
    </label>
  );
}
