import Link from "next/link";
import { cookies } from "next/headers";
import { Bell } from "lucide-react";
import {
  SidebarNav,
  type NavIconKey,
} from "@/components/layout/sidebar-nav";
import { getDb } from "@/lib/data/store";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const navConfig: {
  key: string;
  label: string;
  iconKey: NavIconKey;
  project?: boolean;
}[] = [
  { key: "/portfolio", label: "Portfolio", iconKey: "folder-kanban" },
  { key: "/dashboard", label: "Dashboard", iconKey: "layout-dashboard", project: true },
  { key: "/baseline", label: "Baseline & GAP", iconKey: "git-compare", project: true },
  { key: "/clickup", label: "ClickUp Sync", iconKey: "refresh-cw", project: true },
  { key: "/task-recap", label: "Task Recap", iconKey: "list-checks", project: true },
  { key: "/documents", label: "Dokumen", iconKey: "file-text", project: true },
  { key: "/budget", label: "Budget", iconKey: "wallet", project: true },
  { key: "/weekly-report", label: "Weekly Report", iconKey: "calendar-range", project: true },
  { key: "/settings/templates", label: "Settings", iconKey: "settings" },
];

export async function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const db = await getDb();
  const jar = await cookies();
  const userId = jar.get("pdcc_session")?.value ?? db.currentUserId;
  const user = db.members.find((m) => m.id === userId);
  const activeId = db.activeProjectId ?? db.projects[0]?.id;
  const activeProject = db.projects.find((p) => p.id === activeId);

  const projectPaths: Record<string, string> = {
    "/dashboard": "dashboard",
    "/baseline": "baseline",
    "/clickup": "clickup",
    "/task-recap": "task-recap",
    "/documents": "documents",
    "/budget": "budget",
    "/weekly-report": "weekly-report",
  };

  const navItems = navConfig.map((item) => {
    const href =
      item.project && activeId && projectPaths[item.key]
        ? `/projects/${activeId}/${projectPaths[item.key]}`
        : item.key;
    return { href, label: item.label, iconKey: item.iconKey };
  });

  return (
    <div className="flex min-h-screen bg-[var(--pdcc-bg)]">
      <aside className="flex w-[260px] shrink-0 flex-col bg-[var(--pdcc-navy)] text-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-700/80 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--pdcc-indigo)] font-heading text-lg font-bold text-white">
            D
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--pdcc-muted-light)]">
              Delivery
            </p>
            <p className="font-heading text-sm font-semibold text-white">Control Center</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-3 py-4">
          <SidebarNav items={navItems} />
        </div>

        {activeProject && (
          <div className="mx-3 mb-3 rounded-lg border border-slate-600/60 bg-slate-800/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--pdcc-muted-light)]">
              Project Aktif
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-white">
              {activeProject.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {activeProject.customerName}
              {activeProject.sphNumber ? ` • ${activeProject.sphNumber.split("-").slice(-2).join("-")}` : ""}
            </p>
          </div>
        )}

        <div className="border-t border-slate-700/80 px-4 py-4">
          <p className="text-xs text-slate-300">
            {user?.fullName ?? "User"}
            <span className="block text-[10px] capitalize text-slate-500">
              {user?.role.replace("_", " ")}
            </span>
          </p>
          <form action={logoutAction} className="mt-3">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
            >
              Keluar
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--pdcc-border)] bg-[var(--pdcc-surface)] px-8 py-3">
          <p className="text-sm text-[var(--pdcc-muted)]">
            {activeProject ? (
              <>
                Project{" "}
                <span className="font-medium text-[var(--pdcc-title)]">{activeProject.name}</span>
              </>
            ) : (
              "Portfolio"
            )}
          </p>
          <Link
            href="/notifications"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[var(--pdcc-muted)] hover:bg-[var(--pdcc-border-light)]"
          >
            <Bell className="h-4 w-4" />
            Notifikasi
          </Link>
        </header>
        <main className="flex-1 overflow-auto px-8 py-6">
          {title && (
            <h2 className="mb-6 text-xl font-semibold text-[var(--pdcc-text)] sr-only">
              {title}
            </h2>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
