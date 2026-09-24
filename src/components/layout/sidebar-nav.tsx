"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  GitCompare,
  RefreshCw,
  ListChecks,
  FileText,
  Wallet,
  CalendarRange,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavIconKey =
  | "folder-kanban"
  | "layout-dashboard"
  | "git-compare"
  | "refresh-cw"
  | "list-checks"
  | "file-text"
  | "wallet"
  | "calendar-range"
  | "settings";

const iconMap: Record<NavIconKey, LucideIcon> = {
  "folder-kanban": FolderKanban,
  "layout-dashboard": LayoutDashboard,
  "git-compare": GitCompare,
  "refresh-cw": RefreshCw,
  "list-checks": ListChecks,
  "file-text": FileText,
  wallet: Wallet,
  "calendar-range": CalendarRange,
  settings: Settings,
};

export function SidebarNav({
  items,
}: {
  items: { href: string; label: string; iconKey: NavIconKey }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 text-sm">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = iconMap[item.iconKey];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium transition-colors",
              active
                ? "bg-[var(--pdcc-indigo)] text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100",
            )}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
