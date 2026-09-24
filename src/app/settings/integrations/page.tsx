import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings-nav";
import { saveClickUpIntegrationAction } from "@/lib/actions/integrations";
import { getDb } from "@/lib/data/store";
import { apiLoadIntegrations } from "@/lib/pdcc-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function IntegrationsSettingsPage() {
  const db = await getDb();
  const config = await apiLoadIntegrations(db.organization.id);

  return (
    <AppShell title="Integrasi">
      <PageHeader
        eyebrow="Settings"
        title="Integrasi ClickUp"
        subtitle="Fallback organisasi jika project belum punya token/Space sendiri (ClickUp Sync → per project)."
      />
      <SettingsNav active="/settings/integrations" />

      <form
        action={saveClickUpIntegrationAction}
        className="max-w-xl space-y-4 rounded-xl border border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] p-6 shadow-sm"
      >
        <div>
          <Label htmlFor="clickupApiToken">ClickUp API Token</Label>
          <Input
            id="clickupApiToken"
            name="clickupApiToken"
            type="password"
            autoComplete="off"
            placeholder={
              config.hasClickUpToken
                ? "•••••••• (tersimpan — kosongkan untuk tidak mengubah)"
                : "pk_..."
            }
          />
          <p className="mt-1 text-xs text-[var(--pdcc-muted)]">
            Buat token di ClickUp → Settings → Apps. Nilai tidak ditampilkan ulang setelah disimpan.
          </p>
        </div>
        <div>
          <Label htmlFor="clickupWorkspaceId">Workspace ID</Label>
          <Input
            id="clickupWorkspaceId"
            name="clickupWorkspaceId"
            defaultValue={config.clickupWorkspaceId ?? ""}
            placeholder="12345678"
          />
        </div>
        <div>
          <Label htmlFor="clickupSpaceId">Space ID (target folder project)</Label>
          <Input
            id="clickupSpaceId"
            name="clickupSpaceId"
            defaultValue={config.clickupSpaceId ?? ""}
            placeholder="90123456789"
          />
        </div>
        <Button type="submit">Simpan konfigurasi</Button>
      </form>

      <p className="mt-4 max-w-xl text-xs text-[var(--pdcc-muted)]">
        Backend API: <code className="text-[var(--pdcc-body)]">http://127.0.0.1:4000/api/v1/settings/integrations</code>
      </p>
    </AppShell>
  );
}
