import type { MemberRole } from "@/lib/types";

export type PermissionKey =
  | "portfolio.view"
  | "portfolio.create"
  | "portfolio.delete_draft"
  | "project.dashboard"
  | "baseline.view"
  | "baseline.approve"
  | "clickup.sync"
  | "tasks.view"
  | "tasks.edit"
  | "documents.manage"
  | "budget.view"
  | "budget.edit"
  | "weekly_report.manage"
  | "closing.manage"
  | "settings.users"
  | "settings.roles"
  | "settings.templates"
  | "settings.integrations"
  | "settings.rates";

export const PERMISSION_GROUPS: {
  group: string;
  permissions: { key: PermissionKey; label: string }[];
}[] = [
  {
    group: "Portfolio",
    permissions: [
      { key: "portfolio.view", label: "Lihat portfolio" },
      { key: "portfolio.create", label: "Buat project baru (wizard)" },
      { key: "portfolio.delete_draft", label: "Hapus draft project kosong" },
    ],
  },
  {
    group: "Delivery",
    permissions: [
      { key: "project.dashboard", label: "Dashboard project" },
      { key: "baseline.view", label: "Baseline & GAP" },
      { key: "baseline.approve", label: "Setujui rebaseline" },
      { key: "clickup.sync", label: "ClickUp sync" },
      { key: "tasks.view", label: "Task recap (internal)" },
      { key: "tasks.edit", label: "Edit task / jalur tambahan" },
      { key: "documents.manage", label: "Dokumen & Drive" },
      { key: "budget.view", label: "Lihat budget" },
      { key: "budget.edit", label: "Edit budget" },
      { key: "weekly_report.manage", label: "Weekly report" },
      { key: "closing.manage", label: "Checklist & ajukan closing" },
    ],
  },
  {
    group: "Pengaturan organisasi",
    permissions: [
      { key: "settings.users", label: "Kelola pengguna" },
      { key: "settings.roles", label: "Kelola role & permission" },
      { key: "settings.templates", label: "Task template library" },
      { key: "settings.integrations", label: "Integrasi ClickUp" },
      { key: "settings.rates", label: "Harga resource" },
    ],
  },
];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

export const ROLE_LABELS: Record<MemberRole, string> = {
  delivery_manager: "Delivery Manager",
  pm: "Project Manager",
  team_member: "Anggota Tim",
  finance: "Finance",
  customer: "Pelanggan",
};

export const ROLES_ORDER: MemberRole[] = [
  "delivery_manager",
  "pm",
  "team_member",
  "finance",
  "customer",
];

/** Default matrix — dapat dioverride per organisasi di DB. */
export const DEFAULT_ROLE_PERMISSIONS: Record<MemberRole, PermissionKey[]> = {
  delivery_manager: [...ALL_PERMISSION_KEYS],
  pm: [
    "portfolio.view",
    "portfolio.create",
    "project.dashboard",
    "baseline.view",
    "baseline.approve",
    "clickup.sync",
    "tasks.view",
    "tasks.edit",
    "documents.manage",
    "budget.view",
    "budget.edit",
    "weekly_report.manage",
    "closing.manage",
    "settings.templates",
  ],
  team_member: [
    "portfolio.view",
    "project.dashboard",
    "baseline.view",
    "tasks.view",
    "documents.manage",
    "clickup.sync",
    "weekly_report.manage",
  ],
  finance: ["portfolio.view", "project.dashboard", "budget.view", "documents.manage"],
  customer: ["portfolio.view", "project.dashboard", "tasks.view", "documents.manage"],
};

export type RolePermissionGrant = {
  role: MemberRole;
  permissionKey: PermissionKey;
  allowed: boolean;
};

export function buildDefaultGrants(): RolePermissionGrant[] {
  const grants: RolePermissionGrant[] = [];
  for (const role of ROLES_ORDER) {
    const allowedSet = new Set(DEFAULT_ROLE_PERMISSIONS[role]);
    for (const key of ALL_PERMISSION_KEYS) {
      grants.push({ role, permissionKey: key, allowed: allowedSet.has(key) });
    }
  }
  return grants;
}

export function grantsToMatrix(
  grants: RolePermissionGrant[],
): Record<MemberRole, Record<PermissionKey, boolean>> {
  const matrix = {} as Record<MemberRole, Record<PermissionKey, boolean>>;
  for (const role of ROLES_ORDER) {
    matrix[role] = {} as Record<PermissionKey, boolean>;
    for (const key of ALL_PERMISSION_KEYS) {
      matrix[role][key] = false;
    }
  }
  for (const g of grants) {
    if (matrix[g.role]) {
      matrix[g.role][g.permissionKey] = g.allowed;
    }
  }
  return matrix;
}

export function resolveRolePermissions(
  grants: RolePermissionGrant[] | undefined,
): Record<MemberRole, Record<PermissionKey, boolean>> {
  const source = grants?.length ? grants : buildDefaultGrants();
  return grantsToMatrix(source);
}

export function roleHasPermission(
  matrix: Record<MemberRole, Record<PermissionKey, boolean>>,
  role: MemberRole,
  permission: PermissionKey,
): boolean {
  return matrix[role]?.[permission] ?? false;
}
