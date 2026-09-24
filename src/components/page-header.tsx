import { RagBadge } from "@/components/rag-badge";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  ragStatus,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ragStatus?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--pdcc-border)] pb-6 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pdcc-muted)]">
            {eyebrow}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold text-[var(--pdcc-title)]">
            {title}
          </h1>
          {ragStatus && <RagBadge status={ragStatus} />}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[var(--pdcc-muted)]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
