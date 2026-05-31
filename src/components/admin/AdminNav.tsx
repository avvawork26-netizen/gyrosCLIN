"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/punches", label: "Punches" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((t) => {
        const active =
          t.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`tag ${
              active
                ? "bg-burnt text-bone border-burnt"
                : "text-muted hover:text-bone"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
