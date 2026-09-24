import Link from "next/link";

const links = [
  { href: "/settings/users", label: "User management" },
  { href: "/settings/roles", label: "Role & permission" },
  { href: "/settings/templates", label: "Templates" },
  { href: "/settings/resource-rates", label: "Resource rates" },
  { href: "/settings/integrations", label: "Integrasi" },
];

export function SettingsNav({ active }: { active: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-3 text-sm">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={
            active === l.href
              ? "font-medium text-[var(--pdcc-indigo)]"
              : "text-[var(--pdcc-muted)] hover:text-[var(--pdcc-indigo)]"
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
