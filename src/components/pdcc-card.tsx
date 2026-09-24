import { cn } from "@/lib/utils";

export function PdccCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PdccCardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "font-heading text-base font-semibold text-[var(--pdcc-title)]",
        className,
      )}
    >
      {children}
    </h3>
  );
}
