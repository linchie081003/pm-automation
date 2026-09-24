"use client";

import { Fragment, useTransition } from "react";
import { setRolePermissionAction } from "@/lib/actions/settings";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PERMISSION_GROUPS,
  ROLE_LABELS,
  ROLES_ORDER,
  type PermissionKey,
} from "@/lib/rbac/permissions";
import type { MemberRole } from "@/lib/types";

export function RolePermissionMatrix({
  matrix,
  canEdit,
}: {
  matrix: Record<MemberRole, Record<PermissionKey, boolean>>;
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--pdcc-border)] bg-[var(--pdcc-surface)]">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--pdcc-border)] bg-[var(--pdcc-border-light)]">
            <th className="px-4 py-3 text-left font-semibold text-[var(--pdcc-title)]">Permission</th>
            {ROLES_ORDER.map((role) => (
              <th
                key={role}
                className="px-3 py-3 text-center text-xs font-semibold text-[var(--pdcc-muted)]"
              >
                {ROLE_LABELS[role]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_GROUPS.map((group) => (
            <Fragment key={group.group}>
              <tr className="bg-[var(--pdcc-bg)]">
                <td
                  colSpan={ROLES_ORDER.length + 1}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--pdcc-muted)]"
                >
                  {group.group}
                </td>
              </tr>
              {group.permissions.map((perm) => (
                <tr key={perm.key} className="border-b border-[var(--pdcc-border-light)]">
                  <td className="px-4 py-2.5 text-[var(--pdcc-text)]">{perm.label}</td>
                  {ROLES_ORDER.map((role) => {
                    const checked = matrix[role][perm.key];
                    const locked = role === "delivery_manager" || !canEdit;
                    return (
                      <td key={role} className="px-3 py-2.5 text-center">
                        <Checkbox
                          checked={checked}
                          disabled={locked || pending}
                          onCheckedChange={(value) => {
                            if (locked) return;
                            const allowed = value === true;
                            startTransition(() =>
                              setRolePermissionAction(role, perm.key, allowed),
                            );
                          }}
                          aria-label={`${ROLE_LABELS[role]} — ${perm.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
