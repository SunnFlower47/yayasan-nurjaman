import type { ReactNode } from "react";
import { requireUser, getUserRoles, getUserPermissions } from "@/modules/auth";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const sessionWithUser = await requireUser({ allowMustChangePassword: true });

  // Jika akun diwajibkan ganti kata sandi, tampilkan fokus halaman tanpa navigasi luar
  if (sessionWithUser.user.mustChangePassword) {
    return <div className="min-h-screen bg-stone-50">{children}</div>;
  }

  const [roles, permissions] = await Promise.all([
    getUserRoles(sessionWithUser.user.id),
    getUserPermissions(sessionWithUser.user.id),
  ]);

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-emerald-800 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-md"
      >
        Lewati ke konten utama
      </a>
      <AdminSidebar permissions={permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader user={sessionWithUser.user} roles={roles} />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 p-6 sm:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
