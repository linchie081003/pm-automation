import { cn } from "@/lib/utils";

const STEPS = [
  "SPH",
  "Baseline Draft",
  "Pre-Kick Off",
  "Kick Off",
  "Generate ClickUp",
  "Termin Bayar",
  "Weekly Report",
];

export function WizardStepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2">
      {STEPS.map((label, idx) => {
        const step = idx + 1;
        const active = step === current;
        const done = step < current;
        return (
          <li key={label} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                active &&
                  "border-[var(--pdcc-indigo)] bg-[var(--pdcc-indigo-soft)] text-[var(--pdcc-indigo)]",
                done &&
                  "border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] text-[var(--pdcc-muted)]",
                !active &&
                  !done &&
                  "border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] text-[var(--pdcc-muted-light)]",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  active && "bg-[var(--pdcc-indigo)] text-white",
                  done && "bg-[var(--pdcc-success-fg)] text-white",
                  !active && !done && "bg-[var(--pdcc-border-light)] text-[var(--pdcc-muted)]",
                )}
              >
                {done ? "✓" : step}
              </span>
              {label}
            </div>
            {step < STEPS.length && (
              <span className="hidden text-[var(--pdcc-border)] sm:inline">›</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
