"use client";

import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { switchProjectAction } from "@/lib/actions/projects";
import { cn } from "@/lib/utils";

type ProjectOption = { id: string; name: string; customerName?: string };

export function ProjectSwitcher({
  projects,
  activeId,
  variant = "sidebar",
}: {
  projects: ProjectOption[];
  activeId: string;
  variant?: "sidebar" | "header";
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  if (projects.length === 0) return null;

  const routeMatch = pathname.match(/^\/projects\/([^/]+)/);
  const routeProjectId = routeMatch?.[1];
  const selectValue = routeProjectId ?? activeId;

  const onChange = (projectId: string) => {
    if (projectId === activeId && routeProjectId === projectId) return;
    startTransition(() => {
      void switchProjectAction(projectId);
    });
  };

  if (variant === "header") {
    return (
      <div className="relative inline-flex min-w-[200px] max-w-md items-center">
        <span className="mr-2 text-sm text-[var(--pdcc-muted)]">Project</span>
        <div className="relative flex-1">
          <select
            aria-label="Ganti project aktif"
            className={cn(
              "w-full cursor-pointer appearance-none rounded-lg border border-[var(--pdcc-border)] bg-white py-1.5 pl-3 pr-9 text-sm font-semibold text-[var(--pdcc-title)] outline-none focus:border-[var(--pdcc-indigo)] focus:ring-2 focus:ring-[var(--pdcc-indigo-soft)] disabled:opacity-60",
              pending && "opacity-70",
            )}
            value={selectValue}
            disabled={pending || projects.length < 2}
            onChange={(e) => onChange(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.customerName ? ` — ${p.customerName}` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--pdcc-muted)]" />
        </div>
      </div>
    );
  }

  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--pdcc-muted-light)]">
        Ganti project
      </span>
      <div className="relative mt-1.5">
        <select
          aria-label="Ganti project aktif"
          className="w-full cursor-pointer appearance-none rounded-md border border-slate-600 bg-slate-900/60 py-2 pl-2 pr-8 text-sm text-white outline-none focus:border-[var(--pdcc-indigo)] disabled:opacity-60"
          value={selectValue}
          disabled={pending || projects.length < 2}
          onChange={(e) => onChange(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.customerName ? ` — ${p.customerName}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}
