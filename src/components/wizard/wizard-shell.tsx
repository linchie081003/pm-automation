import { WizardStepper } from "@/components/wizard-stepper";
import { BtnLink } from "@/components/btn-link";

const STEP_TITLES = [
  "Input SPH",
  "Baseline Draft",
  "Paket Pre-Kick Off",
  "Kick Off",
  "Generate ClickUp",
  "Termin Pembayaran",
  "Jadwal Weekly Report",
];

export function WizardShell({
  step,
  projectId,
  projectName,
  children,
}: {
  step: number;
  projectId: string;
  projectName: string;
  children: React.ReactNode;
}) {
  const prevStep = step > 1 ? step - 1 : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pdcc-indigo)]">
            Project Baru
          </p>
          <h1 className="font-heading mt-1 text-2xl font-bold text-[var(--pdcc-title)]">
            {STEP_TITLES[step - 1] ?? `Langkah ${step}`}
          </h1>
          <p className="mt-1 text-sm text-[var(--pdcc-muted)]">
            {projectName} • Langkah {step} dari 7
          </p>
        </div>
        <BtnLink href="/portfolio" variant="outline" size="sm">
          Batal ke Portfolio
        </BtnLink>
      </div>

      <WizardStepper current={step} />

      <div className="rounded-xl border border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm">
        {children}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        {prevStep ? (
          <BtnLink
            href={`/projects/new?projectId=${projectId}&step=${prevStep}`}
            variant="outline"
          >
            ← Kembali ke langkah {prevStep}
          </BtnLink>
        ) : (
          <span />
        )}
        <p className="text-xs text-[var(--pdcc-muted)]">
          Data tersimpan di database — navigasi mundur tidak menghapus isian.
        </p>
      </div>
    </div>
  );
}
