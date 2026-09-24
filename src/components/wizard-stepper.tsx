import { cn } from "@/lib/utils";

const STEPS = [
  "SPH",
  "Baseline Draft",
  "Pre-Kick Off",
  "Kick Off",
  "ClickUp",
  "Termin",
  "Weekly Report",
];

export function WizardStepper({ current }: { current: number }) {
  const pct = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-xs font-medium text-[var(--pdcc-muted)]">
        <span>Progress wizard</span>
        <span>
          Langkah {current} / {STEPS.length}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-[var(--pdcc-border-light)]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--pdcc-indigo)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STEPS.map((label, idx) => {
          const step = idx + 1;
          const active = step === current;
          const done = step < current;
          return (
            <li
              key={label}
              className={cn(
                "rounded-lg border px-2 py-2 text-center text-[11px] font-medium leading-tight",
                active &&
                  "border-[var(--pdcc-indigo)] bg-[var(--pdcc-indigo-soft)] text-[var(--pdcc-indigo)]",
                done &&
                  "border-[var(--pdcc-success-fg)]/30 bg-[var(--pdcc-surface)] text-[var(--pdcc-success-fg)]",
                !active &&
                  !done &&
                  "border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] text-[var(--pdcc-muted-light)]",
              )}
            >
              <span
                className={cn(
                  "mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold",
                  active && "bg-[var(--pdcc-indigo)] text-white",
                  done && "bg-[var(--pdcc-success-fg)] text-white",
                  !active && !done && "bg-[var(--pdcc-border-light)] text-[var(--pdcc-muted)]",
                )}
              >
                {done ? "✓" : step}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
