import { loginFormAction } from "@/lib/actions/form-actions";
import { ServerActionForm } from "@/components/form/server-action-form";
import { getDb } from "@/lib/data/store";
import { PdccCard } from "@/components/pdcc-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const db = await getDb();
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pdcc-bg)] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--pdcc-indigo)] font-heading text-xl font-bold text-white">
            D
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--pdcc-muted)]">
              Delivery
            </p>
            <p className="font-heading text-lg font-semibold text-[var(--pdcc-title)]">
              Control Center
            </p>
          </div>
        </div>
        <PdccCard className="p-8">
          <h1 className="font-heading text-lg font-semibold text-[var(--pdcc-title)]">
            Project Delivery Control Center
          </h1>
          <p className="mt-1 text-sm text-[var(--pdcc-muted)]">
            Masuk dengan email pengguna demo
          </p>
          {params.error && (
            <p className="mt-4 rounded-lg bg-[var(--pdcc-danger-bg)] px-3 py-2 text-sm text-[var(--pdcc-danger-fg)]">
              Email tidak ditemukan.
            </p>
          )}
          <ServerActionForm action={loginFormAction} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" className="text-[var(--pdcc-body)]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue="ahmad.zakki@lmd.co.id"
                className="mt-1.5 border-[var(--pdcc-border)] bg-white placeholder:text-[var(--pdcc-muted-light)]"
              />
            </div>
            <Button type="submit" className="w-full">
              Masuk
            </Button>
          </ServerActionForm>
          <ul className="mt-6 space-y-1 border-t border-[var(--pdcc-border)] pt-4 text-xs text-[var(--pdcc-muted-light)]">
            {db.members.slice(0, 4).map((m) => (
              <li key={m.id}>
                {m.fullName} — {m.email}
              </li>
            ))}
          </ul>
        </PdccCard>
      </div>
    </div>
  );
}
