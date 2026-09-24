import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const toneStyles: Record<StatusTone, string> = {
  success: "bg-[var(--pdcc-success-bg)] text-[var(--pdcc-success-fg)]",
  warning: "bg-[var(--pdcc-warning-bg)] text-[var(--pdcc-warning-fg)]",
  danger: "bg-[var(--pdcc-danger-bg)] text-[var(--pdcc-danger-fg)]",
  info: "bg-[var(--pdcc-info-bg)] text-[var(--pdcc-info-fg)]",
  neutral: "bg-[var(--pdcc-border-light)] text-[var(--pdcc-muted)]",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ragToTone(status: string): StatusTone {
  switch (status) {
    case "on_track":
      return "success";
    case "at_risk":
      return "warning";
    case "off_track":
      return "danger";
    default:
      return "neutral";
  }
}
