import { cookies } from "next/headers";
import type { MemberRole, PdccDatabase } from "@/lib/types";
import {
  type PermissionKey,
  resolveRolePermissions,
  roleHasPermission,
} from "@/lib/rbac/permissions";

export async function getSessionRole(db: PdccDatabase): Promise<MemberRole> {
  const jar = await cookies();
  const fromCookie = jar.get("pdcc_role")?.value as MemberRole | undefined;
  if (fromCookie) return fromCookie;
  const user = db.members.find((m) => m.id === db.currentUserId);
  return user?.role ?? "delivery_manager";
}

export function getPermissionMatrix(db: PdccDatabase) {
  return resolveRolePermissions(
    db.rolePermissionGrants?.map((g) => ({
      role: g.role as MemberRole,
      permissionKey: g.permissionKey as PermissionKey,
      allowed: g.allowed,
    })),
  );
}

export async function currentUserCan(
  db: PdccDatabase,
  permission: PermissionKey,
): Promise<boolean> {
  const role = await getSessionRole(db);
  const matrix = getPermissionMatrix(db);
  return roleHasPermission(matrix, role, permission);
}
