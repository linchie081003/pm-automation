import { removeClosingChecklistItemAction } from "@/lib/actions/operations";
import { Button } from "@/components/ui/button";
import type { ClosingItem } from "@/lib/types";

export function ClosingChecklistRemove({
  item,
  projectId,
}: {
  item: ClosingItem;
  projectId: string;
}) {
  return (
    <form action={removeClosingChecklistItemAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="itemId" value={item.id} />
      <Button type="submit" variant="ghost" size="sm" disabled={item.completed}>
        Hapus
      </Button>
    </form>
  );
}
