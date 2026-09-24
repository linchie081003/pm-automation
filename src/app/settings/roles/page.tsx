import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { RolePermissionMatrix } from "@/components/settings/role-permission-matrix";
import { SettingsNav } from "@/components/settings-nav";
import { resetRolePermissionsAction } from "@/lib/actions/settings";
import { getDb } from "@/lib/data/store";
import { currentUserCan, getPermissionMatrix } from "@/lib/rbac/access";
import { Button } from "@/components/ui/button";

export default async function RolesSettingsPage() {
  const db = await getDb();
  const canEdit = await currentUserCan(db, "settings.roles");
  const matrix = getPermissionMatrix(db);

  return (
    <AppShell title="Role & Permission">
      <PageHeader
        eyebrow="Settings"
        title="Role & Permission"
        subtitle="Matrix hak akses per peran — Delivery Manager selalu full access."
      />
      <SettingsNav active="/settings/roles" />

      {!canEdit ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Anda hanya dapat melihat matrix. Hubungi Delivery Manager untuk mengubah permission.
        </p>
      ) : (
        <form action={resetRolePermissionsAction} className="mb-4">
          <Button type="submit" variant="outline" size="sm">
            Reset ke default
          </Button>
        </form>
      )}

      <RolePermissionMatrix matrix={matrix} canEdit={canEdit} />
    </AppShell>
  );
}
