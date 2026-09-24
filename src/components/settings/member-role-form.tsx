"use client";

import { useFormStatus } from "react-dom";
import { updateMemberRoleAction } from "@/lib/actions/settings";
import { ROLE_LABELS, ROLES_ORDER } from "@/lib/rbac/permissions";
import type { MemberRole } from "@/lib/types";
import { Button } from "@/components/ui/button";

function SaveRoleButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      Simpan
    </Button>
  );
}

export function MemberRoleForm({
  memberId,
  currentRole,
}: {
  memberId: string;
  currentRole: MemberRole;
}) {
  return (
    <form action={updateMemberRoleAction} className="flex items-center gap-2">
      <input type="hidden" name="memberId" value={memberId} />
      <select
        name="role"
        defaultValue={currentRole}
        className="rounded-md border border-[var(--pdcc-border)] bg-white px-2 py-1 text-sm"
      >
        {ROLES_ORDER.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      <SaveRoleButton />
    </form>
  );
}
