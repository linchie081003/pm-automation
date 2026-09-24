"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type ProjectOption = { id: string; name: string; customerName?: string };

export function ProjectSwitcher({
  projects,
  activeId,
}: {
  projects: ProjectOption[];
  activeId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (projects.length === 0) return null;

  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--pdcc-muted-light)]">
        Ganti project
      </span>
      <select
        className="mt-1.5 w-full rounded-md border border-slate-600 bg-slate-900/60 px-2 py-2 text-sm text-white outline-none focus:border-[var(--pdcc-indigo)] disabled:opacity-60"
        value={activeId}
        disabled={pending}
        onChange={(e) => {
          const projectId = e.target.value;
          startTransition(async () => {
            await fetch("/api/v1/projects/active", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            router.refresh();
            router.push(`/projects/${projectId}/dashboard`);
          });
        }}
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
            {p.customerName ? ` — ${p.customerName}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
