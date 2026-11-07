"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, KeyRound, Shield } from "lucide-react";
import clsx from "clsx";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { name: "Ringkasan", href: "/admin", icon: LayoutDashboard },
  { name: "Jejak Audit", href: "/admin/audit", icon: History },
  { name: "Ganti Sandi", href: "/ganti-password", icon: KeyRound },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col justify-between border-r border-stone-200 bg-white">
      <div>
        <div className="flex items-center gap-3 border-b border-stone-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-800 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-sm font-bold leading-tight text-stone-900">
              Yayasan Nurjaman
            </span>
            <span className="block text-xs font-medium text-stone-500">
              Bongas Purwakarta
            </span>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 font-semibold text-emerald-900"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                )}
              >
                <Icon
                  className={clsx(
                    "h-4 w-4",
                    isActive ? "text-emerald-700" : "text-stone-400"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-stone-100 p-4 text-center text-xs text-stone-400">
        Panel Tata Kelola Kelembagaan
      </div>
    </aside>
  );
}
